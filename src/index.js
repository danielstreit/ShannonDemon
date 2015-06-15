import client from './coinbaseClient';
import generateOrders from './generateOrders';

function makePlay() {
  client.cancelOpenOrders()
    .then(client.getPosition)
    .then(generateOrders)
    .then(client.sendOrders)
    .then(client.waitForDone)
    .then(makePlay);
}

makePlay();

