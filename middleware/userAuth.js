require("dotenv").config();

/**
 * Middleware для проверки авторизации пользователя по Telegram ID
 * @param {Object} ctx - Контекст Grammy
 * @param {Function} next - Следующая функция в цепочке middleware
 * @returns {Promise<void>}
 */

const { ALLOWED_TELEGRAM_IDS } = process.env;

// Парсинг разрешенных Telegram ID
const allowedTelegramIds = ALLOWED_TELEGRAM_IDS
  ? ALLOWED_TELEGRAM_IDS.split(",").map((id) => id.trim())
  : [];

async function userAuth(ctx, next) {
  const userId = ctx.from?.id;

  // Если нет ID пользователя, отправляем сообщение об ошибке
  if (!userId) {
    await ctx.reply("❌ Не удалось определить ID пользователя.");
    return;
  }

  // Проверка доступа
  if (!allowedTelegramIds.includes(userId.toString())) {
    await ctx.reply("❌ У вас нет прав для выполнения этого действия.");
    return;
  }

  // Если пользователь авторизован, передаем управление дальше
  await next();
}

module.exports = { userAuth };
