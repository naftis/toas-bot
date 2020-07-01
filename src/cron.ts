import { CronJob } from "cron";
import * as bot from "./bot";
import * as api from "./api";

export function start() {
  const job = new CronJob("0 0 12,20 * * *", async () => {
    const now = new Date();
    console.info(now.toUTCString(), `Running cron job...`);
    const chatIds = await api.getChatIds();
    await bot.sendTOASQueues(chatIds);
  });
  job.start();

  console.info(`Cronjob initalized.`);
}
