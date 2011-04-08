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

function processFeed(feedUrl, feedSaveFunc) {
  var feed = url.parse(feedUrl);
  request({uri:feed.href, headers: {'host' : feed.host}}, function (error, resp, body) {
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
            sys.log(body);
          }
        );
      }
    } 
  });
}

function fetchFeed (doc) {
  var starttime = new Date();   
  function feedSaveFunc(data) {
    for (var item in data) {
      saveItem(data[item], doc.couch, doc.db, "description");
    }
  }
  processFeed(doc.feed, feedSaveFunc);
  var endtime = new Date();
  setTimeout(fetchFeed, doc.interval ? doc.interval : (((endtime - starttime) * 5) + 20000));
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