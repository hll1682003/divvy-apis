require("dotenv").config();
const jwt = require("jsonwebtoken");
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
}
function authenticateToken(req, res, next) {
  const headers = req.headers["authorization"];
  const [, token] = headers ? headers.split(" ") : [];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(err);
    console.log(decoded);
    if (err) return res.sendStatus(403);
    next();
  });
}
module.exports = { authenticateToken, generateAccessToken };
