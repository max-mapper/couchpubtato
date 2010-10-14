function(head, req){
  start({
    "headers": {
      "Content-Type" : "application/json"
     }
  });
  var rows = [];
  while(row = getRow()){
    rows.push({
      postedTime: row.value.postedTime,
      object: row.value.object,
      actor: row.value.actor,
      verb: row.value.verb
    });
  }
  send(JSON.stringify({"items" : rows}));
}