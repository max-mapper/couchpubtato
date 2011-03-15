function(doc) {
  if(doc.feed) {
    emit(doc, doc);
  }
}