import cron from "node-cron";
import { getDeyeAccessToken } from "./getDeyeAccessToken.js";

/**
 * Модуль для управления access token
 * Получает токен при старте и обновляет по расписанию
 */

// Хранение текущего токена
let currentAccessToken = null;
let lastRefreshTime = null;

/**
 * Конфигурация для получения токена
 */
let tokenConfig = null;

/**
 * Инициализация менеджера токенов
 * @param {Object} config - конфигурация для получения токена
 * @param {string} config.baseUrl - базовый URL дата-центра
 * @param {string} config.appId - идентификатор приложения
 * @param {string} config.appSecret - секрет приложения
 * @param {string} config.identity - email или username
 * @param {string} config.password - пароль
 * @param {string} [config.identityType='email'] - тип идентификатора
 * @param {number} [config.companyId] - ID компании (опционально)
 */
export function initTokenManager(config) {
  tokenConfig = config;
  
  // Получаем токен при старте
  refreshToken();
  
  // Настраиваем cron на обновление каждые 30 дней в 00:00
  cron.schedule("0 0 0 1 * *", () => {
    console.log("🔄 Автоматическое обновление токена...");
    refreshToken();
  });
  
  console.log("✅ Менеджер токенов инициализирован. Токен будет обновляться каждые 30 дней.");
}

/**
 * Получение нового токена
 */
async function refreshToken() {
  try {
    console.log("⏳ Получение access token...");
    
    const result = await getDeyeAccessToken(tokenConfig);
    
    currentAccessToken = result.accessToken;
    lastRefreshTime = new Date();
    
    console.log("✅ Access token успешно получен и сохранен");
    console.log(`⏰ Истекает через: ${Math.floor(result.expiresIn / 60)} минут`);
    
    return result;
  } catch (error) {
    console.error("❌ Ошибка получения токена:", error.message);
    throw error;
  }
}

/**
 * Получить текущий access token
 * @returns {string|null} текущий токен
 */
export function getAccessToken() {
  if (!currentAccessToken) {
    console.warn("⚠️ Access token не инициализирован. Вызовите initTokenManager() сначала.");
  }
  return currentAccessToken;
}

/**
 * Проверить, есть ли токен
 * @returns {boolean} true если токен существует
 */
export function hasToken() {
  return currentAccessToken !== null;
}

/**
 * Получить время последнего обновления
 * @returns {Date|null} время последнего обновления
 */
export function getLastRefreshTime() {
  return lastRefreshTime;
}