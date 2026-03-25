import "dotenv/config";
import { Bot } from "grammy";
import {
  initTokenManager,
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

// Инициализация менеджера токенов
initTokenManager({
  baseUrl: DEYE_BASE_URL,
  appId: DEYE_APP_ID,
  appSecret: DEYE_APP_SECRET,
  identity: DEYE_EMAIL,
  password: DEYE_PASSWORD,
  identityType: DEYE_IDENTITY_TYPE || "email",
});

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
    if (!hasToken()) {
      await ctx.answerCallbackQuery("⚠️ Токен не инициализирован");
      await ctx.reply("❌ Токен еще не получен. Пожалуйста, подождите...");
      return;
    }

    const accessToken = getAccessToken();
    const lastRefresh = getLastRefreshTime();
    const timeSinceRefresh = lastRefresh
      ? Math.floor((new Date() - lastRefresh) / 1000 / 60) // минуты
      : 0;

    await ctx.answerCallbackQuery("✅ Токен получен");

    const message = `
✅ Текущий access token:

🔑 Access Token: ${accessToken}

📅 Последнее обновление: ${lastRefresh ? lastRefresh.toLocaleString("ru-RU") : "Неизвестно"}
⏰ Прошло времени: ${timeSinceRefresh} минут

🔄 Токен обновляется автоматически каждые 30 дней (1-го числа месяца в 00:00)
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
