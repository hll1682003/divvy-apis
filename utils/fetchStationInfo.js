require("dotenv").config();
const axios = require("axios");
const fetchStationInfo = async (req, res, next) => {
  if (!req.app.locals.stationInfo) {
    req.app.locals.stationInfo = new Map();
    const stationInfo = req.app.locals.stationInfo;
    if (stationInfo.size <= 0) {
      try {
        const info = await axios.get(process.env.STATION_INFO_URL);

        info.data.data.stations.forEach((station) => {
          stationInfo.set(station["station_id"], { detail: station });
        });
      } catch (err) {
        res
          .status(400)
          .json({ status: "fail", message: "failed to get station info" });
      } finally {
        next();
      }
    }
  } else {
    next();
  }
};
module.exports = fetchStationInfo;
