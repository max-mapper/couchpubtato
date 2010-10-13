function(doc) {
  if (doc.postedTime) {
    emit(doc.postedTime, doc);
  }
}
