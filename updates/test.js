function(doc, req){
  var lib = require('vendor/xmlToActivityStreamJson');
  var data = lib.xmlToActivityStreamJson(req.body);
  data['_id'] = req.uuid;
  return [data, "posted"]
}