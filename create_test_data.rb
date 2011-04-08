# seeds a CouchDB with some test feeds. run via: ruby create_test_data.rb

# change to your couch. admin username and password require if you're not in admin party
# e.g. YOURCOUCH = "admin:password@localhost:5984"
YOURCOUCH = "admin:admin@localhost:5984"

feeds = ["http://www.nytimes.com/services/xml/rss/nyt/GlobalHome.xml","http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml","http://www.nytimes.com/services/xml/rss/nyt/World.xml","http://www.nytimes.com/services/xml/rss/nyt/Africa.xml","http://www.nytimes.com/services/xml/rss/nyt/Americas.xml","http://www.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml","http://www.nytimes.com/services/xml/rss/nyt/Europe.xml","http://www.nytimes.com/services/xml/rss/nyt/MiddleEast.xml","http://www.nytimes.com/services/xml/rss/nyt/US.xml","http://www.nytimes.com/services/xml/rss/nyt/Education.xml","http://www.nytimes.com/services/xml/rss/nyt/Politics.xml","http://www.nytimes.com/services/xml/rss/nyt/NYRegion.xml"]

# create the necessary storage databases
puts %x!curl -X PUT http://#{YOURCOUCH}/feeds -H "Content-type":"application/json"!
puts %x!curl -X PUT http://#{YOURCOUCH}/articles -H "Content-type":"application/json"!

# make a feed entry in couch for each feed
feeds.each {|feed| puts %x!curl -X POST http://#{YOURCOUCH}/feeds -d '{"feed": "#{feed}", "db": "articles"}' -H "Content-type":"application/json"!}