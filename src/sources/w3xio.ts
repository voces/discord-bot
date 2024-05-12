import { z } from "npm:zod";

const zAlert = z.object({
  channelId: z.string(),
  message: z.string().optional(),
  rules: z.object({
    key: z.union([
      z.literal("map"),
      z.literal("host"),
      z.literal("name"),
      z.literal("server"),
    ]),
    value: z.string(),
  }).array(),
});
type Alert = z.infer<typeof zAlert>;

const zError = z.object({
  errors: z.object({
    code: z.string(),
    message: z.string().optional(),
  })
    .array(),
});

const w3xio = (
  method: "get" | "post" | "delete",
  path: string,
  body?: unknown,
) => {
  const headers: Record<string, string> = {};

  {
    const secret = Deno.env.get("API_SECRET");
    if (secret) headers.authorization = secret;
  }

  if (body) headers["content-type"] = "application/json";

  return fetch(`${Deno.env.get("W3XIO")}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());
};

export const getAlert = (channelId: string) =>
  w3xio("get", `alerts/${channelId}`)
    .then((v) => z.union([zAlert, zError]).parse(v));

export const upsertAlert = (alert: Alert) =>
  w3xio("post", "alerts", alert).then((v) =>
    z.object({
      action: z.union([z.literal("updated"), z.literal("created")]),
      alert: zAlert,
    }).parse(v)
  );

export const deleteAlert = (channelId: string) =>
  w3xio("delete", `alerts/${channelId}`)
    .then((v) => z.union([zAlert, zError]).parse(v));
