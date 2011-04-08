/**
 * Simplistic CouchDB client with a minimal level of abstraction.
 *
 * Simply create a new instance, passing database name (or complex options):
 *
 *    var db = new exports.Db('blog-posts');
 *    var slaveDb = new exports.Db({db:'blog-posts', host:'dbslave.local'});
 *
 * A db object is merely a gateway for dispatching requests to a particular
 * server. The following GETs a document with the key "foo" in the database
 * "blog-posts":
 *
 *    db.get('foo', function(err, result) {
 *      if (err) sys.error(err.stack);
 *      sys.log('document -> '+sys.inspect(result));
 *    });
 *
 * The above call is equivalent to this raw request:
 *
 *    GET /blog-posts/foo HTTP/1.1
 *    Host: localhost
 *
 * See README.md for more details and licensing.
 * Licensed under MIT, Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>.
 */
var sys = require("sys"),
    http = require('http'),
    sys = require('sys'),
    querystring = require('querystring');

// ----------------------------------------------------------------------------
// Convenience default server instance (localhost:5984, lazy)

exports.__defineGetter__('localhost', function(){
  delete exports.localhost; // delete property
  exports.localhost = new exports.Db(); // replace with instance
  return exports.localhost;
});

// ----------------------------------------------------------------------------
// Utils

// Mixin ( target, [source, ..] )
function mixin(target) {
  var i = 1, length = arguments.length, source;
  for ( ; i < length; i++ ) {
    if ( (source = arguments[i]) !== undefined ) {
      Object.getOwnPropertyNames(source).forEach(function(k){
        var d = Object.getOwnPropertyDescriptor(source, k) || {value:source[k]};
        if (d.get) {
          target.__defineGetter__(k, d.get);
          if (d.set) target.__defineSetter__(k, d.set);
        } else if (target !== d.value) {
          target[k] = d.value;
        }
      });
    }
  }
  return target;
};

// Stringify function embedded inside of objects. Useful for couch views
// Borrowed from node-couchdb Copyright (c) 2010 Debuggable Limited <felix@debuggable.com>
exports.jsonEncode = function(data) {
  return JSON.stringify(data, function(key, val) {
    return (typeof val === 'function') ? val.toString() : val;
  });
};

// -----------------------------------------------------------------------------
// connection pools keyed by "host:port:secure?"

var connectionPools = {},
    connectionPoolDefaults = {
      limit: 250,
      keepalive: 3
    };

exports.getConnectionPool = function(host, port, secure) {
  var key = host+':'+port+(secure ? ':1' : ':0'),
      pool = connectionPools[key];
  if (!pool) {
    pool = new HTTPConnectionPool(
        connectionPoolDefaults.keepalive,
        connectionPoolDefaults.limit,
        port, host, secure);
    connectionPools[key] = pool;
  }
  return pool;
}

// -----------------------------------------------------------------------------
// Db

/**
 * Represents a gateway, or handle, to a CouchDB server, optinally namespaced to
 * a certain database.
 *
 * Options:
 *
 *  - db (string) database/namespace. Defaults to "".
 *  - host (string) server hostname or ip address. Defaults to "localhost".
 *  - port (int) server port. Defaults to 5984.
 *  - debug (bool) enable debug output to stdout (sys.log). Defaults to false.
 *  - requestTimeout (float) default request timeout. Defaults to undefined (no timeout).
 *  - minConnections (int) number of connections to keep, aka "low mark". Defaults to 1. Set to 0 to disable keep-alive.
 *  - maxConnections (int) max number of concurrent connections. Defaults to 250.
 *
 * Db( [String db|Object options] )
 */
exports.Db = function Db(options) {
  if (typeof options === 'object') for (var k in options) this[k] = options[k];
  else this.db = options;
  if (this.debug === undefined && exports.debug) this.debug = true;
  if (this.db && typeof this.db !== 'string') throw new Error('db property must be a string');
  if (!this.port) this.port = 5984;
  if (!this.host) this.host = 'localhost';
  this.connectionPool = exports.getConnectionPool(
    this.host, this.port, this.secure);
}
mixin(exports.Db.prototype, {

  // GET something
  // post( [String path|Object options] [, callback(Error, Object, Response)] )
  get: function(options, callback) {
    if (typeof options === 'object') options.method = 'GET';
    else options = {method:'GET', path:options};
    return this.request(options, callback);
  },

  // PUT something
  // post( [String path|Object options] [, Object body] [, callback(Error, Object, Response)] )
  put: function(options, body, callback) {
    return this._putOrPost('PUT', options, body, callback);
  },

  // POST something
  // post( [String path|Object options] [, Object body] [, callback(Error, Object, Response)] )
  post: function(options, body, callback) {
    return this._putOrPost('POST', options, body, callback);
  },

  // Use request(..) for DELETE et. al.

  // Convenience function for querying _all_docs, which takes an optional
  // list in query.keys.
  // allDocs( [Array keys|Object query] [, callback(Error, Object, Response)] )
  allDocs: function(query, callback) {
    var opt = {method:'GET', path:'/_all_docs'}, body, t = typeof query;
    if (Array.isArray(query)) {
      opt.method = 'POST';
      opt.body = {keys: query};
      opt.query = {include_docs: true};
    } else if (t === 'object') {
      if (query.keys) {
        opt.method = 'POST';
        opt.body = {keys: query.keys};
        delete query.keys;
      }
      if (query.include_docs === undefined) query.include_docs = true;
      opt.query = query;
    } else {
      if (t === 'function') callback = query;
      opt.query = {include_docs: true};
    }
    this.request(opt, function(err, result, response) {
      if (callback) {
        if (err) return callback(err);
        var docs = {};
        for (var i=0,L=result.rows.length; i<L && (row = result.rows[i]); i++)
          docs[row.id] = row.doc || row.value;
        callback(err, docs, result, response);
      }
    });
  },

  // Send a request to the server/database
  request: function(options, callback) {
    var self = this, timeoutId, req, res, cbFired;
    // Options
    var opt = {
      method: 'GET',
      headers: {}
      // Optional: path, query, body, timeout
    }
    if (typeof options === 'string') opt.path = options;
    else if (typeof options !== 'object') throw new Error('options must be a string or an object');
    else for (var k in options) opt[k] = options[k];

    if (callback && typeof callback !== 'function')
      throw new Error('callback must be a function');
    opt.method = opt.method.toUpperCase();
    // Auth?
    if (this.auth) {
      var authType = this.auth.type || 'basic';
      if (authType !== 'basic')
        throw new Error('only "basic" auth.type is supported');
      opt.headers.Authorization = 'Basic '+
        base64_encode(this.auth.username+":"+this.auth.password);
    }
    // Setup headers
    if (!opt.headers.Host)
      opt.headers.Host = this.host;
    if (!opt.headers.Connection)
      opt.headers.Connection = (this.connectionPool.keep < 1) ? 'Close' : 'Keep-Alive';
    // Setup path
    if (typeof opt.path !== 'string') throw new Error('path option must be a string');
    var pathIsRel = (!opt.path || opt.path.charAt(0) !== '/');
    opt.path = '/'+
      ((this.db && pathIsRel) ? this.db+'/' : '')+
      opt.path.replace(/^\/+/, '');
    if (opt.query) {
      for (var k in opt.query) if (k !== 'stale') opt.query[k] = JSON.stringify(opt.query[k]);
      opt.path += '?' + querystring.stringify(opt.query);
    }
    // Setup body
    if (opt.body && (opt.method === 'PUT' || opt.method === 'POST')) {
      if (typeof opt.body !== 'string')
        opt.body = exports.jsonEncode(opt.body);
      opt.headers['Content-Length'] = opt.body.length;
      opt.headers['Content-Type'] = 'application/json';
    } else if (opt.body) {
      delete opt.body;
    }
    // Defer until we have a connection
    var onconn = function(err, conn) {
      if (err) return (!cbFired) && (cbFired = 1) && callback && callback(err);
      var onConnClose = function(hadError, reason) {
        if (hadError && callback && !cbFired) {
          cbFired = true; callback(new Error(reason || 'Connection error'));
        }
        conn.removeListener('close', onConnClose);
      }
      conn.addListener('close', onConnClose);
      req = conn.request(opt.method, opt.path, opt.headers);
      if (self.debug) {
        sys.log('['+self+'] --> '+opt.method+' '+opt.path+'\n  '+
          Object.keys(opt.headers).map(function(k){ return k+': '+opt.headers[k]; }).join('\n  ')+
          (opt.body ? '\n\n  '+opt.body : ''));
      }
      if (opt.body) {
        req.write(opt.body, 'utf-8');
      }
      req.addListener('response', function (_res) {
        res = _res;
        var data = '';
        //res.setBodyEncoding('utf-8'); // why does this fail?
        res.addListener('data', function (chunk){
          data += chunk;
        });
        res.addListener('end', function(){
          conn.removeListener('close', onConnClose);
          self.connectionPool.put(conn);
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          // log
          if (self.debug) {
            sys.log('['+self+'] <-- '+opt.method+' '+opt.path+' ['+res.statusCode+']\n  '+
              Object.keys(res.headers).map(function(k){ return k+': '+res.headers[k]; }).join('\n  ')+
              (data.length ? '\n\n  '+data : ''));
          }
          // parse body
          try {
            var result = JSON.parse(data);
          } catch (err) {
            if (!cbFired && callback) {
              err.message = 'JSON parse error: '+err.message+'. Input was: '+sys.inspect(data);
              cbFired = 1; callback(err, undefined, res);
            }
          }
          // check and handle result
          if ('error' in result) {
            if (!cbFired && callback) {
              cbFired = 1;
              var err = new Error('CouchDb '+result.error+': '+(result.reason || '?'));
              err.couchDbError = result.error;
              callback(err, result, res);
            }
            return;
          } else if (callback && !cbFired) {
            cbFired = 1; callback(null, result, res);
          }
        });
      });
      req.end();
    }
    this.connectionPool.get(onconn);
    // Timeout
    opt.timeout = opt.timeout || this.requestTimeout;
    if (typeof opt.timeout === 'number' && opt.timeout > 0) {
      timeoutId = setTimeout(function(){
        self.connectionPool.cancelGet(onconn);
        if (req) req.removeAllListeners('response');
        if (res) {
          res.removeAllListeners('data');
          res.removeAllListeners('end');
        }
        if (self.debug || opt.debug) {
          sys.log('['+self+'] --X '+opt.method+' '+opt.path+' timed out after '+
            (opt.timeout/1000.0)+' seconds');
        }
        if (callback && !cbFired) {
          cbFired = 1;
          callback(new Error(req ? 'CounchDB connection timeout' : 'CouchDB connection pool timeout'));
        }
      }, opt.timeout);
    }
  },

  _putOrPost: function(method, options, body, callback) {
    if (typeof options === 'object') options.method = method;
    else options = {method:method, path:options};
    if (typeof body === 'function') {
      callback = body; body = null;
    } else if (options.body && body) {
      throw new Error('Conflicting arguments: both options.body and the body argument are set')
    } else {
      options.body = body;
    }
    return this.request(options, callback);
  },

  toString: function() {
    return (module.id !== '.' ? module.id+'.':'')+
      (this.constructor.name || 'Object')+'('+
      (this.db ? sys.inspect(this.db) : '')+')';
  },
});

// ----------------------------------------------------------------------------
// Simple instance pool (aka free list)

function Pool(keep, limit) {
  process.EventEmitter.call(this);
  this.keep = keep || 0;
  this.limit = limit || 128;
  this.free = []; // push used to end/right, shift new from front/left
  this.busy = 0;
  this.getQueue = [];
}
sys.inherits(Pool, process.EventEmitter);
Pool.prototype.create = function() { throw new Error('not implemeted'); }
Pool.prototype.get = function(callback) {
  var instance = this.free.shift();
  if (!instance) {
    if (this.busy < this.limit) {
      instance = this.create();
    } else {
      if (callback) this.getQueue.push(callback);
      return;
    }
  }
  this.busy++;
  if (callback) callback(null, instance);
  return instance;
}
Pool.prototype.cancelGet = function(callbackToCancel) {
  var i = this.getQueue.indexOf(callbackToCancel), found = (i !== -1);
  if (found) this.getQueue.splice(i,1);
  return found;
}
Pool.prototype.put = function(instance) {
  if (this.getQueue.length) {
    this.getQueue.shift()(null, instance);
  } else {
    this.busy--;
    if (this.free.length < this.keep) this.free.push(instance);
    else this.destroy(instance);
  }
}
Pool.prototype.remove = function(item, noDestroy) {
  var i = this.free.indexOf(item), found = (i !== -1);
  if (found) this.free.splice(i,1);
  if (!noDestroy) this.destroy(item);
  return found;
}
Pool.prototype.removeAll = function(noDestroy) {
  if (!noDestroy)
    for (var i=0,item; (item = this.free[i]); i++) this.destroy(item);
  this.free = [];
}
Pool.prototype.destroy = function(item) { }

// ----------------------------------------------------------------------------
// HTTP connection pool

function HTTPConnectionPool(keep, limit, port, host, secure) {
  Pool.call(this);
  this.port = port;
  this.host = host;
  this.secure = secure;
  var self = this;
  process.addListener("exit", function (){
    // avoid lingering FDs
    try { self.removeAll(); }catch(e){}
    try { delete self; }catch(e){}
  });
}
sys.inherits(HTTPConnectionPool, Pool);
HTTPConnectionPool.prototype.create = function(){
  var self = this, conn = http.createClient(this.port, this.host);
  if (this.secure) {
    if (typeof this.secure !== 'object') this.secure = {};
	  conn.setSecure('X509_PEM', this.secure.ca_certs, this.secure.crl_list,
	    this.secure.private_key, this.secure.certificate);
  }
  conn._onclose = function(hadError, reason) {
    self.remove(conn);
    if (hadError)
      self.emit('error', new Error('Connection error'+(reason ? ': '+reason : '')));
    try { conn.removeListener('close', conn._onclose); }catch(e){}
  }
  conn.addListener('close', conn._onclose);
  return conn;
}
HTTPConnectionPool.prototype.destroy = function(conn){
  try { conn.removeListener('close', conn._onclose); }catch(e){}
  try { conn.end(); }catch(e){}
}

// ----------------------------------------------------------------------------
// Base64 encoding
var Buffer = require('buffer').Buffer;
const B64CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function base64_encode (str) {
  var data, datalen, o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="",
      tmp_arr = [];
  if (!str) return str;
  data = new Buffer(str.length*2);
  datalen = data.utf8Write(str);
  do { // pack three octets into four hexets
    o1 = data[i++];
    o2 = data[i++];
    o3 = data[i++];
    bits = o1<<16 | o2<<8 | o3;
    h1 = bits>>18 & 0x3f;
    h2 = bits>>12 & 0x3f;
    h3 = bits>>6 & 0x3f;
    h4 = bits & 0x3f;
    // use hexets to index into B64CHARS, and append result to encoded string
    tmp_arr[ac++] = B64CHARS.charAt(h1) + B64CHARS.charAt(h2) + 
      B64CHARS.charAt(h3) + B64CHARS.charAt(h4);
  } while (i < datalen);
  enc = tmp_arr.join('');
  switch (datalen % 3) {
    case 1: enc = enc.slice(0, -2) + '=='; break;
    case 2: enc = enc.slice(0, -1) + '='; break;
  }
  return enc;
}