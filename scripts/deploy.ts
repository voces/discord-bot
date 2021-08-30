import { expandGlob } from "./deps.ts";

const dir = import.meta.url.replace("file://", "").split("/").slice(0, -2)
  .join(
    "/",
  ) + "/";

console.log(dir);

// upload files
const uploads: Promise<unknown>[] = [];
const charset =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const hash = Array(40)
  .fill(0)
  .map(() => charset[Math.floor(Math.random() * charset.length)])
  .join("");
for await (const file of expandGlob("src/**/*.ts")) {
  uploads.push(
    Deno.readTextFile(file.path).then(async (body) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 1);
      const url = `https://ephemeral.deno.dev/${hash}/${
        file.path.replace(dir, "")
      }`;
      const res = await fetch(url, {
        method: "post",
        headers: { Expires: date.toUTCString() },
        body,
      });
      console.log("Uploaded", url, res.status);
    }),
  );
}
await Promise.all(uploads);

// A wait so files sync through deno deploy
console.log("Waiting 15 seconds...");
await new Promise((resolve) => setTimeout(resolve, 15_000));

// Perform the deploy
const res = await fetch(
  // live-lobbies-dev.deno.dev
  "https://dash.deno.com/api/projects/0254d1b4-df87-4bf6-b4e5-ccce2ccc4bec/deployments",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer " + Deno.env.get("DENO_DEPLOY_TOKEN"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: `https://ephemeral.deno.dev/${hash}/src/index.ts`,
      production: true,
    }),
  },
).then((r) => r.json());
if (res.code === "deploymentFailed") console.log(res.message);
else console.log(res.domainMappings[0].domain);
