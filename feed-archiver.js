var fs = require('fs'),
    sys = require('sys'),
    jsdom = require('jsdom'),
    url = require('url'),
    request = require('request'),
    http = require('http'),
    crypto = require('crypto'),
    couchdb = require('./node-couchdb-min'),
    stdin = process.openStdin(),
    buffer = '',
    debug = false;
        
    if (process.argv[2]) {
      fetchFeed({
       "_id": "fdfb25620af1adcf55083e3fd80155e2",
       "_rev": "1-1ec61ec9658c6da3bf364018e19f4e37",
       "feed": "http://www.nytimes.com/services/xml/rss/nyt/pop_top.xml",
       "db": "articles"
      })
    }

function processFeed(feedUrl, feedSaveFunc) {
  var feed = url.parse(feedUrl);
  request({uri:feed.href, headers: {'host' : feed.host}}, function (error, resp, body) {
    // ??? resp.setEncoding('utf8');
    if (error) throw error;
    jsdom.env(body, ['jquery.js', 'jfeed.js', 'jatom.js', 'jfeeditem.js', 'jrss.js'], function(errors, window) {
      if (window.$("channel").length > 0) {
        var jf = new window.JFeed(window.document);
        feedSaveFunc(jf.items);
      } else {
        sys.log(feedUrl + " had no channel entries");
      }
    });
  })
}

function saveItem(item, db, uniqueKey) {
  var _id = crypto.createHash('md5').update(item[uniqueKey]).digest("hex");  
  db.get(_id, function(err, doc) {
    if (err) {
      if (err.couchDbError == "not_found") {
        db.put(_id, {item: item.description}, function(err, result) {
          sys.log( "Doc " + JSON.stringify({item: item.description}));
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
    for (var item in data) {
      saveItem(data[item], new couchdb.Db(doc.db), "description");
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