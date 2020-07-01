import * as dotenv from "dotenv";
dotenv.config();

import envalid, { str } from "envalid";

export const config = envalid.cleanEnv(process.env, {
  BOT_TOKEN: str(),
  CRON_CHAT_IDS_FILE: str({ default: "chat-ids" }),
  TOAS_USERNAME: str(),
  TOAS_PASSWORD: str(),
});
