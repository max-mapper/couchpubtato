function(doc) {
  if (doc.feedMeta.link) {
    emit(doc.feedMeta.link, doc);
  }
}
