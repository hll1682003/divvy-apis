const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const moment = require("moment");

router.get("/:stationId", async (req, res) => {
  const requestId = req.params.stationId;
  const stationInfo = req.app.locals.stationInfo;
  if (stationInfo.has(req.params.stationId)) {
    res.status(200).send(stationInfo.get(requestId).detail);
  } else {
    res.status(404).json({ status: "fail", message: "Station info not found" });
  }
});

// Result class for age distribution
class Result {
  constructor(stationId, count, date, err) {
    this.stationId = stationId;
    if (count) this.count = count;
    if (date) this.date = moment(date).format("YYYY-MM-DD");
    if (err) this.err = err;
  }
}

const checkEndAndRespond = (
  stationCount,
  requestStations,
  res,
  result,
  msg
) => {
  if (stationCount >= requestStations.length - 1) {
    res.status(200).json(result);
    console.log(msg, result);
  }
};
// provide data file path during deployment
const filePath =
  process.env.DATA_FILE_PATH ||
  path.join(__dirname, "..", "..", "Divvy_Trips_2019_Q2");

const allowedTimeFormat = [moment.ISO_8601, moment.RFC_2822, "MM/DD/YYYY"];

// data in request body is supposed in the form like following:
// {
// 	"stations":[6,1233,33],
// 	"date":"2019-04-02"
// }
router.post("/age-distribution", async (req, res) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
  });

  const requestStations = req.body.stations;
  const stationInfo = req.app.locals.stationInfo;
  //   date is the queried date
  const date = moment(req.body.date, allowedTimeFormat, true);
  let result = [];
  if (!requestStations || !Array.isArray(requestStations)) {
    throw new Error("invalid station input");
  }
  if (!date.isValid()) {
    throw new Error("invalid date input!");
  }
  requestStations.forEach((stationIdNumber, stationCount) => {
    const count = {
      "0-20": 0,
      "21-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51+": 0,
      unknown: 0,
    };
    const stationId = String(stationIdNumber);
    if (stationInfo.has(stationId)) {
      if (
        !stationInfo.get(stationId)[date.toString()] ||
        !stationInfo.get(stationId)[date.toString()]["distribution"]
      ) {
        // flag the status of model
        let modelGet = false;
        // collect all attribute names
        let model = [];
        rl.on("line", (chunk) => {
          const dataArr = chunk
            .toString("utf8")
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (!modelGet) {
            model = dataArr;
            modelGet = true;
          } else {
            const stationObj = {};
            model.forEach((attr, index) => {
              stationObj[attr] = dataArr[index];
            });
            // optimization: end reading early
            if (
              moment(
                stationObj["01 - Rental Details Local Start Time"]
              ).isAfter(date, "day")
            ) {
              rl.close();
            }
            const endTime = moment(
              stationObj["01 - Rental Details Local End Time"]
            );
            // When birthday year is available and end date is the same as the queried date, calculate the age.
            if (
              stationObj["05 - Member Details Member Birthday Year"] &&
              endTime.isSame(date, "day") &&
              stationObj["02 - Rental End Station ID"] === stationId
            ) {
              const calculatedAge = moment(endTime).diff(
                stationObj["05 - Member Details Member Birthday Year"],
                "years"
              );

              switch (true) {
                case calculatedAge >= 0 && calculatedAge <= 20:
                  count["0-20"] += 1;
                  break;
                case calculatedAge >= 21 && calculatedAge <= 30:
                  count["21-30"] += 1;
                  break;
                case calculatedAge >= 31 && calculatedAge <= 40:
                  count["31-40"] += 1;
                  break;
                case calculatedAge >= 41 && calculatedAge <= 50:
                  count["41-50"] += 1;
                  break;
                case calculatedAge >= 51:
                  count["0-20"] += 1;
                  break;
                case isNaN(calculatedAge):
                default:
                  count["unknown"] += 1;
              }
            }
          }
        });

        // close read stream when done reading.
        rl.on("close", () => {
          // put result into cache
          stationInfo.set(stationId, {
            ...stationInfo.get(stationId),
            [date.toString()]: {
              ...stationInfo.get(stationId)[date.toString()],
              distribution: Object.assign({}, count),
            },
          });
          result[stationCount] = new Result(stationId, count, date);
          if (stationCount >= requestStations.length - 1) {
            res.status(200).json(result);
          }
        });
      }
      // this is when cached result is hit
      else {
        result[stationCount] = new Result(
          stationId,
          stationInfo.get(stationId)[date.toString()]["distribution"],
          date
        );

        checkEndAndRespond(
          stationCount,
          requestStations,
          res,
          result,
          "end with hit"
        );
        // console.log(stationCount >= requestStations.length - 1, result);
      }
    } else {
      result[stationCount] = new Result(
        stationId,
        null,
        null,
        "invalid station id"
      );
      checkEndAndRespond(
        stationCount,
        requestStations,
        res,
        result,
        "end with invalid id"
      );
    }
  });
});
router.post("/last-twenty-trip", async (req, res) => {
  const fileStream = fs.createReadStream(filePath);
  const requestStations = req.body.stations;
  const stationInfo = req.app.locals.stationInfo;
  //   date is the queried date
  const date = moment(req.body.date, allowedTimeFormat, true);
  let result = [];
  if (!requestStations || !Array.isArray(requestStations)) {
    throw new Error("invalid station input");
  }
  if (!date.isValid()) {
    throw new Error("invalid date input!");
  }
  // flag the status of model
  let modelGet = false;
  // collect all attribute names
  let model = [];
  requestStations.forEach((stationIdNumber, stationCount) => {
    const stationId = String(stationIdNumber);
    let stationObjArr = [];
    if (stationInfo.has(stationId)) {
      console.log("stationinfo has the id " + stationId);
      if (
        !stationInfo.get(stationId)[date.toString()] ||
        !stationInfo.get(stationId)[date.toString()]["lastTwenty"] ||
        stationInfo.get(stationId)[date.toString()]["lastTwenty"].length === 0
      ) {
        console.log("no info for lasttwenty, ready to read");
        const rl = readline.createInterface({
          input: fileStream,
        });

        rl.on("line", (chunk) => {
          const dataArr = chunk
            .toString("utf8")
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (!modelGet) {
            model = dataArr;
            modelGet = true;
          } else {
            const stationObj = {};
            model.forEach((attr, index) => {
              stationObj[attr] = dataArr[index];
            });
            if (stationId === "27") console.log(stationObj);
            // optimization: end reading early
            if (
              moment(
                stationObj["01 - Rental Details Local Start Time"]
              ).isValid() &&
              moment(
                stationObj["01 - Rental Details Local Start Time"]
              ).isAfter(date, "day")
            ) {
              rl.close();
            }
            const endTime = moment(
              stationObj["01 - Rental Details Local End Time"]
            );
            if (
              endTime.isSame(date, "day") &&
              stationObj["02 - Rental End Station ID"] === stationId
            ) {
              stationObjArr.push(stationObj);
            }
          }
        });

        // close read stream when done reading.
        rl.on("close", () => {
          console.log("done reading for " + stationId, stationObjArr.length);
          stationObjArr.sort((a, b) => {
            const timeA = moment(a["01 - Rental Details Local End Time"]);
            const timeB = moment(b["01 - Rental Details Local End Time"]);
            if (timeA.isBefore(timeB, "second")) {
              return 1;
            } else if (timeA.isAfter(timeB, "second")) {
              return -1;
            } else {
              return 0;
            }
          });
          stationObjArr = stationObjArr.slice(0, 20);
          // put result into cache
          stationInfo.set(stationId, {
            ...stationInfo.get(stationId),
            [date.toString()]: {
              ...stationInfo.get(stationId)[date.toString()],
              lastTwenty: stationObjArr,
            },
          });
          result[stationCount] = { stationId, trips: stationObjArr };
          if (stationCount >= requestStations.length - 1) {
            res.status(200).json(result);
          }
        });
      }
      // this is when cached result is hit
      else {
        console.log("hit", stationId);
        result[stationCount] = {
          stationId,
          trips: stationInfo.get(stationId)[date.toString()]["lastTwenty"],
        };

        checkEndAndRespond(
          stationCount,
          requestStations,
          res,
          result,
          "end with hit"
        );
      }
    } else {
      result[stationCount] = new Result(
        stationId,
        null,
        null,
        "invalid station id"
      );
      checkEndAndRespond(
        stationCount,
        requestStations,
        res,
        result,
        "end with invalid id"
      );
    }
  });
});
module.exports = router;
