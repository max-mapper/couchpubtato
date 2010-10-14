function(head, req){
  start({
    "headers": {
      "Content-Type" : "application/json"
     }
  });
  var rows = [];
  while(row = getRow()){
    rows.push(row);
  }
  send(JSON.stringify({"items" : rows}));
}