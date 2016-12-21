var fs = require('fs');
var gsjson= require('google-spreadsheet-to-json');
var config = require('./config.js');
var md5 = require('md5');
var values = require('./values.js');

var curseur = 0;

/* Tableau regroupant les informations selon la spreadsheet appelée */
var groupTable= [
	{
		spreadsheetId: config.toulouse.spreadsheetId,
		worksheet: config.toulouse.worksheet,
	}
];

/* Appel de la fonction principale */
getDataGsheets(groupTable);

/* Extraction des spreadsheets grâce à une boucle et des promesses via la fonction next */
function getDataGsheets(table){
	for (var i = 0; i < table.length; i++){
		gsjson({
			spreadsheetId: table[i].spreadsheetId,
			worksheet: table[i].worksheet,
		})
		.catch(function(err){
			console.log(err.message);
			console.log(err.stack);
		})
		.then(function(result){
			next(result, table);
		});
	}
}

/* Lorsqu'une spreadsheet a été extraite, on réorganise le fichier Json comme prédéfini dans les keys de values.js . 
Les valeurs undefined sont remplacées par des chaines de caractères vides. */
function next(result, table){
	table[curseur].output = reorganizeJson(result, values);
	curseur ++;
	if(curseur === table.length){
		var fileJson = createJson(table);
		ecritureJson(fileJson, __dirname + '/data/simploniens.json');
	}
}

function reorganizeJson(data, keys){
	var multiTable = [];
	for(var i = 0; i < data.length ; i++){
		var promo = data[i].map(function(item){
			var output = {};
			createId(output, item.nom, item.prenom);
			for(var k in keys){
				output[k] = item[keys[k]] || '';
			}
			return output;
		});
		multiTable = multiTable.concat(promo);
	}
	return multiTable;
}

function createId(object, nom, prenom){
	object.id = md5(nom + prenom);
}

function createJson(table){
	var Json = {}
	Json.simploniens = [];
	for(var i = 0; i < table.length ; i++){
		Json.simploniens = Json.simploniens.concat(table[i].output);
	}
	return Json ;
}

function ecritureJson(file, path){
	var stringJson= JSON.stringify(file);
	fs.writeFile(path, stringJson, 'utf8', (err) => {
		if (err) throw err;
		console.log('It\'s saved!');
	});
}
