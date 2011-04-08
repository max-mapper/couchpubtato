var fs = require('fs'),
    sys = require('sys'),
    jsdom = require('jsdom'),
    url = require('url'),
    request = require('request'),
    http = require('http'),
    crypto = require('crypto'),
    headers = {'content-type':'application/json', 'accept':'application/json'},
    stdin = process.openStdin(),
    buffer = '',
    feedDoc = {},
    fetchCount = 1,
    debug = false;
    
    // for debugging. run via: node feed-archiver.js debug
    if (process.argv[2]) {
      fetchFeed({
       "_id": "fdfb25620af1adcf55083e3fd80155e2",
       "_rev": "1-1ec61ec9658c6da3bf364018e19f4e37",
       "feed": "http://www.nytimes.com/services/xml/rss/nyt/pop_top.xml",
       "db": "articles",
       "couch": "http://localhost:5984"
      })
    }

function processFeed(feedUrl, callback) {
  var feed = url.parse(feedUrl);
  if (debug) sys.debug("executing fetch #" + fetchCount + " for " + feedUrl);
  request({uri:feed.href, headers: {'host' : feed.host}}, function (error, resp, body) {
    if (error) throw error;
    jsdom.env(body, ['jquery.js', 'jfeed.js', 'jatom.js', 'jfeeditem.js', 'jrss.js'], function(errors, window) {
      var jf = new window.JFeed(window.document);
      callback(jf);
    });
  })
}

function saveMetadata(feed, doc) {
  doc.type = feed.type;
  doc.version = feed.version;
  doc.title = feed.title;
  doc.link = feed.link;
  doc.description = feed.description;
  var feedDoc = doc.couch + "/" + feedDB + "/" + doc._id;
  request({ method: "put", uri:feedDoc, body: JSON.stringify(doc), headers:headers},
    function(err, resp, body) {
      if (err) return sys.error(err.stack);
      if (debug) sys.debug("saved feed doc: " + JSON.stringify(body));
    }
  );
}

function saveItem(item, couch, db, uniqueKey) {
  var _id = crypto.createHash('md5').update(item[uniqueKey]).digest("hex");  
  var doc_uri = couch + "/" + db + "/" + _id;
  request({uri:doc_uri, headers: headers}, function (err, resp, body) {  
    if (err) throw err;
    body = JSON.parse(body);
    if("error" in body) {
      if (body.error == "not_found") {
        request({ method: "put", uri:doc_uri, body: JSON.stringify(item), headers:headers},
          function(err, resp, body) {
            if (err) return sys.error(err.stack);
            if (debug) sys.debug("saved " + body);
          }
        );
      }
    } 
  });
}

function fetchFeed() {
  var doc = feedDoc;
  var starttime = new Date();   
  processFeed(doc.feed, function(feed) {
    if ( feed.type === '' && debug ) sys.debug("could not identify feed type for " + doc.feed);
    if ( fetchCount === 1 ) {
      saveMetadata(feed, feedDoc);
      fetchCount++;
    } else {
      fetchCount++;
    }
    var items = feed.items;
    if (items) {
      for (var item in items) {
        saveItem(items[item], doc.couch, doc.db, "description");
      } 
    }
  });
  var endtime = new Date();
  setTimeout(fetchFeed, doc.interval ? doc.interval : (endtime - starttime) * 5 + 10000);
}

stdin.on('data', function(chunk) {
  buffer += chunk.toString();
  while (buffer.indexOf('\n') !== -1) {
    line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);  
    var obj = JSON.parse(line);
    if (obj[0] === "db") {
      feedDB = obj[1];
    }
    if (obj[0] === "doc") {
      feedDoc = obj[1];
      fetchFeed(obj[1]);
    }
    if (obj[0] === "update") {
      feedDoc = obj[1];
    }
    if (obj[0] === "debug") {
      debug = true;
    }
  }
});