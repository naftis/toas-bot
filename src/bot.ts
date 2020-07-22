import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";
import * as api from "./api";
import { getQueues } from "./toas";

let bot: TelegramBot;

export async function start() {
  bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    await api.addChatId(msg.chat.id);

    bot.sendMessage(
      msg.chat.id,
      `Haetaan jonoa... (tässä menee 1 - 2 minuuttia)`
    );

    await sendTOASQueues([msg.chat.id]);

    console.info(msg.chat.id, `...done`);
  });
}

async function sendTOASQueue(chatId: number) {
  const queues = await getQueues();

  for (const queue of queues) {
    const sortedApartments = queue.apartments.sort(
      (a, b) => a.placement - b.placement
    );

    const emoji =
      queue.kind === "Perhehakemus"
        ? "👪"
        : queue.kind === "Soluhakemus"
        ? "👭"
        : "🧑‍🦰";

    const message = {
      chatId,
      message: `***${emoji} ${queue.kind}***
***Luotu***: ${queue.createdAt}
***Vanhenee***: ${queue.expiresAt}
***Hakijoita***: ${queue.applicants}

***🏢 Hakusijat***
${sortedApartments
  .map((apartment) => `\`${apartment.name.padEnd(22)}\` ${apartment.placement}`)
  .join("\n")}
` // Parse Markdown
        .replace(/\./g, "\\.")
        .replace(/-/g, "\\-"),
    };

    console.info(message);

    bot.sendMessage(chatId, message.message, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    });
  }
}

export async function sendTOASQueues(chatIds: number[]) {
  console.info(`Sending TOAS queue for`, { chatIds });
  for (const chatId of chatIds) {
    sendTOASQueue(chatId);
  }
}
