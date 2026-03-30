import fs from "fs";
import path from "path";

const LOG_DIR_PATH = path.resolve(process.cwd(), "log");
const INFO_LOG_PATH = path.join(LOG_DIR_PATH, "info.log");
const ERROR_LOG_PATH = path.join(LOG_DIR_PATH, "error.log");

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
    await fs.promises.mkdir(LOG_DIR_PATH, { recursive: true });

    const currentDate = formatTimestamp();
    const message = parts.map(serializePart).join(" ");
    const line = `${currentDate} [${level.toUpperCase()}] ${message}\n`;

    await fs.promises.appendFile(absoluteFilePath, line, "utf8");

    if (level === "error") {
      process.stderr.write(line);
      return;
    }

    process.stdout.write(line);
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
