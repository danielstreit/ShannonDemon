import Immutable from 'immutable';
// Allow snake case to be compatable with `produce_id` used by Coinbase
/*eslint camelcase: 0*/

export default function generateOrders(position, size = 0.01) {
  size = Math.abs(size);
  const BTC = position.get('BTC');
  const USD = position.get('USD');
  return Immutable.fromJS([
    {
      side: 'buy',
      price: calculatePrice(BTC, USD, size),
      size: size.toString(),
      product_id: 'BTC-USD'
    }, {
      side: 'sell',
      price: calculatePrice(BTC, USD, -size),
      size: size.toString(),
      product_id: 'BTC-USD'
    }
  ]);
}

export function calculatePrice(BTC, USD, size) {
  return (USD / (BTC + 2 * size)).toFixed(2);
}
