import {
  AllowedMentionsTypes,
  APIInteractionResponse,
  APIModalSubmitInteraction,
  InteractionResponseType,
} from "npm:discord-api-types/v10";
import { z } from "npm:zod";
import { discord } from "../sources/discord.ts";
import { upsertAlert, zAlertKey } from "../sources/w3xio.ts";

const zSubmitProps = z.object({
  message: z.string().optional().transform((v) => v ? v : undefined),
  map: z.string().optional().transform((v) => v ? v : undefined),
  host: z.string().optional().transform((v) => v ? v : undefined),
  name: z.string().optional().transform((v) => v ? v : undefined),
  server: z.string().optional().transform((v) => v ? v : undefined),
});

const enrichMessage = async (
  message: string | undefined,
  guildId: string | undefined,
) => {
  if (!message) return;
  const mentions = Array.from(
    new Set(
      Array.from(message.matchAll(/@\w+(?: \w+)*/g)).flatMap((m) =>
        m[0].split(" ").map((_, i, words) =>
          words.slice(0, i + 1).join(" ").slice(1)
        )
          .reverse()
      ),
    ),
  )
    .filter((m) => m !== "everyone" && m !== "here");
  if (!mentions.length) return message;

  const roles = guildId ? await discord.guilds.getRoles(guildId) : [];

  for (const mention of mentions) {
    const role = roles.find((r) => r.name === mention);
    if (role) {
      message = message.replace(
        new RegExp(`@${mention}`, "g"),
        `<@&${role.id}>`,
      );
      continue;
    }
  }

  return message;
};

const escape = (value: string) => value.replace(/(\*|_|`|~|\\)/g, "\\$1");

const formatAsString = (value: string) => {
  const [, pattern, flags] = value.match(/^\/(.*)\/(\w*)$/) ?? [];
  if (pattern) {
    return `\`${new RegExp(pattern, flags).toString().replace(/`/g, "\\$1")}\``;
  }
  if (value.includes('"')) {
    if (value.includes("'")) return `\`${escape(value)}\``;
    return `'${escape(value)}'`;
  }
  return `"${escape(value)}"`;
};

export const handleModalSubmit = async (
  interaction: APIModalSubmitInteraction,
) => {
  if (!interaction.channel) {
    return Response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "Unknown channel" },
    });
  }

  if (interaction.data.custom_id !== "alert") {
    return Response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: `Unknown modal '${interaction.data.custom_id}'` },
    });
  }

  const values = zSubmitProps.parse(Object.fromEntries(
    interaction.data.components.flatMap((r) =>
      r.components.map((c) => [c.custom_id, c.value])
    ),
  ));
  const rules = Object.entries(values)
    .filter(([key, value]) => key !== "message" && !!value)
    .map(([key, value]) => ({ key: zAlertKey.parse(key), value }));
  if (!rules.length) {
    return Response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "Must apply at least 1 filter" },
    });
  }

  const { action } = await upsertAlert({
    channelId: interaction.channel.id,
    message: await enrichMessage(values.message, interaction.guild_id),
    rules,
  });

  console.log(`${action === "updated" ? "Edited" : "Created"} alert`, {
    channelId: interaction.channel.id,
    channelName: interaction.channel.name,
    userId: interaction.user?.id,
    userName: interaction.user?.username,
  });

  return Response.json(
    {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `${action == "updated" ? "Edited" : "Created"} alert ${
          action === "updated" ? "to" : "with"
        } filter${rules.length > 1 ? "s" : ""} ${
          rules.map((r) => `${r.key} ${formatAsString(r.value)}`).join(" ")
        }${
          values.message ? ` and message ${formatAsString(values.message)}` : ""
        }`,
        allowed_mentions: {
          parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.Everyone],
        },
      },
    } satisfies APIInteractionResponse,
  );
};
