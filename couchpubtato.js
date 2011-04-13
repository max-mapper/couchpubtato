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
    maxWorkers = 20,
    children = {};
    
stdin.setEncoding('utf8');

if ( process.argv[3] === "debug" ) {
  debug = true;
  sys.log("debug mode");
}

function queueFetch(doc) {
  if (debug) sys.log("queue length " + childProcesses().length);
  if ( childProcesses().length < maxWorkers ) {
    spawnFeedProcess(doc);
  } else {
    if (debug) sys.log("queueing " + doc._id);
    setTimeout(function(doc) {
      return function() {
        queueFetch(doc);
      }
    }(doc), 5000);
  }
}

function childProcesses() {
  var processes = [];
  for (var child in children) {
    if ( "feed_process" in children[child] ) {
      processes.push(children[child].feed_process);
    }
  }
  return processes;
}

var spawnFeedProcess = function( doc ) {
  var buffer = "";
  var count = 0;
  if (debug) sys.log( "Starting process for " + doc.feed )
  var p = child.spawn( process.execPath, [ path.join(__dirname, "feed-worker.js") ] );
  children[ doc._id ] = {"doc": doc, "feed_process": function() { return p }};
  p.stderr.on( "data", function ( chunk ) { sys.error( "stderr: " + chunk.toString() ) } )
  p.stdout.on( "data", function( chunk ) {
    buffer += chunk.toString();
    while (buffer.indexOf('\n') !== -1) {
      line = buffer.slice(0, buffer.indexOf('\n'));
      buffer = buffer.slice(buffer.indexOf('\n') + 1);  
      var obj = JSON.parse(line);
      if (obj[0] === "debug") {
        if (debug) sys.log(obj[1]);
      }
      if (obj[0] === "error") {
        sys.log("Error: " + obj[1]);
      }
      if (obj[0] === "update") {
        count--;
        var newDoc = JSON.parse(obj[1]);
        children[doc._id].doc._rev = newDoc.rev;
        if (debug) sys.log("updated " + JSON.stringify(newDoc));
      }
      if (obj[0] === "finished") {        
        var duration = obj[1];
        if (debug) sys.log("killing process for " + doc.feed);
        children[doc._id].feed_process().kill('SIGHUP');
        delete children[doc._id].feed_process;
        var nextRun = doc.interval ? doc.interval : (duration) * 5 + 100000;
        if(debug) sys.log(doc._id + ' next run in ' + nextRun);
        setTimeout(function() {
          spawnFeedProcess(children[doc._id].doc);
        }, nextRun);     
      }
    }
  });
  p.stdin.write(JSON.stringify(["db", couch.pathname.replace('/','')])+'\n');
  p.stdin.write(JSON.stringify(["doc", doc])+'\n');
}

emitter.on('change', function (change) {
  if (change.doc._id in children) {
    return;
  };
  var doc = change.doc;
  if (doc.feed && doc.db) {
    doc.couch = couch.protocol + "//" + couch.host;
    queueFetch(doc);
  }
});