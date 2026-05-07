
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const pkgDef = protoLoader.loadSync('./trade.proto');
const tradeProto = grpc.loadPackageDefinition(pkgDef).trade;

const client = new tradeProto.TradeService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

function testGrantFreeResource() {
  client.GrantFreeResource(
    {
      citizen_id: "C-102",
      resource_name: "moss",
      quantity: 10,
      reason: tradeProto.GrantReason.CITIZEN_OF_THE_WEEK
    },
    (err, res) => {
      console.log("\n--- Free Resource Grant (Enum) ---");
      console.log(res);
    }
  );
}

testGrantFreeResource(
