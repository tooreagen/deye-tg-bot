import "dotenv/config";
import { Bot } from "grammy";
import { getDeyeAccessToken } from "./api/getDeyeAccessToken.js";
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

// Инициализация бота с токеном из переменных окружения
const bot = new Bot(BOT_TOKEN);

// Обработка команды /start с кнопкой
bot.command("start", async (ctx) => {
  const keyboard = {
    inline_keyboard: [[{ text: "🔑 Получить токен", callback_data: "get_token" }]],
  };

  await ctx.reply("Привет! Я Telegram бот для работы с DeyeCloud API.", {
    reply_markup: keyboard,
  });
});

// Обработка нажатия на кнопку (с middleware авторизации)
bot.callbackQuery("get_token", userAuth, async (ctx) => {
  try {
    await ctx.answerCallbackQuery("⏳ Запрос токена...");
    await ctx.reply("⏳ Получаю токен...");

    const result = await getDeyeAccessToken({
      baseUrl: DEYE_BASE_URL,
      appId: DEYE_APP_ID,
      appSecret: DEYE_APP_SECRET,
      identity: DEYE_EMAIL,
      password: DEYE_PASSWORD,
      identityType: DEYE_IDENTITY_TYPE || "email",
    });

    const message = `
✅ Токен успешно получен!

🔑 Access Token: ${result.accessToken}

⏰ Истекает через: ${Math.floor(result.expiresIn / 60)} минут
${result.refreshToken ? `🔄 Refresh Token: ${result.refreshToken}` : ""}
    `.trim();

    await ctx.reply(message);
  } catch (error) {
    console.error("Ошибка получения токена:", error.message);
    await ctx.reply(`❌ Ошибка получения токена: ${error.message}`);
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error("Ошибка бота:", err);
});

// Запуск бота
bot.start();
console.log("Бот запущен!");
