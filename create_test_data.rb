# seeds a CouchDB with some test feeds. run via: ruby create_test_data.rb

# change to your couch. admin username and password require if you're not in admin party
# e.g. YOURCOUCH = "admin:password@localhost:5984"
YOURCOUCH = "localhost:5984"

# for online testing
# a bunch of live NY Times feeds
feeds = ["http://www.nytimes.com/services/xml/rss/nyt/GlobalHome.xml", "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml", "http://www.nytimes.com/services/xml/rss/nyt/World.xml", "http://www.nytimes.com/services/xml/rss/nyt/Africa.xml", "http://www.nytimes.com/services/xml/rss/nyt/Americas.xml", "http://www.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml", "http://www.nytimes.com/services/xml/rss/nyt/Europe.xml", "http://www.nytimes.com/services/xml/rss/nyt/MiddleEast.xml", "http://www.nytimes.com/services/xml/rss/nyt/US.xml", "http://www.nytimes.com/services/xml/rss/nyt/Education.xml", "http://www.nytimes.com/services/xml/rss/nyt/Politics.xml", "http://www.nytimes.com/services/xml/rss/nyt/NYRegion.xml"]

# for offline testing -- place the 'test_feeds' folder in a local 
# webserver such that: http://localhost/test_feeds is accessible
# feeds = ['http://localhost/test_feeds/atom_namespace.xml', 'http://localhost/test_feeds/bad_feed.xml', 'http://localhost/test_feeds/no_xml_header.xml', 'http://localhost/test_feeds/rss2_only_title.xml', 'http://localhost/test_feeds/sampleRss091.xml', 'http://localhost/test_feeds/atom_no_id.xml', 'http://localhost/test_feeds/cdata_test.xml', 'http://localhost/test_feeds/parsing.xml', 'http://localhost/test_feeds/rss2sample.xml', 'http://localhost/test_feeds/sampleRss092.xml', 'http://localhost/test_feeds/attribute_escaping.xml', 'http://localhost/test_feeds/entity_escaping.xml', 'http://localhost/test_feeds/rdf_10_weirdness.xml', 'http://localhost/test_feeds/rss_no_link.xml', 'http://localhost/test_feeds/whitespace_id.xml', 'http://localhost/test_feeds/bad_atom_feed.xml', 'http://localhost/test_feeds/missing_entry_id.xml', 'http://localhost/test_feeds/rss2_only_link.xml', 'http://localhost/test_feeds/rss_rdf.xml', 'http://localhost/test_feeds/xhtml_entities.xml'];

# create the necessary storage databases
puts %x!curl -X PUT http://#{YOURCOUCH}/feeds -H "Content-type":"application/json"!
puts %x!curl -X PUT http://#{YOURCOUCH}/articles -H "Content-type":"application/json"!

# make a feed entry in couch for each feed
feeds.each {|feed| puts %x!curl -X POST http://#{YOURCOUCH}/feeds -d '{"feed": "#{feed}", "db": "articles"}' -H "Content-type":"application/json"!}