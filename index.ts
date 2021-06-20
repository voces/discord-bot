import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.3.2/mod.ts";
import nacl from "https://cdn.skypack.dev/tweetnacl@v1.0.3?dts";
import { interactionsMap } from "./interactionsMap.ts";

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

  const { type = 0, data = { options: [] }, member, user } = JSON.parse(body);
  if (type === PING) return json({ type: PONG });

  const userId = user?.id ?? member?.user?.id;

  if (type === INTERACTION) {
    if (data.id in interactionsMap)
      return interactionsMap[data.id as string]({ ...data, userId });

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
