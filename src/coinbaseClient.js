import config from '../config';
import uuid from 'node-uuid';
import Coinbase from 'coinbase-exchange';
import Immutable from 'immutable';
import {EventEmitter} from 'events';

/**
* An interface for interacting with Coinbase
*/
export default {
  cancelOpenOrders,
  getPosition,
  sendOrders,
  waitForDone
};

const authedClient = new Coinbase.AuthenticatedClient(
    config.cbexKey, config.cbexSecret, config.cbexPassphrase);
const websocketClient = new Coinbase.WebsocketClient();

const sentOrders = new Set();
const recievedOrders = new Set();

const tradeEmitter = new EventEmitter();

websocketClient.on('message', message => {
  if (sentOrders.has(message.client_oid)) {
    recievedOrders.add(message.order_id);
    sentOrders.delete(message.client_oid);
  }

  if (recievedOrders.has(message.order_id) && message.type === 'done') {
    recievedOrders.delete(message.order_id);
    tradeEmitter.emit('done', message);
  }
});

function getOrders() {
  return new Promise((resolve, reject) => {
    authedClient.getOrders((err, res, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function cancelOrder(order) {
  const orderId = typeof order === 'string' ? order : order.id;
  return new Promise((resolve, reject) => {
    authedClient.cancelOrder(orderId, (err, res, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function cancelOrders(orders) {
  return Promise.all(orders.map(cancelOrder));
}

function cancelOpenOrders() {
  return getOrders().then(cancelOrders);
}

function getPosition() {
  return new Promise((resolve, reject) => {
    authedClient.getAccounts((err, res, data) => {
      if (err) reject(err);

      const position = data.reduce((accum, account) => {
        return accum.set(account.currency, parseFloat(account.balance));
      }, Immutable.Map());

      if (!validatePosition(position)) {
        reject(new Error('Invalid position: ' + position));
      }
      resolve(position);
    });
  });
}

function sendOrder(order) {
  const clientId = uuid.v4();
  sentOrders.add(clientId);
  order = order.set('client_oid', clientId).toJS();
  // Using private method simplifies logic here
  /*eslint no-underscore-dangle: 0*/
  authedClient._placeOrder(order, err => {
    if (err) throw err;
  });
}

function sendOrders(orders) {
  orders.forEach(sendOrder);
}

function waitForDone() {
  return new Promise(resolve => {
    tradeEmitter.once('done', resolve);
  });
}

function validatePosition(position) {
  return position.size === 2 &&
    position.has('USD') &&
    position.has('BTC') &&
    position.every(Number.isFinite);
}
