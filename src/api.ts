import fs from "fs";
import { config } from "./config";

export async function getChatIds() {
  try {
    const fileBuffer = await fs.promises.readFile(config.CRON_CHAT_IDS_FILE);
    const chatIds = JSON.parse(fileBuffer.toString());
    return chatIds as number[];
  } catch (e) {
    await fs.promises.writeFile(config.CRON_CHAT_IDS_FILE, "[]");

    return [];
  }
}

export async function addChatId(chatId: number) {
  const currentChatIds = await getChatIds();
  const newChatIds = Array.from(new Set([...currentChatIds, chatId]));

  await fs.promises.writeFile(
    config.CRON_CHAT_IDS_FILE,
    JSON.stringify(newChatIds)
  );
}
