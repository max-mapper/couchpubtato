function(doc) {
  if (doc.feedMeta.link && doc.postedTime) {
    emit(doc.feedMeta.link, doc);
  }
}