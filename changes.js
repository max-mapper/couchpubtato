var sys = require('sys')
, couchdb = require('./lib/node-couchdb-min/couchdb')
, archiver = require('./feed-archiver');

exports.listener = function(doc) {
  if (!doc) return;
  
  if (doc.feed && doc.db) {
    var feedSaveFunc = function (data) {
      for (var item in data.channel.item) {
        archiver.saveItem(data.channel.item[item], new couchdb.Db(doc.db), "description");
      }
    }
    
    archiver.processFeed(doc.feed, feedSaveFunc);
  }
}