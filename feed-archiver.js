#!/usr/bin/env node

var fs = require('fs')
  , sys = require('sys')
  , xml2js = require('xml2js')
  , url = require('url')
  , http = require('http')
  , crypto = require('crypto')
  , parser = new xml2js.Parser();
  
var debug = false;

exports.processFeed = function(feedUrl, feedSaveFunc) {
  
  var feed = url.parse(feedUrl);

  var feedClient = http.createClient(80, feed.host);

  var request = feedClient.request("GET", feed.pathname, {'host' : feed.host});
  request.end();

  request.on('response', function(response) {
    response.setEncoding('utf8');
    
    var data;
    
    response.on('data', function(chunk) {
      data += chunk;
    });
    
    response.addListener('end', function() {
      parser.parseString(data);
    })
    
  });
  
  parser.addListener('end', feedSaveFunc);
}

exports.saveItem = function(item, db, uniqueKey) {
  
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