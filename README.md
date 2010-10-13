# PubSub Subscribing for CouchDB

Make CouchDB accept and store pubsub feeds!

# Why is this cool?

So I reckon you have some old and busted RSS or ATOM feeds that you need to pull from whenever you want updates, right?

Well, little buddy, it's time to enter the world of push!

Hook your pull feeds into the magic that is PubSubHubbubb (superfeedr.com does this for you... _for free!_) and they will push to a specific PubSubHubbubb subscriber endpoint whenever they have new content.

You might be asking "where am I going to get a valid PubSubHubbubb subscriber endpoint to store all of these awesome feed pushes"? Well, i'm glad you asked!

With Couchpubtato, you can make any Couch database act like a valid PubSubHubbubb subscriber endpoint. You can even use the built in xml2json.js utility to convert RSS or ATOM into JSON on the fly as it goes into your database.

# I still don't get it

Ok, so lets say you want to embed a feed of upcoming calendar events on your _sweet blog_, but the calendar page only has a junky RSS feed! You can use Superfeedr to push new RSS updates in realtime to a CouchDB of your choice, which turns your previously junky RSS feed into a full JSONP enabled API for maximum client side widget goodness!

# How-to

This is a CouchApp, which means that you'll have install the [CouchApp utility](http://couchapp.org/page/installing) to deploy it.

Once you have the couchapp utility working, check out this repo and go into this folder and execute <code>couchapp init</code>.

You'll have to have a CouchDB somewhere, but I'll assume you're working with a free Couch hosted by [CouchOne](http://couchone.com/get). Create a new empty database to host your feed. I'll call mine @awesome-events@. If you run @couchapp push http://your.couchone.com/awesome-events@ it will give your database some magical PubSubHubbubb sprinkles.

Now we need to user Superfeedr to hook up a feed to dump into your new PubSubHubbubb enabled Couch database.

Here's an ATOM feed of upcoming Portland tech events containing the word 'awesome': [http://calagator.org/events/search.atom?query=awesome](http://calagator.org/events/search.atom?query=awesome).

Go get a free Subscriber account at [Superfeedr](http://superfeedr.com) and use the PubSubHubbubb console to make a new PUSH request. Set the Topic to the URL of your RSS or ATOM feed.

For the Callback field, here's what to enter:

    http://your.couchone.com/awesome-events/_design/push/_rewrite/xml
    
When you submit the request on Superfeedr, it should say that everything worked okay. Now any feed updates will get sent to your Couch!

By default, XML is parsed using xml2json.js and saved as JSON objects. You can tweak this to your hearts content, just poke around the source code!

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