import { getStationList } from "../api/getStationList.js";
import { getStationLatestData } from "../api/getStationLatestData.js";
import { userAuth } from "../middleware/userAuth.js";
import { logger } from "../helpers/loggingSystem.js";

// Хранилище для данных станций (в памяти)
const stationsCache = new Map();

// Функция для форматирования списка станций
function formatStationsMessage(stations, total, currentPage, totalPages) {
  let message = `📊 Список станций (страница ${currentPage}/${totalPages}, всего: ${total}):\n\n`;

  stations.forEach((station, index) => {
    const globalIndex = (currentPage - 1) * 2 + index + 1;
    const statusEmoji =
      station.connectionStatus === "ONLINE"
        ? "🟢"
        : station.connectionStatus === "OFFLINE"
          ? "🔴"
          : station.connectionStatus === "PARTIAL_OFFLINE"
            ? "🟡"
            : "⚪";

    message += `${statusEmoji} ${globalIndex}. ${station.name}\n`;
    message += `   📍 ${station.locationAddress || "Адрес не указан"}\n`;
    message += `   🔋 SOC: ${station.batterySOC}%\n\n`;
  });

  return message;
}

// Функция для создания клавиатуры со станциями
function createStationsKeyboard(stations, currentPage, totalPages) {
  const keyboard = [];

  // Кнопки станций (по 2 в ряд)
  for (let i = 0; i < stations.length; i += 2) {
    const row = [];
    row.push({
      text: `${stations[i].name}`,
      callback_data: `station_details_${stations[i].id}`,
    });

    if (stations[i + 1]) {
      row.push({
        text: `${stations[i + 1].name}`,
        callback_data: `station_details_${stations[i + 1].id}`,
      });
    }

    keyboard.push(row);
  }

  // Кнопки пагинации
  const navRow = [];
  if (currentPage > 1) {
    navRow.push({
      text: "⬅️ Назад",
      callback_data: `stations_page_${currentPage - 1}`,
    });
  }

  navRow.push({
    text: `Стр. ${currentPage}/${totalPages}`,
    callback_data: "current_page",
  });

  if (currentPage < totalPages) {
    navRow.push({
      text: "Вперёд ➡️",
      callback_data: `stations_page_${currentPage + 1}`,
    });
  }

  keyboard.push(navRow);

  return { inline_keyboard: keyboard };
}

// Функция для отображения страницы со станциями
async function showStationsPage(ctx, page) {
  const allStations = stationsCache.get("stations") || [];
  const total = stationsCache.get("total") || 0;

  if (allStations.length === 0) {
    await ctx.editMessageText("📊 Список станций пуст");
    return;
  }

  const stationsPerPage = 2;
  const totalPages = Math.ceil(total / stationsPerPage);
  const startIndex = (page - 1) * stationsPerPage;
  const endIndex = startIndex + stationsPerPage;
  const currentStations = allStations.slice(startIndex, endIndex);

  const message = formatStationsMessage(currentStations, total, page, totalPages);
  const keyboard = createStationsKeyboard(currentStations, page, totalPages);

  await ctx.editMessageText(message, {
    reply_markup: keyboard,
  });
}

// Регистрация всех обработчиков callbackQuery
export function registerStationHandlers(bot, baseUrl) {
  // Обработчик для получения списка станций
  bot.callbackQuery("get_stations", userAuth, async (ctx) => {
    try {
      await ctx.answerCallbackQuery("Fetching stations...");
      await ctx.editMessageText("⏳ Загрузка списка станций...");

      // Загружаем все станции
      const result = await getStationList({
        baseUrl,
        pageNo: 1,
        pageSize: 1000, // Загружаем все сразу для кеширования
      });

      if (result.total === 0) {
        await ctx.editMessageText("📊 Список станций пуст");
        return;
      }

      // Кешируем станции
      stationsCache.set("stations", result.stationList);
      stationsCache.set("total", result.total);

      // Показываем первую страницу
      await showStationsPage(ctx, 1);
    } catch (error) {
      await logger.error("Station list retrieval error:", error.message);
      await ctx.editMessageText(`❌ Ошибка получения списка станций: ${error.message}`);
    }
  });

  // Обработчик для пагинации станций
  bot.callbackQuery(/^stations_page_(\d+)$/, userAuth, async (ctx) => {
    const page = Number.parseInt(ctx.match[1], 10);
    await showStationsPage(ctx, page);
  });

  // Обработчик для деталей станции
  bot.callbackQuery(/^station_details_(\d+)$/, userAuth, async (ctx) => {
    const stationId = Number.parseInt(ctx.match[1], 10);

    try {
      await ctx.answerCallbackQuery("Loading station details...");
      await ctx.editMessageText("⏳ Загрузка данных станции...");

      const allStations = stationsCache.get("stations") || [];
      const station = allStations.find((item) => item.id === stationId);

      if (!station) {
        await ctx.editMessageText("❌ Станция не найдена");
        return;
      }

      const latestData = await getStationLatestData({
        baseUrl,
        stationId,
      });

      const statusEmoji =
        station.connectionStatus === "ONLINE"
          ? "🟢"
          : station.connectionStatus === "OFFLINE"
            ? "🔴"
            : station.connectionStatus === "PARTIAL_OFFLINE"
              ? "🟡"
              : "⚪";

      const lastUpdate = latestData.lastUpdateTime
        ? new Date(latestData.lastUpdateTime * 1000).toLocaleString("ru-RU")
        : "Неизвестно";

      const message = `
📊 Детали станции: ${station.name}
${statusEmoji} Статус: ${station.connectionStatus}

🆔 ID: ${station.id}
📍 Адрес: ${station.locationAddress || "Не указан"}

⚡ Генерация: ${latestData.generationPower ?? 0} W
📊 Потребление: ${latestData.consumptionPower ?? 0} W
🔌 Сеть: ${latestData.gridPower ?? 0} W
🛒 Покупка: ${latestData.purchasePower ?? 0} W
⚡ Провод: ${latestData.wirePower ?? 0} W
🔋 Зарядка: ${latestData.chargePower ?? 0} W
🔋 Разрядка: ${latestData.dischargePower ?? 0} W
🔋 Мощность батареи: ${latestData.batteryPower ?? 0} W
🔋 SOC: ${latestData.batterySOC ?? 0}%
☀️ Интенсивность: ${latestData.irradiateIntensity ?? 0} W/m²

🕒 Обновлено: ${lastUpdate}
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔙 К списку станций", callback_data: "get_stations" },
            { text: "🔄 Обновить", callback_data: `station_details_${stationId}` },
          ],
        ],
      };

      await ctx.editMessageText(message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      await logger.error("Station details error:", error.message);
      await ctx.editMessageText(`❌ Ошибка получения данных станции: ${error.message}`);
    }
  });
}
