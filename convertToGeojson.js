console.log = function() {};

module.exports = {
	geojson: function() {
		var fs = require('fs');
		var axios = require('axios');

		var app = {

			dataSimplon: null,
			
			objectGeojson: {
				type: "FeatureCollection",
				features: []
			},

			counter: 0,

			counterMax: null,

			memory: {},

			init: function() {
				app.loadFile();
			},

			loadFile: function() {
				fs.readFile(__dirname + '/data/simploniens.json', 'utf8', function(err, data){
					if (err) {
						throw err;
					}
					app.dataSimplon = JSON.parse(data);
					app.createFeatures();
				})
			},

			createFeatures: function() {
				var len = app.dataSimplon.simploniens.length;
				for (var i = 0; i < len; i++) {
					var feature = {
						type: "Feature",
						geometry: { type: "Point", coordinates: [] },
						properties: app.dataSimplon.simploniens[i]
					}
					app.objectGeojson.features.push(feature)
				}
				app.setInitialCounterMax();
			},

			setInitialCounterMax: function() {
				app.counterMax = app.objectGeojson.features.length;
				console.log("max = " + app.counterMax);
				app.deleteEmails();
				app.deleteTelephones();
				app.readPostCodeMemory((data) => {
					app.memory = data;
					app.checkPostCodeMemory();
				});
			},

			deleteEmails: function() {
				app.objectGeojson.features.map(function(current) {
					delete current.properties.email;
				})
			},

			deleteTelephones: function() {
				app.objectGeojson.features.map(function(current) {
					delete current.properties.telephone;
				})
			},

			readPostCodeMemory: function(cb) {
				var pathListCodes = __dirname + '/postcodesList.json';
				if (!fs.existsSync(pathListCodes)) {
					return cb({});
				}
				fs.readFile(pathListCodes, 'utf8', function(err, data) {
					if (err) {
						throw err;
					}
					cb(JSON.parse(data));
				})
			},

			checkPostCodeMemory: function() {
				var current = app.objectGeojson.features[app.counter];
				var codePostal = current.properties.codePostal;
				var coordinates;
				if (!app.memory[codePostal]) {
					app.lookForCoord();
				} else {
					coordinates = app.memory[codePostal];
					app.resultPostCodeInArray(coordinates);
				}
			},

			resultPostCodeInArray: function(coord) {
				var current = app.objectGeojson.features[app.counter];
				if (coord) {
					console.log("les mêmes = " + coord);
					current.geometry.coordinates = coord;
					app.counter++;
					var dontWait = true;
					app.nextFeatureOrStop(dontWait);
				} else {
					console.log("pas les mêmes = " + coord);
					app.lookForCoord();
				}
			},

			lookForCoord: function() {
				var current = app.objectGeojson.features[app.counter];
				var codePostal = current.properties.codePostal;
				var prenom = current.properties.prenom;
				if (codePostal && prenom) {
					var urlCoord = "http://nominatim.openstreetmap.org/search.php?country=france&postalcode=" + codePostal + "&format=json";
					axios.get(urlCoord)
					.then(function(response){
						if (response.data[0] !== undefined) {
							app.coordFound(response);
						} else {
							app.coordNotFound();
						}
					})
					.catch(function(error) {
						console.log(error);
						app.coordNotFound();
					}) 
				} else {
					app.coordNotFound();
				};
			},

			coordFound: function(response) {
				var current = app.objectGeojson.features[app.counter];
				var lat = response.data[0].lat;
				var lon = response.data[0].lon;
				var coordinates = [lon, lat];
				var codePostal = current.properties.codePostal;
				current.geometry.coordinates = coordinates;
				app.counter++;
				console.log("code postal = " + codePostal);
				app.addToMemory(codePostal, coordinates);
			},

			addToMemory: function(code, coord) {
				console.log("add" + code + "coord" + coord);
				console.log("le code est" + code);
				if (code && coord) {
					app.memory[code] = coord;
				}
				app.nextFeatureOrStop();
			},

			coordNotFound: function() {
				var current = app.objectGeojson.features[app.counter];
				var cityNotFoundMessage = current.properties.prenom + " " + current.properties.nom + 
				" dont l'id est : '" + current.properties.id + "' et pour lequel le code postal indiqué dans le json est :'" + current.properties.ville + 
				"' ne peut pas être localisé(e). Il ou elle n'apparaît donc pas dans le fichier Geojson, ni sur la carte du site. Merci de modifier l'information concernant la ville directement au niveau du GoogleSheet lié."						
				console.log(cityNotFoundMessage);
				app.eraseFeature();
			},

			eraseFeature: function() {
				var current = app.objectGeojson.features[app.counter];
				var indexCurrent = app.objectGeojson.features.indexOf(current);
				app.objectGeojson.features.splice(indexCurrent, 1);
				app.counterMax--;
				console.log("new counterMax = " + app.counterMax);
				app.nextFeatureOrStop();
			},

			nextFeatureOrStop: function(dontWait) {
				if (app.counter === app.counterMax) {
					app.saveMemoryInJson();
					app.sendJson();
				} else if (dontWait) {
					console.log(app.counter);
					app.checkPostCodeMemory();
				} else {
					console.log(app.counter);
					setTimeout(app.checkPostCodeMemory, 1200);	
				}
			},

			saveMemoryInJson: function() {
				var stringMemory = JSON.stringify(app.memory);
				fs.writeFile('./postcodesList.json', stringMemory, 'utf8', function(err) {
					if(err) {
						console.log(err);
					}
				})
			},
			
			sendJson: function() {
				console.log("stop");
				var stringGeojson = JSON.stringify(app.objectGeojson);
				fs.writeFile('public/simploniensGeo.geojson', stringGeojson, 'utf8', function(err) {
					if (err) {
						console.log(err);
					}
				})
			}

		}

		app.init();
	}
}