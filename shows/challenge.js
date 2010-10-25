function(doc, req)  {
  // We need TOFIX the hub.challenge, so that it's only displayed if the doc exists.
  return req.query["hub.challenge"];
}