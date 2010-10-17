function(doc) {
  var ret = new Document();
  ret.add(doc.feedMeta.link);
  return ret;
}