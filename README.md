# work in progress

uses node to archive rss feeds and stores the articles in couchdb

to try out:

    # install latest node + npm
    # start couchdb
    # clone this repo
    npm install request
    git submodule init
    git submodule update
    ruby create_test_data.rb
    node db-watcher.js http://localhost:5984/feeds

then look in the 'articles' database on couch :)