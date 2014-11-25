var assert = require('assert');
var redis = require('redis');
var async = require('async');
var client;

// Inject the redis-queuelist
require('../index.js')(redis);

client = redis.createClient();

describe('My discription', function () {
  var push, unshift, pop_order, shift_order;

  push = 'item_1 item_2 item_4 item_2'.split(' ');
  unshift = 'item_5 item_6 item_7 item_6'.split(' ');
  pop_order = 'item_2 item_4 item_1'.split(' ');
  shift_order = 'item_2 item_4 item_1 item_5 item_6 item_7 null'.split(' ');

  beforeEach(clearAndSet);

  it('Returns shifts items in the correct order.', makeShiftOrPop('qsshift', shift_order));

  // it('Returns pop items in the correct order.', makeShiftOrPop('qsspop', pop_order));

  it('Handles it correctly when list and hashtable is out of sync.', function () {
    client.hset('my_list', 'item_8', true, function () {

    });
  });

  function clearAndSet(done) {
    async.parallel([
      client.del.bind(client, 'my_list'),
      client.del.bind(client, 'my_list__order')
    ], function () {
      async.series([
        async.map.bind(async, push, client.qspush.bind(client, 'my_list')),
        async.map.bind(async, unshift, client.qsunshift.bind(client, 'my_list')),
      ], done);
    });
  }

  function makeShiftOrPop(type, order) {
    return function (done) {
      async.eachSeries(order, function (item, next) {
        client[type]('my_list', function (err, result) {
          if (item === 'null') {
            assert.equal(null, result);
          } else {
            assert.equal(result, item);
          }

          next();
        });
      }, done);
    };
  }

});
