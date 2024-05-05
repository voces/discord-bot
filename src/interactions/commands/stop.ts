import { db } from "../../sources/kv.ts";
import { InternalHandler } from "../types.ts";

export const handleStop: InternalHandler = async (
  { channelId, channelName },
) => {
  const prev = await db.alerts.find(channelId);
  if (!prev) return "No alert found";
  await db.alerts.delete(channelId);
  console.log(new Date(), "Removed alert", { channelId, channelName });
  return "Deleted alert";
};
