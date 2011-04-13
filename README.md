# Feed archiving using Node.js and CouchDB

This project evolved from a CouchApp that stored PubSubHubbub notifications in CouchDB into a Node.js app that actively fetches feeds and stores them in Couch. Original concept by @tylergillies (Tyler Gillies)

# still a work in progress!

Architecture: a 'parent' node process (couchpubtato.js) monitors a database on a CouchDB for any documents that have both a "feed" and "db" attribute. Anytime it sees a matching document it will spawn a worker that will fetch the url contained within the "feed" attribute and save each item into the local CouchDB specified in the "db" field.

Currently it only works on RSS/ATOM feeds but it is using JSDOM which is capable of HTML parsing so in a future version you will be able to include a javascript function to execute on the fetched DOM.

To try out:

    # install latest node + npm
    # start couchdb
    # clone this repo
    npm install request
    npm install jsdom
    git submodule init
    git submodule update
    ruby create_test_data.rb http://admin:password@localhost:5894
    node couchpubtato.js http://localhost:5984/feeds

Then look in the 'articles' database on Couch :)

# License

The MIT License

Copyright (c) 2010 Max Ogden and Tyler Gillies

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.