import "@std/dotenv/load";
import { Lobby, wc3stats } from "./sources/wc3stats.ts";
import { Alert, db, Rule } from "./sources/kv.ts";
import { discord } from "./sources/discord.ts";
import { DiscordAPIError } from "npm:@discordjs/rest@2.2.0";

const process = (rule: Rule, lobby: Lobby): boolean => {
  switch (rule.type) {
    case "term": {
      const value = lobby[rule.key];
      return value
        ? typeof rule.value === "string"
          ? value.includes(rule.value)
          : !!value.match(rule.value)
        : false;
    }
    case "or":
      return rule.rules.some((rule) => process(rule, lobby));
    case "and":
      return rule.rules.every((rule) => process(rule, lobby));
  }
};

const ruleToFilter =
  (rule: Rule): (lobby: Lobby) => boolean => (lobby: Lobby): boolean =>
    process(rule, lobby);

const colors = {
  alive: 0x6edb6f,
  missing: 0xe69500,
  dead: 0xff7d9c,
};

const getEmbed = (lobby: Lobby, status: "alive" | "missing" | "dead") => ({
  color: colors[status],
  title: lobby.map,
  fields: [
    { name: "Game name", value: lobby.name },
    { name: "Hosted by", value: lobby.host, inline: true },
    { name: "Realm", value: lobby.server, inline: true },
    {
      name: "Players",
      value: `${lobby.slotsTaken}/${lobby.slotsTotal}`,
      inline: true,
    },
  ],
});

const onNewLobby = async (lobby: Lobby, alerts: Alert[]) => {
  console.debug(new Date(), "New lobby", lobby.name);
  const results = await Promise.all(
    alerts
      .filter((a) => ruleToFilter(a.rule)(lobby))
      .map(async (alert) => {
        try {
          const message = await discord.channels.createMessage(alert.channel, {
            content: alert.message,
            embeds: [getEmbed(lobby, "alive")],
          });
          console.log(
            new Date(),
            "Posted lobby",
            lobby.name,
            "in channel",
            alert.channel,
          );
          return { channel: alert.channel, message: message.id };
        } catch (err) {
          if (!(err instanceof DiscordAPIError)) {
            console.error(
              "Error posting message in channel",
              alert.channel,
              err,
            );
          } else if (
            err.code === 50001 || err.code === 50007 || err.code === 50013
          ) {
            console.warn(
              new Date(),
              "Lacking permission to send messages, removing alert channel",
              alert.channel,
            );
            db.alerts.delete(alert.channel);
          } else {
            console.error(
              "Error posting message in channel",
              alert.channel,
              err,
            );
          }
        }
      }),
  );
  return results.filter(<T>(v: T | undefined): v is T => !!v);
};

const updateMessage = async (
  channel: string,
  message: string,
  lobby: Lobby,
  status: "alive" | "missing" | "dead",
) => {
  try {
    await discord.channels.editMessage(channel, message, {
      embeds: [getEmbed(lobby, status)],
    });
    console.log(
      new Date(),
      "Updated lobby",
      lobby.name,
      "in channel",
      channel,
      "with status",
      status,
      `${lobby.slotsTaken}/${lobby.slotsTotal}`,
    );
  } catch (err) {
    if (!(err instanceof DiscordAPIError)) {
      console.error("Error updating message in channel", channel, err);
    } else if (err.code === 10008) {
      console.warn(new Date(), "Message deleted in channel", channel);
      lobby.messages = lobby.messages.filter((m) => m.message !== message);
    } else console.error("Error updating message in channel", channel, err);
  }
};

const onUpdateLobby = async (lobby: Lobby) => {
  console.debug(new Date(), "Updating lobby", lobby.name);
  await Promise.all(
    lobby.messages.map(({ channel, message }) =>
      updateMessage(channel, message, lobby, "alive")
    ),
  );
};

const onMissingLobby = async (lobby: Lobby) => {
  console.debug(new Date(), "Missing lobby", lobby.name);
  await Promise.all(
    lobby.messages.map(({ channel, message }) =>
      updateMessage(channel, message, lobby, "missing")
    ),
  );
};

const onDeadLobby = async (lobby: Lobby) => {
  console.debug(new Date(), "Dead lobby", lobby.name);
  await Promise.all(
    lobby.messages.map(({ channel, message }) =>
      updateMessage(channel, message, lobby, "dead")
    ),
  );
};

const updateLobbies = async () => {
  const [newLobbies, oldLobbies, alerts] = await Promise.all([
    wc3stats.gamelist(),
    db.lobbies.find("lobbies").then((v) => v?.value ?? []),
    db.alerts.getMany().then((v) => v.result.map((v) => v.value)),
  ]);

  for (const newLobby of newLobbies) {
    const oldLobby = oldLobbies.find((l) => l.id === newLobby.id);
    if (!oldLobby) {
      newLobby.messages = await onNewLobby(newLobby, alerts);
    } else {
      newLobby.messages = oldLobby.messages;
      if ((newLobby.slotsTaken !== oldLobby.slotsTaken) || oldLobby.deadAt) {
        await onUpdateLobby(newLobby);
      }
    }
  }

  for (const oldLobby of oldLobbies) {
    const newLobby = newLobbies.find((l) => l.id === oldLobby.id);
    if (!newLobby) {
      if (!oldLobby.deadAt) {
        await onMissingLobby(oldLobby);
        oldLobby.deadAt = Date.now() + 1000 * 60 * 5;
        newLobbies.push(oldLobby);
      } else if (oldLobby.deadAt < Date.now()) await onDeadLobby(oldLobby);
      else newLobbies.push(oldLobby);
    }
  }

  db.lobbies.set("lobbies", newLobbies, { overwrite: true });
};

if (!Deno.env.get("DISABLE_LIVE_LOBBIES")) {
  Deno.cron("lobbies", "* * * * *", () => {
    updateLobbies();
    for (let i = 1; i <= 5; i++) setTimeout(updateLobbies, i * 10000);
  });

  updateLobbies();
}
