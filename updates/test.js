function(doc, req){
  var lib = require('vendor/xml2json');
  var data = lib.xmlToJson(req.body);
  data['_id'] = req.uuid;
  data['params'] = req.query;
  data['type'] = 'pubsub';
  return [data, "posted"]
}