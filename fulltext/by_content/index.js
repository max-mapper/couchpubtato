function(doc) {
  var ret = new Document();
  ret.add(doc.object.content);
  ret.add(doc.object.summary);
  return ret;
}