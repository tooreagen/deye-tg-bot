import "dotenv/config";
import { Bot } from "grammy";
import {
  initTokenManagerAndRefresh,
} from "./utils/tokenManager.js";
import { registerStationHandlers } from "./handlers/stationHandlers.js";
import { createApiServer } from "./apiServer.js";
import { logger } from "./helpers/loggingSystem.js";

const {
  BOT_TOKEN,
  DEYE_BASE_URL,
  DEYE_APP_ID,
  DEYE_APP_SECRET,
  DEYE_EMAIL,
  DEYE_PASSWORD,
  DEYE_IDENTITY_TYPE,
  API_PORT,
} = process.env;

const bot = new Bot(BOT_TOKEN);

// Регистрируем обработчики для станций
registerStationHandlers(bot, DEYE_BASE_URL);

bot.command("start", async (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [{ text: "Get stations", callback_data: "get_stations" }],
    ],
  };

  await ctx.reply("Telegram bot for DeyeCloud API.", {
    reply_markup: keyboard,
  });
});

bot.catch((err) => {
  logger.error("Bot error:", err);
});

async function startBot() {
  await initTokenManagerAndRefresh({
    baseUrl: DEYE_BASE_URL,
    appId: DEYE_APP_ID,
    appSecret: DEYE_APP_SECRET,
    identity: DEYE_EMAIL,
    password: DEYE_PASSWORD,
    identityType: DEYE_IDENTITY_TYPE || "email",
  });

  const apiServer = createApiServer({
    baseUrl: DEYE_BASE_URL,
    port: Number.parseInt(API_PORT, 10) || 3000,
  });

  apiServer.start();
  bot.start();
  await logger.info("Bot started");
}

startBot().catch((error) => {
  logger.error("Bot startup error:", error.message);
  process.exit(1);
});
