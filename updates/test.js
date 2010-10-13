function(doc, req){
  require('vendor/xml2json')
  var data = xmlToJson(req.body);
  data['_id'] = req.uuid;
  data['params'] = req.query;
  data['type'] = 'pubsub';
  return [data, "posted"]
}