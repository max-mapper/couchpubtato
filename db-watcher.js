var stdin = process.openStdin(),
    sys = require('sys'),
    dbemitter = require('./dbemitter/main'),
    child = require('child_process'),
    path = require('path'),
    db = process.argv[2],
    url = require('url'),
    couch = url.parse(db),
    emitter = dbemitter.createCouchDBEmitter(db),
    debug = false,
    children = {};
    
stdin.setEncoding('utf8');

if ( process.argv[3] === "debug" ) debug = true;

var spawnFeedProcess = function( doc ) {
  if (debug) sys.debug( "Starting process for " + doc.feed )
  var p = child.spawn( process.execPath, [ path.join(__dirname, 'feed-archiver.js') ] );
  p.stderr.on( "data", function ( chunk ) { sys.error( "stderr: " + chunk.toString() ) } )
  p.stdout.on( "data", function ( chunk ) { sys.error( "stdout: " + chunk.toString() ) } )
  if (debug) p.stdin.write(JSON.stringify(["debug"])+'\n');
  p.stdin.write(JSON.stringify(["db", couch.pathname.replace('/','')])+'\n');
  p.stdin.write(JSON.stringify(["doc", doc])+'\n');
  children[ doc._id ] = {'feed_process': function() { return p }};
}

emitter.on('change', function (change) {
  if (change.doc._id in children) {
    var worker = children[change.doc._id].feed_process()
    worker.stdin.write(JSON.stringify(["update", change.doc])+'\n');
    return;
  };
  var doc = change.doc;
  if (doc.feed && doc.db) {
    doc.couch = couch.protocol + "//" + couch.host;
    spawnFeedProcess(doc);
  }
});