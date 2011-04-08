var stdin = process.openStdin(),
    sys = require('sys'),
    dbemitter = require('./dbemitter/main'),
    child = require('child_process'),
    path = require('path'),
    db = process.argv[2],
    url = require('url'),
    couch = url.parse(db),
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
    doc.couch = couch.protocol + "//" + couch.host;
    spawnFeedProcess(doc);
  }
});