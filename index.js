function redisQSet(redis) {
  var createClient;

  // Save copy of original constructor.
  createClient = redis.createClient;

  redis.createClient = function () {
    var redis;

    // Apply to constructor and add new queue-list functions.
    redis = createClient.apply(this, arguments);
    redis.qspush = qspush;
    redis.qsunshift = qsunshift;
    redis.qsshift = qsshift;
    return redis;
  }
}

/**
 * What should this function return?
 */
function qspush(listName, item, cb) {
  return this.lpush(listName + '__order', item.toString(), setHash(listName, item, cb).bind(this));
};

function qsunshift(listName, item, cb) {
  return this.rpush(listName + '__order', item.toString(), setHash(listName, item, cb).bind(this));
};

function setHash(listName, item, cb) {
  return function (err) {
    if (err) {
      return cb && cb(err);
    }

    return this.hset(listName, item, true, function (err) {
      if (err) {
        return cb && cb(err);
      }

      return cb && cb(null, 'pushed');
    });
  }
}

/**
 * Feature, immediately call the item you want to return and remove
 * it from the list.
 */
function qsshift(listName, cb) {
  // this.hkeys(listName, console.log);
  // this.lrange(listName + '__order', 0, 10, console.log);

  return this.lpop(listName + '__order', function (err, first) {

    // Look for the first item in hashmap if list is empty. If it doesn't exist
    // see if there are still items in the array and set those as order
    if (!first) {
      return this.hkeys(listName, function (err, keys) {
        console.log('hashkeys', keys);

        if (!keys.length) {
          return cb && cb();
        }

        // If still keys are present in the order-array shove
        // them as paramaters in client.lpush.
        // Prepare params:
        keys.unshift(listName + '__order');
        keys.push(function (err, result) {
          if (err) {
            return cb && cb(err);
          }
          
          return this.qsshift(listName, cb);
        }.bind(this));

        this.lpush.apply(this, keys);
      }.bind(this));
    }

    return this.hget(listName, first, function (err, item) {
      if (err) {
        return cb && cb(err);
      }

      return this.hdel(listName, first, function (err) {
        if (err) {
          return cb && cb(err);
        }

        if (item === null) {
          return this.qsshift(listName, cb);
        }

        return cb && cb(err, first);
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

module.exports = redisQSet;


// Usage:
// var redis = require('redis');
// require('redis-qlist')(redis);

