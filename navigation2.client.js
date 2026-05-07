import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const pkgDef = protoLoader.loadSync('./navigation.proto');
const navProto = grpc.loadPackageDefinition(pkgDef).navigation;

const client = new navProto.NavigationService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

// --------------------------------------
// Test new safety RPC
// --------------------------------------
function testSafety() {
  client.CheckNavigationSafety(
    {
      area_id: "reef-01",
      current_depth: 55,
      distance_from_border: 90
    },
    (err, res) => {
      console.log("\n--- Navigation Safety Check ---");
      console.log(res);
    }
  );
}

testSafety();
