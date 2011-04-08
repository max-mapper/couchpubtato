# work in progress

uses node to archive rss feeds and stores the articles in couchdb

to try out:

install latest node + npm
npm install request
start couchdb
ruby create_test_data.rb
node db-watcher.js
look in the 'articles' database on couch :)