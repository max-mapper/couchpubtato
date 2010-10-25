////
// This callback is called when adding a feed for subscription.
// It will extrat the hub url, then,
// save the feed into the couch, then,
// susbcribe to the hub.
// TODO : check for Superfeedr credentials and use Superfeedr for feeds with no hub in them!
function(doc, req){
  data = {}
  data['url']     = req.form.url;
  
  // Fine, now, we need to actually fetch that feed, and see if there is a hub url.
  data['entries']     = [];
  data['created_at']  = new Date().getTime();
  data['updated_at']  = new Date().getTime();
  data['_id']         = req.uuid;
  
  return [data, data['_id']+"\n"];
}