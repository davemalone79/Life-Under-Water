import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import http from 'http';
import Consul from 'consul';

const consul = new Consul();
const SERVICE_NAME = "trade-service";
const SERVICE_PORT = 50053;

const pkgDef = protoLoader.loadSync('./trade.proto');
const tradeProto = grpc.loadPackageDefinition(pkgDef).trade;

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
  console.log("Trade service registered with Consul");
});

// Free resource RPC
function GrantFreeResource(call, callback) {
  const { citizen_id, resource_name, quantity, reason } = call.request;

  callback(null, {
    success: true,
    message: `Granted ${quantity} units of ${resource_name} to ${citizen_id}. Reason enum: ${reason}`,
    remaining_stock: 480
  });
}

const server = new grpc.Server();
server.addService(tradeProto.TradeService.service, {
  GrantFreeResource
});

server.bindAsync(`0.0.0.0:${SERVICE_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});

// Deregister on shutdown
process.on('SIGINT', () => {
  consul.agent.service.deregister(SERVICE_NAME, () => {
    console.log("Trade service deregistered");
    process.exit();
  });
});
