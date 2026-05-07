import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const pkgDef = protoLoader.loadSync('./navigation.proto');
const navProto = grpc.loadPackageDefinition(pkgDef).navigation;

// --------------------------------------
// NEW SAFETY CHECK HANDLER
// --------------------------------------
function CheckNavigationSafety(call, callback) {
  const { area_id, current_depth, distance_from_border } = call.request;

  // Border warnings
  let borderWarning = "Safe";
  if (distance_from_border < 20) borderWarning = "Critical: Border limit imminent";
  else if (distance_from_border < 100) borderWarning = "Warning: Approaching border";
  else if (distance_from_border < 500) borderWarning = "Caution: Near border";

  // Depth warnings
  let depthWarning = "Safe depth";
  if (current_depth > 70) depthWarning = "Critical: Dangerous depth — risk of decompression sickness";
  else if (current_depth > 50) depthWarning = "Warning: High risk of the bends";
  else if (current_depth > 30) depthWarning = "Caution: Increased pressure";

  // Recommended action
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

// --------------------------------------
// Existing handlers (unchanged)
// --------------------------------------
function CalculateRoute(call, callback) {
  const distance = 5 + Math.random() * 20;
  callback(null, {
    origin: call.request.origin,
    destination: call.request.destination,
    distance_km: distance,
    estimated_time: `${(distance / 3).toFixed(1)} hours`
  });
}

function StreamSonarMap(call) {
  let count = 0;

  const interval = setInterval(() => {
    count++;

    call.write({
      area_id: call.request.area_id,
      depth: 20 + Math.random() * 50,
      temperature: 10 + Math.random() * 5,
      timestamp: new Date().toISOString()
    });

    if (count >= 10) {
      clearInterval(interval);
      call.end();
    }
  }, 500);
}

function UploadWaypoints(call, callback) {
  let total = 0;

  call.on('data', () => total++);

  call.on('end', () => {
    callback(null, {
      total_received: total,
      success: total > 0
    });
  });
}

function LiveNavigation(call) {
  call.on('data', (cmd) => {
    call.write({
      status: `Command received: ${cmd.command_type} (${cmd.value})`,
      timestamp: new Date().toISOString()
    });
  });

  call.on('end', () => call.end());
}

const server = new grpc.Server();
server.addService(navProto.NavigationService.service, {
  CalculateRoute,
  StreamSonarMap,
  UploadWaypoints,
  LiveNavigation,
  CheckNavigationSafety
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
