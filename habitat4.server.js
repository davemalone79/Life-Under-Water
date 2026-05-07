import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import http from 'http';
import Consul from 'consul';

const consul = new Consul();
const SERVICE_NAME = "habitat-service";
const SERVICE_PORT = 50051;

// Load proto
const pkgDef = protoLoader.loadSync('./habitat.proto');
const habitatProto = grpc.loadPackageDefinition(pkgDef).habitat;

// ---------------------------
// Health Check HTTP Endpoint
// ---------------------------
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
}).listen(SERVICE_PORT);

// ---------------------------
// Register with Consul
// ---------------------------
consul.agent.service.register({
  name: SERVICE_NAME,
  address: "localhost",
  port: SERVICE_PORT,
  check: {
    http: `http://localhost:${SERVICE_PORT}/health`,
    interval: "10s"
  }
}, err => {
  if (err) throw err;
  console.log("Habitat service registered with Consul");
});

// ---------------------------
// gRPC Server
// ---------------------------
function GetHabitatStatus(call, callback) {
  callback(null, {
    area_id: call.request.area_id,
    condition: "stable",
    temperature: 22.5,
    oxygen_level: 80,
    pressure: 1.2,
    variance_per_sensor: 0.3,
    last_updated: new Date().toISOString(),
    temperature_status: "Normal"
  });
}

const server = new grpc.Server();
server.addService(habitatProto.HabitatService.service, { GetHabitatStatus });

server.bindAsync(`0.0.0.0:${SERVICE_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});

// ---------------------------
// Deregister on shutdown
// ---------------------------
process.on('SIGINT', () => {
  consul.agent.service.deregister(SERVICE_NAME, () => {
    console.log("Habitat service deregistered");
    process.exit();
  });
});
