import fs from "fs";
import path from "path";

const INFO_LOG_PATH = path.resolve(process.cwd(), "info.log");
const ERROR_LOG_PATH = path.resolve(process.cwd(), "error.log");

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    date.getFullYear(),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function serializePart(part) {
  if (part instanceof Error) {
    return part.stack || part.message;
  }

  if (typeof part === "string") {
    return part;
  }

  if (part === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

async function writeLog(filePath, level, parts) {
  try {
    const absoluteFilePath = path.resolve(process.cwd(), filePath);
    const logDir = path.dirname(absoluteFilePath);

    await fs.promises.mkdir(logDir, { recursive: true });

    const currentDate = formatTimestamp();
    const message = parts.map(serializePart).join(" ");
    const line = `${currentDate} [${level.toUpperCase()}] ${message}\n`;

    await fs.promises.appendFile(absoluteFilePath, line, "utf8");
  } catch (error) {
    process.stderr.write(`Logging error: ${serializePart(error)}\n`);
  }
}

export async function loggingSystem(fileName, msg) {
  return writeLog(fileName, "info", [msg]);
}

export const logger = {
  info: (...parts) => writeLog(INFO_LOG_PATH, "info", parts),
  warn: (...parts) => writeLog(INFO_LOG_PATH, "warn", parts),
  error: (...parts) => writeLog(ERROR_LOG_PATH, "error", parts),
};
