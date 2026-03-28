import axios from "axios";
import { getAccessToken } from "../utils/tokenManager.js";

/**
 * Получение последних данных станции DeyeCloud
 * @param {Object} config - конфигурация запроса
 * @param {string} config.baseUrl - базовый URL дата-центра (например, 'https://eu1-developer.deyecloud.com')
 * @param {number} config.stationId - ID станции
 * @returns {Promise<Object>} - ответ с данными станции
 */
export async function getStationLatestData(config = {}) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token не найден. Убедитесь, что tokenManager инициализирован.");
  }

  if (!config.stationId) {
    throw new Error("stationId обязателен для получения данных станции");
  }

  const url = `${config.baseUrl}/v1.0/station/latest`;

  try {
    const response = await axios.post(
      url,
      {
        stationId: config.stationId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;

    if (data.code !== "1000000" || !data.success) {
      throw new Error(`Ошибка получения данных станции: ${data.msg || "Неизвестная ошибка"}`);
    }

    return {
      code: data.code,
      msg: data.msg,
      success: data.success,
      requestId: data.requestId,
      generationPower: data.generationPower,
      consumptionPower: data.consumptionPower,
      gridPower: data.gridPower,
      purchasePower: data.purchasePower,
      wirePower: data.wirePower,
      chargePower: data.chargePower,
      dischargePower: data.dischargePower,
      batteryPower: data.batteryPower,
      batterySOC: data.batterySOC,
      irradiateIntensity: data.irradiateIntensity,
      lastUpdateTime: data.lastUpdateTime,
    };
  } catch (error) {
    console.error("Ошибка запроса данных станции:", error.response?.data || error.message);
    throw error;
  }
}
