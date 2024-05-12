import { verifySignature } from "./util/verifySignature.ts";
import { validateRequest } from "./util/validateRequest.ts";
import type { APIInteraction } from "npm:discord-api-types/v10";
import { InteractionType } from "npm:discord-api-types/v10";
import { InteractionResponseType } from "npm:discord-api-types/v10";
import { handleApplicationCommand } from "./commands/index.ts";
import { handleModalSubmit } from "./modals.ts";

Deno.serve(async (request: Request) => {
  const validationError = validateRequest(request, {
    POST: { headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"] },
  });
  if (validationError) {
    return validationError;
  }

  const { valid, body } = await verifySignature(request);
  if (!valid) {
    return Response.json({ error: "Invalid request" }, { status: 401 });
  }

  const interaction = JSON.parse(body) as APIInteraction;
  if (interaction.type === InteractionType.Ping) {
    return Response.json({ type: InteractionResponseType.Pong });
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    return handleApplicationCommand(interaction);
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    return handleModalSubmit(interaction);
  }

  return Response.json({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: "Unhandled interaction" },
  }, { status: 404 });
});
