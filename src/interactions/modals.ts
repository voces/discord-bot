import {
  APIInteractionResponse,
  APIModalSubmitInteraction,
  InteractionResponseType,
} from "npm:discord-api-types/v10";
import { z } from "npm:zod";
import { db, RuleKey } from "../sources/kv.ts";

const zSubmitProps = z.object({
  message: z.string().optional().transform((v) => v ? v : undefined),
  map: z.string().optional().transform((v) => v ? v : undefined),
  host: z.string().optional().transform((v) => v ? v : undefined),
  name: z.string().optional().transform((v) => v ? v : undefined),
  server: z.string().optional().transform((v) => v ? v : undefined),
});

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
  const ruleValues = Object.entries(values)
    .filter(([key, value]) => key !== "message" && !!value);
  const rules = ruleValues.map(([key, value]) => {
    const [, pattern, flags] = value.match(/^\/(.*)\/(\w+)$/) ?? [];
    return {
      type: "term" as const,
      key: key as RuleKey,
      value: pattern ? new RegExp(pattern, flags || undefined) : value,
    };
  });
  if (!rules.length) {
    return Response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: "Must apply at least 1 filter" },
    });
  }

  await db.alerts.set(interaction.channel.id, {
    channel: interaction.channel.id,
    message: values.message,
    rule: rules.length > 1 ? { type: "and", rules } : rules[0],
  });

  console.log("Created alert", {
    channelId: interaction.channel.id,
    channelName: interaction.channel.name,
    userId: interaction.user?.id,
    userName: interaction.user?.username,
  });

  return Response.json(
    {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: `Created alert with filters ${
          ruleValues.map(([k, v]) => `\`${k}=${v}\``).join(" ")
        }${values.message ? ` and \`message=${values.message}\`` : ""}`,
      },
    } satisfies APIInteractionResponse,
  );
};
