import { REST } from "npm:@discordjs/rest";
import { API } from "npm:@discordjs/core";
import { ApplicationCommandType } from "npm:discord-api-types/v10";

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
