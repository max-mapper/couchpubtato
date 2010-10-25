////
// This function saves the new entries under the feed document.
// It needs to check the hmac sig [TODO]
// And save that under the right document, rather than create a new one (just find the feed and add an element to its entries!)
function(doc, req){
  var lib             = require('vendor/xmlToActivityStreamJson');
  doc['updated_at']   = new Date().getTime();
  entries = lib.xmlToActivityStreamJson(req.body);
  for (var i=0;i<=entries.length;i=i+1)
  {
    doc['entries'].push(entries[i]);
  }  
  return [doc, "thx!"]
}