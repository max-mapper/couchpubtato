function(doc) {
  if (doc.feed[0].postedTime) {
    emit(doc.feed[0].postedTime, doc);
  }
}
