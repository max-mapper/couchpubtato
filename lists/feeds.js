function(head, req){ 
  start({"headers": {"Content-Type" : "application/json;charset=utf-8"}});
  if ('callback' in req.query) send(req.query['callback'] + "(");
  var started = false;
  send("{\"items\": [\n");
  while(row = getRow()){
    for(var item in row.value.feed){
      item = row.value.feed[item];
      if(started) send(",\n");
      send(JSON.stringify({
        postedTime: item.postedTime,
        object: item.object,
        actor: item.actor,
        verb: item.verb
      }));
      started = true; 
    }
  }
  send("]}\n");
  if ('callback' in req.query) send(")");
}