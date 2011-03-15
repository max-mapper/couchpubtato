// adapted from https://github.com/szayat/node.couch.js

var stdin = process.openStdin();
var vm = require('vm');
var sys = require('sys');

stdin.setEncoding('utf8');

var buffer = ''
  , docs = {}
  , listenerDoc
  ;

var spawnFeedProcess = function( doc ) {
  sys.puts( "Starting process for " + doc._id )
  var p = child.spawn( process.execPath, [ path.join(__dirname, 'feed-watcher.js') ] );
  p.stderr.on( "data", function ( chunk ) { sys.error( "data error: " + chunk.toString() ) } )
  p.stdin.write(JSON.stringify(["listenerDoc", listenerDoc])+'\n');
  p.stdin.write(JSON.stringify(["doc", doc])+'\n');
  docs[ doc._id ]._feed_process = function() { return p };
}

stdin.on('data', function (chunk) {
  buffer += chunk.toString();
  while (buffer.indexOf('\n') !== -1) {
    line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);  
    var obj = JSON.parse(line);
    if ((obj[1]) === "ddoc") {
      listenerDoc = obj[1];
    } else if (obj[0] === "doc") {
      spawnFeedProcess(obj[1]);
    }
  }
});
