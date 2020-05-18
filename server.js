const express = require("express");
const jwt = require("jsonwebtoken");

const stations = require("./routes/stations");
const fetchStationInfo = require("./utils/fetchStationInfo");
const {
  generateAccessToken,
  authenticateToken,
} = require("./utils/jwtVerification");

const app = express();
app.use(express.json());
// Shortcut endpoint for getting JWT token
app.get("/getToken", (req, res) => {
  res.send(generateAccessToken("fixed_token"));
});
app.use("/stations", authenticateToken, fetchStationInfo, stations);

const PORT = process.env.PORT || 8000;

// // error handling middleware
// app.use((error, req, res, next) => {
//   res.status(500).send(error);
// });
app.listen(PORT, () => {
  console.log("Server is running on PORT " + PORT);
});
module.exports = app;
