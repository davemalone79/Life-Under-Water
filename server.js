console.log("GATEWAY FILE LOADED");

// server.js (HTTP Gateway)
const express = require('express');
const axios = require('axios'); // <--- using axios instead of fetch

const app = express();
app.use(express.json());

// ---------------------- PROXY TO HABITAT SERVICE ----------------------
app.get('/habitat/status', async (req, res) => {
console.log("GATEWAY ROUTE HIT", req.query);

const area_id = req.query.area_id;

if (!area_id) {
return res.status(400).json({
code: "INVALID_ARGUMENT",
message: "area_id is required"
});
}

try {
const response = await axios.get(
`http://localhost:50054/habitat/status`,
{ params: { area_id } }
);

console.log("HABITAT RESPONSE:", response.data);
res.json(response.data);

} catch (err) {
console.error("Gateway error:", err.message);
res.status(503).json({
code: "UNAVAILABLE",
message: "Habitat service is unavailable"
});
}
});

// ---------------------- START GATEWAY ----------------------
app.listen(3000, () => {
console.log("HTTP Gateway running on http://localhost:3000");
});
