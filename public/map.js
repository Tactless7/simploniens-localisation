(function() {

	'use strict';

	var app = {

		map: new L.Map('map',{scrollWheelZoom:false} ),

		dataSimplon: null,

		init: function() {
			this.initmap();
		},

		initmap: function() {
			var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
			var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
			var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 18, attribution: osmAttrib});

			app.map.setView(new L.LatLng(46, 2),6);
			app.map.addLayer(osm);
			
			app.map.on('focus', function() { 
				app.map.scrollWheelZoom.enable();
			});
			app.map.on('blur', function() {
				app.map.scrollWheelZoom.disable();
			});

			this.addMarkers();
		},

		addMarkers: function() {

			$.getJSON("./simploniensGeo.geojson",function(data){

				var markerIcon = L.icon({
					iconUrl: 'marker.png',
					iconSize: [40,40]
				});
				
				var simploniens = L.geoJson(data,{
					pointToLayer: function(feature,latlng){
						app.dataSimplon = data.features;
						var marker = L.marker(latlng,{icon: markerIcon});
						
						//Mustache
						var popUpTemplate = $('#templatePopUpProfile').html();
						var htmlProfile = Mustache.to_html(popUpTemplate, feature.properties);
						marker.bindPopup(htmlProfile);

						/* sert pour mail si on ajoute une page contact
						$(marker).on('click', function(e) {
							var dataStorage = {
								id: e.currentTarget.feature.properties.id,
								prenom: e.currentTarget.feature.properties.prenom,
								nom: e.currentTarget.feature.properties.nom
							}
							var dataStorage_json = JSON.stringify(dataStorage);
							sessionStorage.setItem("dataStorage", dataStorage_json);
						});*/
						
						return marker;
					}
				});

				var clusters = L.markerClusterGroup();
				clusters.addLayer(simploniens);
				app.map.addLayer(clusters);
			});
		}

	}

	$(document).ready(function() {
		app.init();
	});
})();

