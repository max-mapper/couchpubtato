var sys = require('sys')
, couchdb = require('./lib/node-couchdb-min/couchdb')
, archiver = require('./feed-archiver');

exports.listener = function(change) {
  if (!change.doc) return;
  
  if (change.doc.feed && change.doc.db) {
    var feedSaveFunc = function (data) {
      for (var item in data.channel.item) {
        archiver.saveItem(data.channel.item[item], new couchdb.Db(change.doc.db), "description");
      }
    }
    
    archiver.processFeed(change.doc.feed, feedSaveFunc);
  }
}
