import { REST } from "npm:@discordjs/rest";
import { API } from "npm:@discordjs/core";
import {
  APIChannel,
  APIGuildMember,
  APIRole,
  ApplicationCommandType,
  OverwriteType,
} from "npm:discord-api-types/v10";

const id = Deno.env.get("BOT_ID") ?? "536245741182648360";

const rest = new REST({ version: "10" })
  .setToken(Deno.env.get("DISCORD_TOKEN")!);

export const discord = new API(rest);

discord.applicationCommands.createGlobalCommand(
  Deno.env.get("APPLICATION_ID")!,
  {
    type: ApplicationCommandType.ChatInput,
    name: "alert",
    description: "Configuration alerts for when a lobby is hosted",
  },
).catch(console.error);

discord.applicationCommands.createGlobalCommand(
  Deno.env.get("APPLICATION_ID")!,
  {
    type: ApplicationCommandType.ChatInput,
    name: "stop",
    description: "Stops the current alert",
  },
).catch(console.error);

export const hasPermission = async (
  { userId = id, channelId, guildId, permission }: {
    userId?: string;
    channelId: string;
    guildId: string;
    permission: bigint;
  },
) => {
  const [channel, member, roles] = await Promise.all([
    discord.channels.get(channelId) as Promise<APIChannel>,
    discord.guilds.getMember(guildId, userId) as Promise<
      APIGuildMember
    >,
    discord.guilds.getRoles(guildId) as Promise<APIRole[]>,
  ]);

  let permissions = roles.filter((r) =>
    r.id === guildId || r.id in member.roles
  ).reduce(
    (permissions, role) => permissions | BigInt(role.permissions),
    0n,
  );
  if (
    "permission_overwrites" in channel &&
    Array.isArray(channel.permission_overwrites)
  ) {
    for (const overwrite of channel.permission_overwrites) {
      if (
        overwrite.id !== guildId &&
        !(overwrite.type === OverwriteType.Member &&
          overwrite.id === userId) &&
        !(overwrite.type === OverwriteType.Role &&
          member.roles.includes(overwrite.id))
      ) continue;
      permissions &= ~BigInt(overwrite.deny);
      permissions |= BigInt(overwrite.allow);
    }
  }
  return (permissions & permission) === permission;
};
