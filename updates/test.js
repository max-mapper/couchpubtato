function(doc, req){
  var lib = require('vendor/xmlToActivityStream');
  var data = lib.xmlToJson(req.body);
  data['_id'] = req.uuid;
  return [data, "posted"]
}