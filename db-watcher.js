var stdin = process.openStdin(),
    sys = require('sys'),
    dbemitter = require('./dbemitter/main'),
    request = require('request'),
    child = require('child_process'),
    path = require('path'),
    db = process.argv[2],
    h = {'content-type':'application/json', 'accept':'application/json'},
    emitter = dbemitter.createCouchDBEmitter(db),
    children = {};
    
stdin.setEncoding('utf8');

var spawnFeedProcess = function( doc ) {
  sys.puts( "Starting process for " + doc._id )
  var p = child.spawn( process.execPath, [ path.join(__dirname, 'feed-archiver.js') ] );
  p.stderr.on( "data", function ( chunk ) { sys.error( "data error: " + chunk.toString() ) } )
  p.stdout.on( "data", function ( chunk ) { sys.error( "child says: " + chunk.toString() ) } )
  p.stdin.write(JSON.stringify(["doc", doc])+'\n');
  children[ doc._id ] = {'feed_process': function() { return p }};
}

emitter.on('change', function (change) {
  var doc = change.doc;
  if (doc.feed && doc.db) {
    spawnFeedProcess(doc);
  }
});