import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const pkgDef = protoLoader.loadSync('./trade.proto');
const tradeProto = grpc.loadPackageDefinition(pkgDef).trade;

let stock = 500;

// ------------------------------
// NEW: GrantFreeResource handler
// ------------------------------
function GrantFreeResource(call, callback) {
  const { citizen_id, resource_name, quantity, reason } = call.request;

  if (quantity > stock) {
    return callback(null, {
      success: false,
      message: `Not enough ${resource_name} in stock.`,
      remaining_stock: stock
    });
  }

  // Optional: special logic for citizen of the week
  let finalQuantity = quantity;

  if (reason === tradeProto.GrantReason.CITIZEN_OF_THE_WEEK) {
    finalQuantity = quantity * 2; // reward bonus
  }

  stock -= finalQuantity;

  callback(null, {
    success: true,
    message: `Granted ${finalQuantity} units of ${resource_name} to citizen ${citizen_id}. Reason enum: ${reason}`,
    remaining_stock: stock
  });
}

function GetResourcePrice(call, callback) {
  const price = 10 + Math.random() * 20;
  callback(null, {
    resource_name: call.request.resource_name,
    price,
    currency: "credits"
  });
}

function StreamMarketUpdates(call) {
  let count = 0;

  const interval = setInterval(() => {
    count++;

    call.write({
      sector: call.request.sector,
      resource_name: "moss",
      price: 5 + Math.random() * 3,
      timestamp: new Date().toISOString()
    });

    if (count >= 10) {
      clearInterval(interval);
      call.end();
    }
  }, 500);
}

function UploadTradeBatch(call, callback) {
  let total = 0;

  call.on('data', () => total++);

  call.on('end', () => {
    callback(null, {
      total_received: total,
      success: total > 0,
      message: `Processed ${total} trade items`
    });
  });
}

function LiveTrading(call) {
  call.on('data', (cmd) => {
    call.write({
      event_type: "trade_ack",
      resource_name: cmd.resource_name,
      quantity: cmd.quantity,
      timestamp: new Date().toISOString()
    });
  });

  call.on('end', () => call.end());
}

const server = new grpc.Server();
server.addService(tradeProto.TradeService.service, {
  GetResourcePrice,
  StreamMarketUpdates,
  UploadTradeBatch,
  LiveTrading,
  GrantFreeResource
});

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
