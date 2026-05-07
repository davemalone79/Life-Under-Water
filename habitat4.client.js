import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Consul from 'consul';

const consul = new Consul();
const pkgDef = protoLoader.loadSync('./habitat.proto');
const habitatProto = grpc.loadPackageDefinition(pkgDef).habitat;

consul.catalog.service.nodes("habitat-service", (err, result) => {
  const address = result[0].ServiceAddress;
  const port = result[0].ServicePort;

  const client = new habitatProto.HabitatService(
    `${address}:${port}`,
    grpc.credentials.createInsecure()
  );

  client.GetHabitatStatus({ area_id: "reef-01" }, (err, res) => {
    console.log("\n--- Habitat Response ---");
    console.log(res);
  });
});
