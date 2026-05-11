import express from 'express';

const app = express();
app.use(express.json());

// ---------------------- HABITAT STATUS ----------------------
app.get('/habitat/status', (req, res) => {
  const area_id = req.query.area_id;

  if (!area_id) {
    return res.status(400).json({
      code: "INVALID_ARGUMENT",
      message: "area_id is required"
    });
  }

  // Example environmental data
  const response = {
    area_id,
    temperature_c: 15.2,
    oxygen_ppm: 7.8,
    pressure_kpa: 102.3,
    status: "STABLE"
  };

  res.json(response);
});

// ---------------------- ORGANISMS ----------------------
app.get('/habitat/organisms', (req, res) => {
  const area_id = req.query.area_id;

  if (!area_id) {
    return res.status(400).json({
      code: "INVALID_ARGUMENT",
      message: "area_id is required"
    });
  }

  res.json({
    area_id,
    organisms: ["kelp", "crab", "microalgae"]
  });
});

// ---------------------- START SERVER ----------------------
app.listen(50054, () => {
  console.log("Habitat HTTP service running on http://localhost:50054");
});
