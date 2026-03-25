import axios from "axios";
import crypto from "node:crypto";

/**
 * Получение access token для DeyeCloud API
 * @param {Object} config - конфигурация подключения
 * @param {string} config.baseUrl - базовый URL дата-центра (например, 'https://eu1-developer.deyecloud.com')
 * @param {string} config.appId - идентификатор приложения
 * @param {string} config.appSecret - секрет приложения
 * @param {string} config.identity - email или username или mobile (в зависимости от identityType)
 * @param {string} config.password - пароль в открытом виде (будет захеширован)
 * @param {string} [config.identityType='email'] - тип идентификатора: 'email', 'username', 'mobile'
 * @param {number} [config.countryCode] - код страны (только для mobile)
 * @param {number} [config.companyId] - ID компании (только для бизнес-аккаунтов)
 * @returns {Promise<{accessToken: string, expiresIn: number, refreshToken?: string}>}
 */
export async function getDeyeAccessToken(config) {
  // Хэширование пароля SHA256 (строчные буквы)
  const hashedPassword = crypto
    .createHash("sha256")
    .update(config.password)
    .digest("hex")
    .toLowerCase();

  // Формируем тело запроса в зависимости от типа идентификатора
  const payload = {
    appSecret: config.appSecret,
    password: hashedPassword,
  };

  switch (config.identityType) {
    case "email":
      payload.email = config.identity;
      break;
    case "username":
      payload.username = config.identity;
      break;
    case "mobile":
      payload.mobile = config.identity;
      payload.countryCode = config.countryCode;
      break;
    default:
      throw new Error("identityType должен быть email, username или mobile");
  }

  // Если указан companyId (для бизнес-аккаунтов)
  if (config.companyId) {
    payload.companyId = config.companyId;
  }

  const url = `${config.baseUrl}/v1.0/account/token?appId=${config.appId}`;

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;
    if (data.code !== "1000000" || !data.success) {
      throw new Error(`Ошибка получения токена: ${data.msg || "Неизвестная ошибка"}`);
    }

    return {
      accessToken: data.accessToken,
      expiresIn: parseInt(data.expiresIn, 10), // в секундах (обычно 5183999)
      refreshToken: data.refreshToken, // если присутствует
    };
  } catch (error) {
    console.error("Ошибка запроса токена:", error.response?.data || error.message);
    throw error;
  }
}
