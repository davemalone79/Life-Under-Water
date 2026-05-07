import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Consul from 'consul';

const consul = new Consul();
const pkgDef = protoLoader.loadSync('./trade.proto');
const tradeProto = grpc.loadPackageDefinition(pkgDef).trade;

consul.catalog.service.nodes("trade-service", (err, result) => {
  const address = result[0].ServiceAddress;
  const port = result[0].ServicePort;

  const client = new tradeProto.TradeService(
    `${address}:${port}`,
    grpc.credentials.createInsecure()
  );

  client.GrantFreeResource(
    {
      citizen_id: "C-102",
      resource_name: "moss",
      quantity: 10,
      reason: tradeProto.GrantReason.WORKER_OF_THE_WEEK
    },
    (err, res) => {
      console.log("\n--- Trade Free Resource ---");
      console.log(res);
    }
  );
});
