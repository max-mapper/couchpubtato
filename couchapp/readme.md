# Couchpubtato feed viewer

A [CouchApp](http://couchapp.org) that lets you view feeds stored via [Couchpubtato](http://github.com/maxogden/couchpubtato)

## Installation

After you install it , visit this link to open the feed viewer: 

    http://yourcouch/yourdb/_design/couchpubtato/_rewrite

### Quick install

* [Get a couch](http://www.iriscouch.com/service), make a database and put some data into it.
* Copy these utilities to the new db: 

    curl -X POST http://user:pass@YOURCOUCH/\_replicate -d '{"source":"http://max.couchone.com/apps","target":"YOURDB", "doc\_ids":["_design/couchpubtato"]}' -H "Content-type: application/json"

### In-depth install

You'll have to get yourself a couch. The easiest way is from [the instructions on this page](http://www.iriscouch.com/service). Once it's going, open up `http://YOURCOUCH/_utils` and create a new database to store your data.

You can either replicate the couchapp from my couch [max.couchone.com/apps/_design/couchpubtato](http://max.couchone.com/apps/_design/couchpubtato) (quickest option) or, if you want to hack on the couchpubtato source code first, you'll need to install the [CouchApp command line utility](http://couchapp.org/page/installing) and check out this repo.

If you want to hack on couchpubtato, once you have the couchapp utility working, <code>git clone</code> this repo and go into this folder and execute <code>couchapp init</code>. To upload couchpubtato into your couch just run <code>couchapp push http://YOURCOUCH/DATABASENAME</code>. Otherwise see the Quick install section above.