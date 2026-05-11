
// client.js (Habitat client)
const axios = require('axios');

async function run() {
try {
const area_id = "A-17"; // change as needed

const response = await axios.get(
"http://localhost:50054/habitat/status",
{ params: { area_id } }
);

console.log("HABITAT RESPONSE:");
console.log(response.data);

} catch (err) {
console.error("CLIENT ERROR:", err.message);
}
}

run();
