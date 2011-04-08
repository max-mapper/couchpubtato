var fs = require('fs'),
    sys = require('sys'),
    xml2js = require('./node-xml2js/lib/xml2js'),
    url = require('url'),
    request = require('request'),
    http = require('http'),
    crypto = require('crypto'),
    couchdb = require('./lib/node-couchdb-min/couchdb'),
    stdin = process.openStdin(),
    buffer = '',
    debug = false;

function processFeed(feedUrl, feedSaveFunc) {
  var feed = url.parse(feedUrl);
  request({uri:feed.href, headers: {'host' : feed.host}}, function (error, resp, body) {
    if (error) throw error;
    var parser = new xml2js.Parser(feedSaveFunc);
    parser.parseString(body);
  })
}

function saveItem(item, db, uniqueKey) {
  var _id = crypto.createHash('md5').update(item[uniqueKey]).digest("hex");
  db.get(_id, function(err, doc) {
    if (err) {
      if (err.couchDbError == "not_found") {
        db.put(_id, item, function(err, result) {
          if (err) return sys.error(err.stack);
          sys.log( "Created " + _id);
        });
      }
    } 
  });
}

function fetchFeed (doc) {
  var starttime = new Date();   
  function feedSaveFunc(data) {
    for (var item in data.channel.item) {
      saveItem(data.channel.item[item], new couchdb.Db(doc.db), "description");
    }
  }
  processFeed(doc.feed, feedSaveFunc);
  var endtime = new Date();
  setTimeout(fetchFeed, doc.interval ? doc.interval : (((endtime - starttime) * 5) + 300000));
}

stdin.on('data', function (chunk) {
  buffer += chunk.toString();
  while (buffer.indexOf('\n') !== -1) {
    line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);  
    var obj = JSON.parse(line);
    if (obj[0] === "doc") {
      fetchFeed(obj[1]);
    }
  }
});