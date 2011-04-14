function(doc) {
  if (doc.description) {
    emit(doc._id, doc);
  }
}
