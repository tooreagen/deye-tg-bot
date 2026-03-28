import axios from "axios";
import { getAccessToken } from "../utils/tokenManager.js";

/**
 * Получение списка станций DeyeCloud
 * @param {Object} config - конфигурация запроса
 * @param {string} config.baseUrl - базовый URL дата-центра (например, 'https://eu1-developer.deyecloud.com')
 * @param {number} [config.pageNo=1] - номер страницы (по умолчанию 1)
 * @param {number} [config.pageSize=10] - размер страницы (по умолчанию 10)
 * @returns {Promise<Object>} - ответ с данными станций
 */
export async function getStationList(config = {}) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token не найден. Убедитесь, что tokenManager инициализирован.");
  }

  const pageNo = config.pageNo || 1;
  const pageSize = config.pageSize || 10;

  const url = `${config.baseUrl}/v1.0/station/list`;

  try {
    console.log(accessToken);

    const response = await axios.post(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        pageNo,
        pageSize,
      },
    });

    const data = response.data;

    if (data.code !== "1000000" || !data.success) {
      throw new Error(`Ошибка получения списка станций: ${data.msg || "Неизвестная ошибка"}`);
    }

    return {
      code: data.code,
      msg: data.msg,
      success: data.success,
      requestId: data.requestId,
      total: data.total,
      stationList: data.stationList || [],
    };
  } catch (error) {
    console.error("Ошибка запроса списка станций:", error.response?.data || error.message);
    throw error;
  }
}
