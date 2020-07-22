import cron from "node-cron";
import * as bot from "./bot";
import * as api from "./api";

export function start() {
  const job = cron.schedule("0 0 12,20 * * *", async () => {
    const now = new Date();
    console.info(now.toUTCString(), `Running cron job...`);
    const chatIds = await api.getChatIds();
    await bot.sendTOASQueues(chatIds);
  });

  console.info(`Cronjob initalized.`);
}
