function(head, req){
  var rows = [];
  while(row = getRow()){
    rows.push(row);
  }
  return {
    "headers" : {"Content-Type" : "application/json"},
    "body" : JSON.stringify({
       "items" : rows
    })
  }
}