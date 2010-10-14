function(head, req){
  start({"headers": {"Content-Type" : "application/json;charset=utf-8"}});
  if ('callback' in req.query) send(req.query['callback'] + "(");
  var started = false;
  send("{\"items\": [\n");
  while(row = getRow()){
    if(started) send(",\n");
    send(JSON.stringify({
      postedTime: row.value.postedTime,
      object: row.value.object,
      actor: row.value.actor,
      verb: row.value.verb
    }));
    started = true;
  }
  send("]}\n");
  if ('callback' in req.query) send(")");
}