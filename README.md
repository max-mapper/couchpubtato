# PubSubHubbub Subscribing for CouchDB

Make CouchDB accept and store PubSubHubbub feeds! Original concept by @rdfturtle (Tyler Gillies)

# Why is this cool?

So I reckon you have some old and busted RSS or ATOM feeds that you need to pull from whenever you want updates, right?

Well, little buddy, it's time to enter the world of push!

Hook your pull feeds into the magic that is PubSubHubbubb (superfeedr.com does this for you... _for free!_) and they will push to a specific PubSubHubbubb subscriber endpoint whenever they have new content.

You might be asking "where am I going to get a valid PubSubHubbubb subscriber endpoint to store all of these awesome feed pushes"? Well, i'm glad you asked!

With Couchpubtato, you can make any Couch database act like a valid PubSubHubbubb subscriber endpoint.

# I still don't get it

Ok, so lets say you want to embed a feed of upcoming calendar events on your _sweet blog_, but the calendar page only has a junky RSS feed! You can use Superfeedr to push new RSS updates in realtime to a CouchDB of your choice, which turns your previously junky RSS feed into a full JSONP enabled API for maximum client side widget goodness!

Here's an example of this whole thingy working: I log all Portland, OR 911 calls and make them available as ActivityStreams here: <code>http://pdxapi.com/pdx911/feed?descending=true&limit=5</code>

# ActivityStreams

By default this will convert any incoming XML RSS/ATOM feed data into JSON [ActivityStreams](http://activitystrea.ms) format. ActivityStreams are the new hotness, pure XML ATOM/RSS is old and busted. Here's an example of an ActivityStreams formatted feed item:

    {
       "postedTime":"2010-10-14T00:58:32Z",
       "object": {
           "permalinkUrl": "http://rss.cnn.com/~r/rss/cnn_latest/~3/s52R1lImWu0/index.html",
           "objectType": "article",
           "summary": "O'Donnell, Coons stage feisty debate in Delaware"
       },
       "verb": "post",
       "actor": {
           "permalinkUrl": "http://rss.cnn.com/~r/rss/cnn_latest/~3/s52R1lImWu0/index.html",
           "objectType": "service",
           "displayName": "CNN.com Recently Published/Updated"
       }
    }

# How-to

You can use any CouchDB hosted pubicly (so that Superfeedr can post updates to it), but I'll assume you're working with a free Couch hosted by [CouchOne](http://couchone.com/get).

Couchpubtato is a CouchApp, which means that you'll have install the [CouchApp command line utility](http://couchapp.org/page/installing) to deploy it.

Once you have the couchapp utility working, <code>git clone</code> this repo and go into this folder and execute <code>couchapp init</code>.

You'll have to create a new database to store your data. I'll call mine <code>awesome-events</code>. When you run <code>couchapp push http://your.couchone.com/awesome-events</code> it will enhance your new database with the magical PubSubHubbubb sprinkles contained in Couchpubtato and teach your database how to store PubSubHubbubb data.

Once your database is ready to store data, we need to use Superfeedr to hook up a feed to dump into your new PubSubHubbubb enabled Couch database.

Go get a free Subscriber account at [Superfeedr](http://superfeedr.com) and use the PubSubHubbubb console to make a new PUSH request. Set the Topic to the URL of your RSS or ATOM feed.

For the Callback field, here's what to enter:

    http://your.couchone.com/awesome-events/_design/push/_rewrite/xml
    
When you submit the request on Superfeedr, it should say that everything worked okay. 

You can also obviously use the regular [PubSubHubbub protocol](http://code.google.com/p/pubsubhubbub/) (that is actually being used by the console) by doing a call like this :


    $ curl -X POST http://superfeedr.com/hubbub -u'<superfeedr_user>:<superfeedr_password> -d'hub.mode=subscribe' -d'hub.verify=sync' -d'hub.topic=<feed url> -d'hub.callback=http://your.couchone.com/awesome-events/_design/push/_rewrite/xml' -D-

It should return a <code>204</code> if everything was fine, and if not, it will indicate what was wrong in the BODY. There exists PubSubHubbub libraries in many languages.

Now any feed updates will get sent to your Couch and will be converted and saved as JSON ActivityStreams objects.

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