$( function() {
  if ( ! monocles.inVhost() ) {
    var cfg = monocles.config;
    cfg.vhost = false
    cfg.db = document.location.href.split( '/' )[ 3 ];
    cfg.design = unescape( document.location.href ).split( '/' )[ 5 ];
    cfg.baseURL = "/" + cfg.db + "/_design/" + cfg.design + "/_rewrite/";
  }
  monocles.getPosts();
  monocles.bindInfiniteScroll();
} );

var defaults = {
    db: "api" // relative vhost links defined in rewrites.json
  , design: "ddoc"
  , vhost: true
  , baseURL: "/"
  , host: window.location.href.split( "/" )[ 2 ]
}

var monocles = {
  config: defaults,

  // initial state
  currentDoc: null,
  oldestDoc: null,
  streamDisabled: false,
  newUser: false,

  db: function() {
    return $.couch.db( monocles.config.db );
  },
  
  userProfile: function() {
    return $( '#header' ).data( 'profile' );
  },
  
  // vhosts are when you mask couchapps behind a pretty URL
  inVhost: function() {
    var vhost = false;
    if ( document.location.pathname.indexOf( "_design" ) === -1 ) {
      vhost = true;
    }
    return vhost;
  },
  
  // true if no admins exist in the database
  isAdminParty: function( userCtx ) {
    return userCtx.roles.indexOf("_admin") !== -1;
  },
  
  formatDiskSize: function( bytes ) {
    return ( parseFloat( bytes ) / 1024 / 1024 ).toString().substr( 0 , 4 ) + "MB"
  },
  
  /** Uses mustache to render a template out to a target DOM
   *  template: camelcase ID (minus the word Template) of the DOM object containg your mustache template
   *  target: ID of the DOM node you wish to render the template into
   *  data: data object to pass into the mustache template when rendering
   *  append: whether or not to append to or replace the contents of the target
  **/
  render: function( template, target, data, append ) {
    if ( ! data ) data = {};
    var html = $.mustache( $( "#" + template + "Template" ).text(), data ),
        targetDom = $( "#" + target );
    if( append ) {
      targetDom.html( html );    
    } else {
      targetDom.html( html );
    }
  },
  
  showLoader: function() {
    $( '.loader' ).removeClass( 'hidden' );
  },

  hideLoader: function() {
    $( '.loader' ).addClass( 'hidden' );
  },

  loaderShowing: function() {
    var showing = false;
    if( $( '.loader' ).css( 'display' ) !== "none" ) showing = true;
    return showing;
  },
  
  decorateStream: function() {
  	$( ".hover_profile" ).cluetip( { local: true, sticky: true, activation: "click" } );
    $( '.timeago' ).timeago();
  },
  
  getPosts: function( opts ) {
    console.log(monocles.oldestDoc)
    $.getJSON( monocles.config.baseURL + 'api', function( dbInfo ) {
      if( monocles.config.vhost ) dbInfo.db_name = 'api';
      monocles.render( 'db', 'stats', dbInfo );
    } );
    
    var opts = opts || {};
    if( opts.offsetDoc === false ) return;
    monocles.showLoader();

    function renderStream(posts) {
      monocles.hideLoader();
      if ( posts.length > 0 ) {
        var append = true;
        if ( opts.reload ) append = false;
        monocles.render( 'stream', 'stream', monocles.renderPosts( posts ), append );
        monocles.decorateStream();
      } else if ( ! opts.offsetDoc ){
        monocles.render( 'empty', 'stream' );
      }
    }

    var query = {
      "descending" : true,
      "limit" : 20,
      success: function( data ) {
        if( data.rows.length === 0 ) {
          monocles.oldestDoc = false;
          monocles.hideLoader();
          var posts = [];
        } else {
          monocles.oldestDoc = data.rows[ data.rows.length - 1 ];
          var posts = data.rows;
        }
        renderStream(posts);
      }
    }

    if ( opts.offsetDoc ) {
      $.extend( query, {
        "startkey": opts.offsetDoc.key,
        "startkey_docid": opts.offsetDoc.id,
        "skip": 1
      })
    }

    monocles.db().view( monocles.config.design + '/stream', query );
  },

  renderPosts: function( posts ) {
    var data = [];
    $.each(posts, function(i, r) {
      data.push({
        message : r.value.description,
        id: r.id,
        db : monocles.config.db,
        host: monocles.config.host
      })
    })    
    return {items: data};
  },
  
  bindInfiniteScroll: function() {
    var settings = {
      lookahead: 400,
      container: $( document )
    };

    $( window ).scroll( function( e ) {
      if ( monocles.loaderShowing()  ) {
        return;
      }

      var containerScrollTop = settings.container.scrollTop();
      if ( ! containerScrollTop ) {
        var ownerDoc = settings.container.get().ownerDocument;
        if( ownerDoc ) {
          containerScrollTop = $( ownerDoc.body ).scrollTop();        
        }
      }
      var distanceToBottom = $( document ).height() - ( containerScrollTop + $( window ).height() );

      if ( distanceToBottom < settings.lookahead ) {  
        monocles.getPosts( { offsetDoc: monocles.oldestDoc } );
      }
    });
  }
}