import express from "express";
import { getStationLatestData } from "./api/getStationLatestData.js";
import { logger } from "./helpers/loggingSystem.js";

const DEFAULT_API_PORT = 3000;

function toNumberOrZero(value) {
  return value == null ? 0 : value;
}

export function createApiServer({ baseUrl, port = DEFAULT_API_PORT } = {}) {
  if (!baseUrl) {
    throw new Error("baseUrl is required to start API server");
  }

  const app = express();

  app.get("/getInvertorData", async (req, res) => {
    const invertorIdParam = req.query.invertorID;
    const stationId = Number.parseInt(invertorIdParam, 10);

    if (!invertorIdParam || Number.isNaN(stationId)) {
      res.status(400).json({ msg: "invertorID query parameter is required" });
      return;
    }

    try {
      const latestData = await getStationLatestData({
        baseUrl,
        stationId,
      });

      res.json({
        msg: "success",
        generationPower: toNumberOrZero(latestData.generationPower),
        consumptionPower: toNumberOrZero(latestData.consumptionPower),
        gridPower: toNumberOrZero(latestData.gridPower),
        purchasePower: toNumberOrZero(latestData.purchasePower),
        wirePower: toNumberOrZero(latestData.wirePower),
        chargePower: toNumberOrZero(latestData.chargePower),
        dischargePower: toNumberOrZero(latestData.dischargePower),
        batteryPower: toNumberOrZero(latestData.batteryPower),
        batterySOC: toNumberOrZero(latestData.batterySOC),
        irradiateIntensity: toNumberOrZero(latestData.irradiateIntensity),
      });
    } catch (error) {
      await logger.error("API server error:", error.response?.data || error.message);
      res.status(500).json({
        msg: error.message || "internal server error",
      });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ msg: "not found" });
  });

  return {
    app,
    start() {
      return app.listen(port, () => {
        logger.info(`API server started on port ${port}`);
      });
    },
  };
}
