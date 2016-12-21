var fs = require('fs');
var express = require('express');
var app = express();
app.use(express.static('public'));


app.get('/', function(req, res){
	res.send('index.html');
});

app.get('/data', function(req, res){
	fs.readFile(__dirname + '/simploniensGeo.geojson', 'utf8', function(err, data){
		if (err) {
			throw err;
		}
		var data = JSON.parse(data);
		res.json(data);
	})
});

app.listen(3456, function () {
	console.log('App listening on port 3456!')
})