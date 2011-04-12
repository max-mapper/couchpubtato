# work in progress

uses node to archive rss/atom feeds and stores the articles in couchdb

to try out:

    # install latest node + npm
    # start couchdb
    # clone this repo
    npm install request
    npm install jsdom
    git submodule init
    git submodule update
    ruby create_test_data.rb
    node couchpubtato.js http://localhost:5984/feeds

then look in the 'articles' database on couch :)