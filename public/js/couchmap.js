var app = angular.module('Todo', []);
// #######
// #
// # ANGULAR
// #

app.controller('TodoCtrl', function($scope) {

	$scope.username = 'gpuenteallott';

	$scope.mapBtnClick = function($event) {
		if ( $scope.username === '' ) {
			$event.preventDefault();
			alert("Empty username");
		}
	};
});


var couchmap = couchmap ? couchmap : {};
couchmap.ACEESS_TOKEN = 'pk.eyJ1IjoiZ3B1ZW50ZWFsbG90dCIsImEiOiJDb01hYlVFIn0.SC1BPQVo52ms__EJm3ybaw';
couchmap.MAP_TYPE = 'mapbox.places-city-v1';
couchmap.MAP_ID = 'gpuenteallott.jighe8gc';


couchmap.marker = function($) {
	return {
		emphasize : function( $marker ) {
			$marker.siblings('.leaflet-marker-icon').css('opacity','.7');
		},
		resetEmphasis : function ( $marker ) {
			$('.leaflet-marker-icon').css('opacity','1');
		},
		getTemplate: function () {
			return $('#templates #templateMarker').clone();
		},
		getContentTemplate: function () {
			return $('#templates #templateMarkerContent').clone();
		},
		setMarker: function (lat, lng, users) {
			// prepare the template marker
			var $thisMarker = couchmap.marker.getTemplate();

			for ( var i in users ) {
				$picBox = $('<div>').addClass('pic-box');
				$picBox.css('background-image', 'url('+users[i]['image']+')' );
				$thisMarker.find('.marker .pic-holder').append( $picBox );

				$contentRow = couchmap.marker.getContentTemplate();
				$contentRow.find('.profile-pic').css('background-image', 'url('+users[i]['image']+')' );;
				$contentRow.find('.name').text( users[i]['name'] );
				$contentRow.find('a').attr('href', 'http://www.couchsurfing.org/people/'+users[i]['username'] );

				$thisMarker.find('.marker-content').append( $contentRow.html() );
			}
			$thisMarker.find('.location').text(users[0]['city']+', '+users[0]['country']);
			$thisMarker.find('.marker').addClass('users-'+users.length);

		L.marker([lat, lng], {
				title: users[i]['username'],
				icon: L.divIcon({
					className: 'custom-marker users-'+users.length+' marker-username-'+users[i]['username'],
					html: $thisMarker.html(),
					iconSize: [90, 90]
				})
			}).addTo(couchmap.map.featureLayer);
		},
		open: function ( $marker, posX, posY ) {

			var middleX = $(window).width() / 2;
			var middleY = $(window).height() / 2;

			if ( posX < middleX && posY < middleY ) {
				$marker.addClass('quadrant-1').removeClass('quadrant-2 quadrant-3 quadrant-4');
			} else if ( posX > middleX && posY < middleY ) {
				$marker.addClass('quadrant-2').removeClass('quadrant-1 quadrant-3 quadrant-4');
			} else if ( posX < middleX && posY > middleY ) {
				$marker.addClass('quadrant-3').removeClass('quadrant-2 quadrant-1 quadrant-4');
			} else if ( posX > middleX && posY > middleY ) {
				$marker.addClass('quadrant-4').removeClass('quadrant-2 quadrant-3 quadrant-1');
			}

			$marker.addClass('open');
			$marker.siblings('.leaflet-marker-icon').removeClass('open');
		},
		closeAll: function () {
			$('.leaflet-marker-icon').removeClass('open');
		}
	}
}(jQuery)

couchmap.map = function($) {
	return {

		featureLayer:null,
		map:null,

		getPositionsFromData: function (err, data) {
			var positions = [];

			for ( i in data['results'] ) {

				// if there is no user for that index
				if ( typeof user['friends'][i] == 'undefined' ) {
					//console.log ( 'There is no user with index '+i );
					continue;
				}

				// if the geocoding didnt work
				if (  data['results'][i]["features"].length == 0 ) {
					console.log ( "Couldn't locate "+user['friends'][i]['name']+ ". Query was"+user['friends'][i]['query']);
					continue;
				}

				var latlng = data['results'][i]["features"][0]['center'];
				var lat = latlng[1];
				var lng = latlng[0];

				// if the position already exists (more than one user in the same place), we group them
				var existingPosition = false;
				for ( p in positions ) {
					if ( lat == positions[p]['lat'] && lng == positions[p]['lng'] ) {
						positions[p]['users'].push(user['friends'][i]);
						existingPosition = true;
						break;
					}
				}
				// if it is a new position (marker), we add the lat, lng and user to the positions array
				if ( !existingPosition ) {
					positions.push({
						'lat': lat,
						'lng': lng,
						'users': [user['friends'][i]]
					});
				}
			}
			return positions;
		},

		draw: function(err, data) {

			var positions = couchmap.map.getPositionsFromData(err, data);

			// After the positions structure is ready, we paint the markers
			for ( p in positions ) {
				couchmap.marker.setMarker( positions[p]['lat'], positions[p]['lng'], positions[p]['users'] );
			}

			// Add the feature layer to the map and fit bounds
			couchmap.map.featureLayer.addTo( couchmap.map.map );
			couchmap.map.map.fitBounds( couchmap.map.featureLayer.getBounds() );

			couchmap.map.setupEvents();

			// Move legend to the left
			$('.leaflet-control-container .leaflet-bottom.leaflet-left').append($('.leaflet-control-attribution').detach());

			couchmap.map.hideLoader();
		},

		setupEvents: function () {
			$('.leaflet-marker-icon').on('mouseenter', function() {
				couchmap.marker.emphasize($(this));
			});
			$('.leaflet-marker-icon').on('mouseleave', function() {
				couchmap.marker.resetEmphasis();
			});
			$('.leaflet-marker-icon').on('click', function(e) {
				couchmap.marker.open( $(this), e.pageX, e.pageY );
			});
			$('#map').on('click', function() {
				couchmap.marker.closeAll();
			});
		},

		hideLoader: function() {
			$('#map-loader').fadeOut();
		}
	}
}(jQuery)

// ------------------------
// Angular controllers

app.controller('MapCtrl', function($scope) {

	$scope.username = '';
	$scope.new_map_username = '';

	$scope.init = function() {

		// extract the username from the URL
		if ( typeof window.location.pathname.split('/')[2] != 'undefined' && window.location.pathname.split('/')[2] != '' ) {
			$scope.username = window.location.pathname.split('/')[2];
			var force_modal = false;
		} else {
			$scope.username = '';
			$('.nav-username').hide();
			var force_modal = true;
		}

		// make sure there is a map element
		if ( $('#map').length === 0 ) {
			return false;
		}

		if ( force_modal ) {
			$('#map').addClass('blur');
			$('#username-modal').show();
		}

		L.mapbox.accessToken = couchmap.ACEESS_TOKEN;

		var geocoder = L.mapbox.geocoder( couchmap.MAP_TYPE );
		couchmap.map.map = L.mapbox.map('map', couchmap.MAP_ID, {
				worldCopyJump: true
			});
		couchmap.map.featureLayer = L.mapbox.featureLayer();

		// Prepare one query for all friends. Limit is 50
		geocoderQuery = "";
		for ( i in user['friends'] ) {
			var thisQuery = user['friends'][i]['city'] +",";
			thisQuery += typeof user['friends'][i]['region'] == "undefined" ? '' :  user['friends'][i]['region'] +",";
			thisQuery += user['friends'][i]['country'];
			user['friends'][i]['query'] = thisQuery;
			geocoderQuery += thisQuery+";";
		}

		geocoderQuery = geocoderQuery.substring(0, geocoderQuery.length - 1);

		geocoder.query( geocoderQuery , couchmap.map.draw );
	};

	$scope.canvasClick = function($event) {

		if ( $scope.username == '' ) {
			return false;
		}

		// show modal to create new couchmap
		if ( $(event.target).closest('.nav-new').length ) {
			$('#username-modal').show();
			$('#map').addClass('blur');
		}

		// hide modals when clicked outside them
		else if( !$(event.target).closest('.couchmap-modal').length) {
			$('.couchmap-modal').hide();
			$('#map').removeClass('blur');
		}

	};

	$scope.newMap = function($event) {

		if ( $event.type != 'keyup' || $event.keyCode != 13 ) {
			return;
		}

		if ( $scope.new_map_username == '' ) {
			$($event.target).addClass('error');
			return;
		}

		// redirect
		window.location = '/map/' + $scope.new_map_username;
	};

	$scope.refresh = function() {
		window.location.reload();
	};

	$scope.init();
});

