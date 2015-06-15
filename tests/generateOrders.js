import {assert} from 'chai';
import Immutable from 'immutable';
import generateOrders, {calculatePrice} from '../src/generateOrders';
// Allow snake case to be compatable with `produce_id` used by Coinbase
/*eslint camelcase: 0*/

describe('generateOrders', () => {

  it('should generate a buy and a sell order given btc and usd positions and an order size', function() {
    const position = Immutable.Map({
      BTC: 2.34,
      USD: 500
    });
    const actual = generateOrders(position, 0.01);
    const expected = Immutable.fromJS([
      {
        side: 'buy',
        size: '0.01',
        price: '211.86',
        product_id: 'BTC-USD'
      }, {
        side: 'sell',
        size: '0.01',
        price: '215.52',
        product_id: 'BTC-USD'
      }
    ]);
    assert.isTrue(Immutable.is(actual, expected));
  });
});

describe('calculatePrice', () => {

  let testValues = [
    {
      args: [2.34, 500, 0.01],
      expected: '211.86'
    }, {
      args: [2.34, 500, -0.01],
      expected: '215.52'
    }, {
      args: [5, 1000, 1],
      expected: '142.86'
    }, {
      args: [5, 1000, -1],
      expected: '333.33'
    }, {
      args: [25, 200, 1],
      expected: '7.41'
    }, {
      args: [25, 200, -1],
      expected: '8.70'
    }, {
      args: [100, 100, 0.25],
      expected: '1.00'
    }, {
      args: [100, 100, -0.25],
      expected: '1.01'
    }
  ];

  testValues.forEach(function(test) {
    let {args, expected} = test;
    it('should calculate the correct price given ' + args.join(', '), () => {
      assert.strictEqual(calculatePrice(...args), expected);
    });
  });
});
