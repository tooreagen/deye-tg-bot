import "dotenv/config";
import { Bot } from "grammy";
import {
  initTokenManagerAndRefresh,
  getAccessToken,
  getLastRefreshTime,
  hasToken,
} from "./api/tokenManager.js";
import { userAuth } from "./middleware/userAuth.js";

const {
  BOT_TOKEN,
  DEYE_BASE_URL,
  DEYE_APP_ID,
  DEYE_APP_SECRET,
  DEYE_EMAIL,
  DEYE_PASSWORD,
  DEYE_IDENTITY_TYPE,
} = process.env;

const bot = new Bot(BOT_TOKEN);

bot.command("start", async (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "Get token", callback_data: "get_token" },
      ],
    ],
  };

  await ctx.reply("Telegram bot for DeyeCloud API.", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery("get_token", userAuth, async (ctx) => {
  try {
    if (!hasToken()) {
      await ctx.answerCallbackQuery("Token is not initialized");
      await ctx.reply("Token is not available yet. Please wait.");
      return;
    }

    const accessToken = getAccessToken();
    const lastRefresh = getLastRefreshTime();
    const timeSinceRefresh = lastRefresh
      ? Math.floor((new Date() - lastRefresh) / 1000 / 60)
      : 0;

    await ctx.answerCallbackQuery("Token received");

    const message = `
Current access token:

Access Token: ${accessToken}

Last refresh: ${lastRefresh ? lastRefresh.toLocaleString("ru-RU") : "Unknown"}
Minutes since refresh: ${timeSinceRefresh}

Token is refreshed automatically every 30 days (day 1 at 00:00)
    `.trim();

    await ctx.reply(message);
  } catch (error) {
    console.error("Token retrieval error:", error.message);
    await ctx.reply(`Token retrieval error: ${error.message}`);
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
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

  bot.start();
  console.log("Bot started");
}

startBot().catch((error) => {
  console.error("Bot startup error:", error.message);
  process.exit(1);
});
