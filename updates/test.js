function(doc, req){
  var lib = require('vendor/xmlToActivityStreamJson');
  data = {}
  data['feed'] = lib.xmlToActivityStreamJson(req.body);
  data['_id'] = req.uuid;
  return [data, "posted"]
}