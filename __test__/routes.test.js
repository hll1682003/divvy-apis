const request = require("supertest");
const app = require("./../server");
const { generateAccessToken } = require("./../utils/jwtVerification");
describe("Station Info endpoint", () => {
  const baseURL = "/stations";
  let stationId = "5";
  const token = `Bearer ${generateAccessToken("fixed_token")}`;
  ("fixed_payload");
  it("should return station info if station is valid", async () => {
    const res = await request(app)
      .get(baseURL + "/" + stationId)
      .set("Authorization", token);
    expect(res.body).toHaveProperty("station_id");
    expect(res.body["station_id"]).toEqual(stationId);
    expect(res.status).toEqual(200);
  });
  it("should return fail message and status if station is invalid", async () => {
    const res = await request(app)
      .get(baseURL + "/" + "non_existing_id")
      .set("Authorization", token);
    expect(res.status).toEqual(404);
    expect(res.body).toHaveProperty("status");
    expect(res.body["status"]).toEqual("fail");
  });
});
