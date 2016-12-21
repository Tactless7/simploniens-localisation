var json = require('./createJson.js');
var geoJson = require('./convertToGeojson.js');

json.datajson(geoJson.geojson);

