//this is adapted from @daleharvey's codez

exports.xmlToActivityStreamJson = function(xml) {
  function zeroPad(n) {
      return n < 10 ? '0' + n : n;
  }
  
  function rfc3339(date) {
    return date.getUTCFullYear()   + '-' +
      zeroPad(date.getUTCMonth() + 1) + '-' +
      zeroPad(date.getUTCDate())      + 'T' +
      zeroPad(date.getUTCHours())     + ':' +
      zeroPad(date.getUTCMinutes())   + ':' +
      zeroPad(date.getUTCSeconds())   + 'Z';
  };
  
  var i, item, body, date, data,
      re   = /^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/,
      str  = xml.replace(re, ""),
      feed = new XML(str);
      
  // this is nasty, but its rss, its supposed to be nasty
  // duck type rss vs atom
  if (feed.channel.length() > 0) {

    for (i = 0; i < feed.channel.item.length(); i++) {
      item = feed.channel.item[i];
      body = item.description.toString();
      date = new Date(item.pubDate.toString());
      
      if (!date) {  
       date = new Date();
      }	
      
      data = { 
        title : item.title.toString(),
        body  : body,
        link  : item.link.toString(),
        date : rfc3339(date),
        sourceTitle : feed.channel.title.toString()
      };
    }
  } else {
    default xml namespace="http://www.w3.org/2005/Atom";
    for each (item in feed..entry) { 
      body = item.content.toString();
      date = new Date(item.updated.toString());
      
      if (!date) { 
       date = new Date();
      }
        
      var link = null;
      if('link' in item) link = item.link[0].@href.toString();
      data = {
        title : item.title.toString(),
        body  : body,
        link  : link,
        date : rfc3339(date),
        sourceTitle : feed.title.toString()
      };
      
    }
  }
  
  return {
     "postedTime" : data.date,
     "object" : {
        "content" : data.body,
        "permalinkUrl" : data.link,
        "objectType" : "article",
        "summary" : data.title
     },
     "verb" : "post",
     "actor" : {
        "permalinkUrl" : data.link,
        "objectType" : "service",
        "displayName" : data.sourceTitle
     }
  }
}