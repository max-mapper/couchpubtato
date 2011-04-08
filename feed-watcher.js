// adapted from https://github.com/szayat/node.couch.js

var stdin = process.openStdin();
var vm = require('vm');
var sys = require('sys');

stdin.setEncoding('utf8');

var buffer = ''
  , feeds = {}
  , listener
  ;

var loadModule = function (doc) {
  // eval the changes parser from the ddoc
  var wrapper = "(function (exports, require, module, __filename, __dirname) { "
              + doc.changes
              + "\n});";
  var module = {exports:{},id:'changes'};
  var compiledWrapper = vm.runInThisContext(wrapper);
  var p = compiledWrapper.apply(doc, [module.exports, require, module]);
  return module.exports;
}

function fetchFeed (doc) {
  var fetch = function () {
    var starttime = new Date();
    listener(doc);
    var endtime = new Date();
    setTimeout(fetch, doc.interval ? doc.interval : (((endtime - starttime) * 5) + 300000));
  }
  
  fetch();  
}

stdin.on('data', function (chunk) {
  buffer += chunk.toString();
  while (buffer.indexOf('\n') !== -1) {
    line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);  
    var obj = JSON.parse(line);
    if ((obj[0]) === "listenerDoc") {
      listener = loadModule(obj[1]).listener;
    } else if (obj[0] === "doc") {
      fetchFeed(obj[1]);
    }
  }
});