import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import http from 'http';
import Consul from 'consul';

const consul = new Consul();
const SERVICE_NAME = "navigation-service";
const SERVICE_PORT = 50052;

const pkgDef = protoLoader.loadSync('./navigation.proto');
const navProto = grpc.loadPackageDefinition(pkgDef).navigation;

// Health check
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
}).listen(SERVICE_PORT);

// Register with Consul
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
  console.log("Navigation service registered with Consul");
});

// Safety RPC
function CheckNavigationSafety(call, callback) {
  const { area_id, current_depth, distance_from_border } = call.request;

  let borderWarning = "Safe";
  if (distance_from_border < 20) borderWarning = "Critical: Border limit imminent";
  else if (distance_from_border < 100) borderWarning = "Warning: Approaching border";
  else if (distance_from_border < 500) borderWarning = "Caution: Near border";

  let depthWarning = "Safe depth";
  if (current_depth > 70) depthWarning = "Critical: Dangerous depth — risk of decompression sickness";
  else if (current_depth > 50) depthWarning = "Warning: High risk of the bends";
  else if (current_depth > 30) depthWarning = "Caution: Increased pressure";

  let action = "Maintain course";
  if (borderWarning.startsWith("Critical")) action = "Turn back immediately";
  else if (depthWarning.startsWith("Critical")) action = "Ascend immediately";
  else if (depthWarning.startsWith("Warning")) action = "Ascend to safer depth";

  callback(null, {
    area_id,
    border_warning: borderWarning,
    depth_warning: depthWarning,
    recommended_action: action
  });
}

const server = new grpc.Server();
server.addService(navProto.NavigationService.service, {
  CheckNavigationSafety
});

server.bindAsync(`0.0.0.0:${SERVICE_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});

// Deregister on shutdown
process.on('SIGINT', () => {
  consul.agent.service.deregister(SERVICE_NAME, () => {
    console.log("Navigation service deregistered");
    process.exit();
  });
});
