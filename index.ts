// Sift is a small routing library that abstracts the details like registering
// a fetch event listener and provides a simple function (serve) that has an
// API to invoke a function for a specific path.
import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.2/mod.ts";
// TweetNaCl is a cryptography library that we use to verify requests
// from Discord.
import nacl from "https://cdn.skypack.dev/tweetnacl@v1.0.3?dts";
import { interactionsMap } from "./interactionsMap.ts";
// import type { APIInteraction } from "https://esm.sh/discord-api-types@0.18.1/deno/v9";

const PING = 1;
const PONG = 1;
const INTERACTION = 2;

const handler = async (request: Request): Promise<Response> => {
  const { error } = await validateRequest(request, {
    POST: { headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"] },
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  const { valid, body } = await verifySignature(request);
  if (!valid) return json({ error: "Invalid request" }, { status: 401 });

  const { type = 0, data = { options: [] } } = JSON.parse(body);
  if (type === PING) return json({ type: PONG });

  if (type === INTERACTION) {
    if (data.id in interactionsMap)
      return interactionsMap[data.id as string](data);

    return json({ type: 4, data: { content: "Unhandled interaction" } });
  }

  return json({ error: "bad request" }, { status: 400 });
};

serve({ "/": handler });

const verifySignature = async (
  request: Request
): Promise<{ valid: boolean; body: string }> => {
  const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY)
  );

  return { valid, body };
};

const hexToUint8Array = (hex: string) =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
