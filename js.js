// @author Rogier van Straten
// @creation 27 March 2015

// Cancels the event if it is cancelable, without stopping further propagation of the event.
function safePreventDefault( event ){
  
  ( event.preventDefault ) ? event.preventDefault() : event.stop() ;

  event.returnValue = false;
  event.stopPropagation() ;

}

// a sortable list
;(function($){

	var defaults = {
		target: null,
		after: null
	} ;

	$.fn.sortable = function( options ){

		if(this.length === 0){ return this; }

		// namespace
		var sorting = {} ;
		var root = this ;

		var initialize = function(){

			sorting.settings = $.extend( {}, defaults, options) ;
			sorting.$el = root ;

			// bind buttons
			$( sorting.settings.trigger ).on( 'click', doSorting );

		}

		var doSorting = function( event ){

			// stop further propogation
			safePreventDefault( event ) ;

			// ASC or DESC
			var order = ( $( this ).attr('href') ).replace('#', '' ).toLowerCase() ;
			var sortReturn = 1 ;

			sorting.$el.children().sort(function( a, b ){

				// get the target element
				var a = parseInt( $(a).find( sorting.settings.target ).text() ) ;
				var b = parseInt( $(b).find( sorting.settings.target ).text() ) ; 

				// get the sort order
				switch(order){
					case 'desc':
						sortReturn = ( a < b ) ? 1 : -1 ;
						break ;
					case 'asc':
						sortReturn = ( a > b ) ? 1 : -1 ;
						break ;
				}

				return sortReturn ;
				
			}).appendTo( sorting.$el ) ;

			// check if callback function exists
			if( sorting.settings.after && typeof(sorting.settings.after) === 'function' ){

				// execute
				sorting.settings.after() ;

			}

		}

		initialize() ;
		return this ;

	}

}(jQuery)) ;


// a list with pagination
;(function($){

	var defaults = {
		limit: 3
	} ;

	$.fn.pagination = function( options ){

		if(this.length === 0){ return this; }

		// namespace
		var paginate = {} ;
		var root = this ;
		
		var currentPage = 0,
				numberOfPages = 0 ;

		var initialize = function(){

			paginate.settings = $.extend( {}, defaults, options) ;

			paginate.$el = root ;

			paginate.$el.wrap('<div class="paginate"></div>') ;
			paginate.$wrap = paginate.$el.parent('.paginate') ;

			if( ! paginate.$el.is('ul') )
				console.log('This is not a UL element.') ;

			paginate.$children = paginate.$el.find('li') ;

			// Get the total number of pages 
			numberOfPages = Math.ceil( paginate.$children.size() / paginate.settings.limit ) ;

			// create buttons
			initPaginationButtons() ;

			// default hide all children
			paginate.$children.css({'display':'none'}) ;

			// bind update trigger
			paginate.$el.on( 'update', updatePagination );

			// default show the first "page"
			gotoPage( 0 ) ;

		}

		var initPaginationButtons = function(){

			var buttons = '' ;

			for (var i = 0; i < numberOfPages; i++) {

				// create buttons for each page
				buttons += '<a href="#' + i +'">'+ ( i + 1 ) +'</a>' ;

			};

			paginate.$wrap.append( '<div class="paginate-links">' + buttons + '</div>' ) ;

			$('.paginate-links a').on('click', triggerPageLink );

		}

		var triggerPageLink = function( event ){

			safePreventDefault( event ) ;

			// retrieve de pagenumber
			var pageNumber = ( $(this).attr('href')).replace('#','' ) ;

			// And go.
			gotoPage( pageNumber ) ;

		}

		var updatePagination = function(){

			paginate.$children = paginate.$el.find('li') ;
			gotoPage( 0 ) ;

		}

		// @param int page number
		var gotoPage = function( pageNumber ){

			// selection of elements
			var startcount 	= paginate.settings.limit * pageNumber,
					endcount 		= startcount + paginate.settings.limit ;

			// remove active link
			$('.paginate-links a').removeClass('active') ;
			$('.paginate-links a:eq('+pageNumber+')').addClass('active') ;
			
			// hide all the elements
			paginate.$children.css('display', 'none') ;

			// and show selection
			paginate.$children.slice( startcount, endcount ).css({'display':'block'}) ;

			// update the current page number
			currentPage = pageNumber ;

		}

		initialize() ;
		return this ;

	}

}(jQuery)) ;



// the carousel
;(function($){

	var defaults = {
			start: 0,
			controls: true,
			prevTitle: 'prev',
			nextTitle: 'next',
			auto: false,
			speed: 5000
	};

	// define function name
	$.fn.carousel = function( options ){

		if(this.length === 0){ return this; }

		// Create our namespace
		var slider = {} ;
		var root = this ;

		var initialize = function(){

			// default settings
			slider.settings = $.extend( {}, defaults, options) ;

			slider.$el = root ;

			// Create a DOM pool so the images are fetched just once. hidden
			slider.$el.prepend('<div class="carousel-pool" style="display:none"></div>') ;

			// Create some references
			slider.$cover = slider.$el.find('.carousel-cover') ;
			slider.$pool = slider.$el.find('.carousel-pool') ;
			slider.$pagination = slider.$el.find('.carousel-pagination') ;
			
			// Check if carousel-cover exists.
			if( ! slider.$cover.length > 0 ) 
				console.log('!!! The .carousel-cover needs to be configured.') ;

			slider.$cover.append('<div class="carousel-image"></div>') ;
			slider.$cover.append('<div class="carousel-title"></div>') ;

			// Bind events
			slider.$pagination.find('li a').on('click', gotoSlide) ;

			// User settings
			if( slider.settings.auto ) 
				// start slideshow
				startAutomation() ; 

			if( slider.settings.controls ) 
				// add controls
				initPrevNext() ;


			// Show the default slide
			gotoNthSlide( slider.settings.start ) ;

		}

		var initPrevNext = function(){

			var previous = '<a class="carousel-prev">'+slider.settings.prevTitle+'</a>' ;
			var next = '<a class="carousel-next">'+slider.settings.nextTitle+'</a>' ;
					
			slider.$cover.append( previous + next ) ;

			// bind event
			slider.$cover.find('.carousel-prev').on('click', function(){

				stopAutomation() ;
				gotoNextSlide( -1 ) ;

			}) ;

			// bind event
			slider.$cover.find('.carousel-next').on('click', function(){

				stopAutomation() ;
				gotoNextSlide() ;

			});

		}

		var startAutomation = function(){

			slider.auto = setInterval( gotoNextSlide, slider.settings.speed) ;

		}

		var stopAutomation = function(){

			// clear the interval if is defined
			if( typeof( slider.auto ) != "undefined" ) clearInterval( slider.auto ) ;

		}

		// @param int
		var gotoNextSlide = function( i ){
			
			// default is + 1
			i = i || 1 ;
			gotoNthSlide( $( slider.currentSlide ).parent().index() + i ) ;

		}
		
		// @param int
		var gotoNthSlide = function( i ){

			var slidesCount = slider.$pagination.find('li').length ;

			// Create an infinite loop.
			if( i > ( slidesCount - 1 ) ) i = 0 ;
			if( i < 0 ) i = slidesCount - 1 ;

			var slide = slider.$pagination.find('li:eq(' + i +') a') ;
			gotoSlide.apply( slide ) ;

		}

		var gotoSlide = function( event ){

			// is this an event?
			if( typeof( event ) != "undefined" ) {
				stopAutomation() ;
				safePreventDefault( event ) ;
			}

			// set current slide
			slider.currentSlide = this ;

			// remove active
			slider.$pagination.find('li.active').removeClass('active') ;

			// set current item to active
			$( this ).parent().addClass('active') ;
			
			// get the image and append it to the pool
			var img 	= getImage.apply( this ),
					title = $(this).find('img').attr('alt') ; 

			// Animate transition.
			slideTransition( img ) ;
			titleTransition( title ) ;

		}

		var titleTransition = function( title ){

			slider.$cover.find('.carousel-title').animate({opacity:0}, 150, function(){

				// set new text AND fade in.
				var new_title = $( this ).text( title ),

						// get the center of the new title
						ml = Math.floor( new_title.width() / 2 ) ;

				// reposition the title cause we want it centered
				new_title.css({'margin-left': ( -1 * ml ) + 'px' }).animate({ opacity: 1 }, 150 );

			});

		}

		var slideTransition = function( href ){

			// fade out old image
			slider.$cover.find('.carousel-image').animate({opacity:0}, 300, function(){

				// after animation remove image from the .carousel-image
				// but we keep it in the pool
				$( this ).remove() ;

				// set the new id
				slider.$cover.find('#new').attr('id','hold') ;

			});

			// prepend with the new image
			slider.$cover.prepend('<div class="carousel-image" id="new" style="background-image:url('+href+');"></div>') ;

		}

		// The image pool
		var getImage = function(){

			// get the image index number
			var imgN = $(this).parent().index(),
					src = $(this).attr( 'href' ) ;

			// if image not exists in pool
			if( ! slider.$pool.find('.img-' + imgN ).length > 0 ) 
				slider.$pool.append('<img class="img-'+imgN+'" src="'+src+'" />') ;

			return src ;

		}

		// and off we go
		initialize() ;

		return this ;

	}

}( jQuery )) ;

// googleMaps
var map = function(){

	var map ;
	var layers = [] ;

	var initialize = function(){

		map = this ;

    var mapOptions = {
      center: { lat: 48.861696, lng: 2.333754 },
      zoom: 14
    };
    
    // create the map canvas
    map.canvas = new google.maps.Map( document.getElementById('neighbourhood'), mapOptions ) ;
    map.infowindow = null ;

	}

	this.batchSimpleMarker = function( batch ){

		// create a SimpleMarker for each item
		for (var i = 0; i < batch.length; i++) {

			createSimpleMarker( batch[i] ) ;

		};

	}

	var createSimpleMarker = function( location ){

		// create marker
		var marker = new google.maps.Marker({

			// create latlng object
			position: new google.maps.LatLng( location.latLng[0], location.latLng[1] ),
			map: map.canvas,
			title: location.title
		});

		// Create info window
		createInfoWindow( location, marker ) ;

		// append marker to layers
		layers.push( marker ) ;

	}

	var createInfoWindow = function( location, marker ){

		// wrap content in a paragraph
		var contentHTML = '<h2>' + location.title + '</h2><p style="max-width:200px">' + location.description + '</p>' ;

		// create infowindow object
	  var infowindow = new google.maps.InfoWindow({
	  	content: contentHTML
	  });

	  // bind click event
	  google.maps.event.addListener( marker, 'click', function() {

	  	// Just one infowindow is allowed to open.
	  	// If infowindow is not null
	  	if ( map.infowindow ) {

	  		// close the other infowindow
	  		map.infowindow.close();

	  	}

	  	// set new infowindow
	  	map.infowindow = infowindow ;

	  	// and show it on the map
	    infowindow.open( map.canvas, marker ) ;
	
	  });

	}

	initialize() ;

}


$(document).ready(function(){

	// Initialise the carousel
	var a_carousel = $('.carousel-a').carousel({
		start: 3,
		controls: true,
		auto: true,
		speed: 3000,
		// adding some font awesome icons
		prevTitle: '<i class="fa fa-chevron-left"></i>',
		nextTitle: '<i class="fa fa-chevron-right"></i>'
	}) ;

	// initialize the pagination
	var a_pagination = $('.pagination-a').pagination({ limit: 5 }) ;

	$('.reviews_list').sortable({
		target: '.review_score',
		trigger: '.sortby',

		// after sorting the pagination it should be updated
		after: function(){

			a_pagination.trigger('update') ;

		}

	});

	// this can be a similar hotels feed or some nearby placemarks
	var hotels = [{
		title: 'Hotel Adipiscing',
		description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris commodo ex feugiat, rhoncus nisi vitae, aliquet dui. Vivamus quis velit vitae nunc lacinia tempus. Suspendisse ut odio quis nibh iaculis consequat. Phasellus vestibulum bibendum lorem eu pulvinar.',
		latLng: [48.864943, 2.332810]
	},{
		title: 'Hotel Curabitur',
		description: 'Curabitur rhoncus dui efficitur mauris ultrices tincidunt. Maecenas in diam sagittis, ultricies dui eget, maximus diam.',
		latLng: [48.863616, 2.338046]
	},{
		title: 'Hotel d\'Orsay',
		description: 'Etiam ligula nisi, aliquet ut risus a, fringilla venenatis nunc. Praesent bibendum lorem enim, quis vulputate nulla viverra a.',
		latLng: [48.859522, 2.328819]
	}];

	var neighbourhood = new map() ;
	neighbourhood.batchSimpleMarker( hotels );

});