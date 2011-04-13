var fs = require('fs'),
    sys = require('sys'),
    jsdom = require('jsdom'),
    url = require('url'),
    request = require('request'),
    http = require('http'),
    crypto = require('crypto'),
    headers = {'content-type':'application/json', 'accept':'application/json'},
    stdin = process.openStdin(),
    stdout = process.stdout,
    buffer = '',
    startTime = new Date(),
    pendingRequests = 0,
    feedDoc;
    
    // for debugging. run via: node feed-worker.js debug
    if ( process.argv[2] === "debug" ) {
      feedDoc = {
       "_id": "fdfb25620af1adcf55083e3fd80155e2",
       "_rev": "1-1ec61ec9658c6da3bf364018e19f4e37",
       "feed": "http://www.nytimes.com/services/xml/rss/nyt/pop_top.xml",
       "db": "articles",
       "couch": "http://localhost:5984"
      }
      feedDB = "feeds";
      fetchFeed();
    }


function zeroPad(n) {
  return n < 10 ? '0' + n : n;
}

function rfc3339(date) {
  return date.getUTCFullYear()   + '-' +
    zeroPad(date.getUTCMonth() + 1) + '-' +
    zeroPad(date.getUTCDate())      + 'T' +
    zeroPad(date.getUTCHours())     + ':' +
    zeroPad(date.getUTCMinutes())   + ':' +
    zeroPad(date.getUTCSeconds())   + 'Z';
};

function checkIfDone() {
  pendingRequests--;
  if ( pendingRequests === 0 ) {    
    stdout.write(JSON.stringify(["finished", new Date() - startTime])+'\n');
  }
};

function processFeed(feedUrl, callback) {  
  var feed = url.parse(feedUrl);
  stdout.write(JSON.stringify(["debug", "executing fetch #" + feedDoc.count + " for " + feed.href])+'\n');  
  request({uri:feed.href}, function (error, resp, body) {
    if (error) stdout.write(JSON.stringify(["error", sys.error(error.stack)])+'\n');
    jsdom.env(body, ['jquery.js', 'jfeed.js', 'jatom.js', 'jfeeditem.js', 'jrss.js'], function(errors, window) {
      var jf = new window.JFeed(window.document);
      callback(jf);
    });
  })
}

function saveMetadata(feed, doc) {
  if ( doc.count ) {
    doc.count++;
  } else {
    doc.count = 1;
  }
  feedDoc.count = doc.count;
  doc.updated_at = rfc3339(new Date());
  doc.type = feed.type;
  doc.version = feed.version;
  doc.title = feed.title;
  doc.link = feed.link;
  doc.description = feed.description;
  var url = doc.couch + "/" + feedDB + "/" + doc._id;
  request({ method: "put", uri:url, body: JSON.stringify(doc), headers:headers},
    function(err, resp, body) {
      if (err) stdout.write(JSON.stringify(["error", sys.error(err.stack)])+'\n');
      stdout.write(JSON.stringify(["update", body])+'\n');
      checkIfDone();
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
            if (err) stdout.write(JSON.stringify(["error", sys.error(err.stack)])+'\n');
            checkIfDone();
          }
        );
      }
    } else {
      checkIfDone();
    } 
  });
}

function fetchFeed() {
  var url = feedDoc.couch + "/" + feedDB + "/" + feedDoc._id;
  
  request({uri: url, headers: headers}, function (err, resp, body) {  
    if (err) stdout.write(JSON.stringify(["error", sys.error(err.stack)])+'\n');
    feedDoc = JSON.parse(body);
    var doc = feedDoc;
    processFeed(doc.feed, function(feed) {
      if ( feed.type === '' ) stdout.write(JSON.stringify(["debug", "Error parsing " + doc.feed])+'\n');
      if ( feed.items && feed.items.length > 0 ) {
        pendingRequests = feed.items.length + 1;
        saveMetadata(feed, feedDoc);
        var items = feed.items;
        for (var item in items) {
          saveItem(items[item], doc.couch, doc.db, "description");
        } 
      }
    });
  })
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
  }
});