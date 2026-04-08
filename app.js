const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const query = `
    SELECT
      state_id AS stateId,
      state_name AS stateName,
      population
    FROM state;
  `;
  const states = await db.all(query);
  response.send(states);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const query = `
    SELECT
      state_id AS stateId,
      state_name AS stateName,
      population
    FROM state
    WHERE state_id = ${stateId};
  `;
  const state = await db.get(query);
  response.send(state);
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const query = `
    SELECT
      district_id AS districtId,
      district_name AS districtName,
      state_id AS stateId,
      cases,
      cured,
      active,
      deaths
    FROM district
    WHERE district_id = ${districtId};
  `;
  const district = await db.get(query);
  response.send(district);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const query = `
    SELECT
      state.state_name AS stateName
    FROM state
    INNER JOIN district
      ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};
  `;
  const result = await db.get(query);
  response.send(result);
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const query = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};
  `;
  const stats = await db.get(query);
  response.send(stats);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const query = `
    INSERT INTO district (
      district_name,
      state_id,
      cases,
      cured,
      active,
      deaths
    )
    VALUES (
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    );
  `;

  const result = await db.run(query);
  response.send("District Successfully Added");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateQuery = `
    UPDATE district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE district_id = ${districtId};
  `;

  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const query = `
    DELETE FROM district
    WHERE district_id = ${districtId};
  `;

  await db.run(query);
  response.send("District Removed");
});

module.exports = app;
