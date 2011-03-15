/**
 * Reduces the passed in view headers to a list of unique object key attributes
 *
 * @author Max Ogden
 */
function(keys, values, rereduce) { 

  function include(arr, obj) {
    return (arr.indexOf(obj) != -1);
  }
  
  var headers = [];
  for (var doc in values) {
    if(!include(headers, values[doc].feed)) {
      headers.push(values[doc]);
    }
  }
  
  return headers;
}