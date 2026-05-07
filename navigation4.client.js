import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Consul from 'consul';

const consul = new Consul();
const pkgDef = protoLoader.loadSync('./navigation.proto');
const navProto = grpc.loadPackageDefinition(pkgDef).navigation;

consul.catalog.service.nodes("navigation-service", (err, result) => {
  const address = result[0].ServiceAddress;
  const port = result[0].ServicePort;

  const client = new navProto.NavigationService(
    `${address}:${port}`,
    grpc.credentials.createInsecure()
  );

  client.CheckNavigationSafety(
    { area_id: "reef-01", current_depth: 62, distance_from_border: 85 },
    (err, res) => {
      console.log("\n--- Navigation Safety ---");
      console.log(res);
    }
  );
});
