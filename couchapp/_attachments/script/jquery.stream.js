(function($) {
  $.stream = $.stream || {};
  
  $.fn.stream = function(options) {
    options = $.extend(true, {}, $.fn.stream.defaults, options || {});
  }
  
  $.fn.stream.defaults = {  // set up default options
    templateSelector: function(selector) { return "#" + selector + "Template" },
    infiniteScrollBuffer: 400,
    infiniteScrollContainer: $( document ),
    loaderDom: $( '.loader' ),
  }

  $.extend($.stream, {
    
    /** Uses mustache to render a template out to a target DOM
     *  template: camelcase ID (minus the word Template) of the DOM object containg your mustache template
     *  target: ID of the DOM node you wish to render the template into
     *  data: data object to pass into the mustache template when rendering
     *  append: whether or not to append to or replace the contents of the target
    **/
    render: function( template, target, data, append ) {
      if ( ! data ) data = {};
      var html = $.mustache( $( $.stream.templateSelector(template) ).text(), data ),
          targetDom = $( "#" + target );
      if( append ) {
        targetDom.append( html );    
      } else {
        targetDom.html( html );
      }
    },
    
    bindInfiniteScroll: function() {
      var stream = this;

      $( window ).scroll( function( e ) {
        if ( stream.loaderShowing()  ) {
          return;
        }

        var containerScrollTop = stream.infiniteScrollContainer.scrollTop();
        if ( ! containerScrollTop ) {
          var ownerDoc = stream.infiniteScrollContainer.get().ownerDocument;
          if( ownerDoc ) {
            containerScrollTop = $( ownerDoc.body ).scrollTop();        
          }
        }
        var distanceToBottom = $( document ).height() - ( containerScrollTop + $( window ).height() );

        if ( distanceToBottom < stream.infiniteScrollBuffer ) {  
          stream.getPosts( { offsetDoc: stream.oldestDoc } );
        }
      });
    },
    
    showLoader: function() {
      this.loaderDom.removeClass( 'hidden' );
    },

    hideLoader: function() {
      this.loaderDom.addClass( 'hidden' );
    },

    loaderShowing: function() {
      var showing = false;
      if( this.loaderDom.css( 'display' ) !== "none" ) showing = true;
      return showing;
    },
  });

  function ajax(obj, options, errorMessage, ajaxOptions) {
    options = $.extend({successStatus: 200}, options);
    ajaxOptions = $.extend({contentType: "application/json"}, ajaxOptions);
    errorMessage = errorMessage || "Unknown error";
    $.ajax($.extend($.extend({
      type: "GET", dataType: "json", cache : !$.browser.msie,
      beforeSend: function(xhr){
        if(ajaxOptions && ajaxOptions.headers){
          for (var header in ajaxOptions.headers){
            xhr.setRequestHeader(header, ajaxOptions.headers[header]);
          }
        }
      },
      complete: function(req) {
        try {
          var resp = $.httpData(req, "json");
        } catch(e) {
          if (options.error) {
            options.error(req.status, req, e);
          } else {
            alert(errorMessage + ": " + e);
          }
          return;
        }
        if (options.ajaxStart) {
          options.ajaxStart(resp);
        }
        if (req.status == options.successStatus) {
          if (options.beforeSuccess) options.beforeSuccess(req, resp);
          if (options.success) options.success(resp);
        } else if (options.error) {
          options.error(req.status, resp && resp.error || errorMessage, resp && resp.reason || "no response");
        } else {
          alert(errorMessage + ": " + resp.reason);
        }
      }
    }, obj), ajaxOptions));
  }

  function toJSON(obj) {
    return obj !== null ? JSON.stringify(obj) : null;
  }

})(jQuery);