// Imports
var express = require('express');
var morgan = require('morgan');
var multer = require('multer');
var jimp = require('jimp');
var fs = require('fs');

// ===============
// App Definitions
// ===============
var app = express();
var port = (process.env.HOSTNAME == 'web506.webfaction.com' ? 18972 : 3000);

// ==========
// Middleware
// ==========
// app.use(morgan('combined'));

//========
// Routing
//========

app.get('/', function(req, res) {
	res.sendFile(__dirname+'/public/index.html');
});

app.post('/upload*', multer({ dest: __dirname + '/uploads/' }).any(), function(req, res) {

	// ===========================
	// Sets the routeParams object
	// ===========================

	// Example: upload/width/100/height/100
	// Will generate the following routeParams object:
	// { width: 100, height: 100 }
	var rawParams = req.params[0].split("/").splice(1);
	var routeParams = new Object();

	for(var i=0; i<rawParams.length; i=i+2) {
		routeParams[rawParams[i]] = rawParams[i+1];
	}

	// ==============
	// fileURLs Array
	// ==============

	// Array that contains the URLs of the uploaded files
	var fileURLs = [];

	// Populating the fileURLs array with the generated URLs
	for(var i=0 ; i < req.files.length ; i++) {
		fileURLs.push(req.protocol + '://' + req.get('host')+'/image/'+req.files[i].filename);
	}

	// ==================
	// Image Manipulation
	// ==================

	// Edits the image according to the parameters present in
	// the routeParams object. Currently, only the first file
	// is edited.
	var fileID = fileURLs[0].split('/').splice(-1);

	jimp.read(__dirname+"/uploads/"+fileID, function (err, img) {
		// Validate that req.params.id is 16 bytes hex string
		// Get the stored image type for this image
		// res.setHeader('Content-Type', storedMimeType);
		if (err) {
			throw err;
		}

		// Image resizing rules
		if(routeParams.width || routeParams.height) {
			if(routeParams.width && routeParams.height) {
				img.resize(Math.round(routeParams.width), Math.round(routeParams.height));
			} else if(routeParams.width){
				img.resize(Math.round(routeParams.width), jimp.AUTO);
			} else if(routeParams.height) {
				img.resize(jimp.AUTO, Math.round(routeParams.height));
			}
		}

		// Sets the Image quality
		if(routeParams.quality || routeParams.q) {
			var quality = Math.round((routeParams.quality ? routeParams.quality : routeParams.q));
			img.quality(quality);
		}

		// Writes the image
		img
			.write(__dirname+"/uploads/"+fileID+".jpg", function(err) {
				if(err) throw err;
				fs.rename(__dirname+"/uploads/"+fileID+".jpg",__dirname+"/uploads/"+fileID, function(err2) {
					if(err2)
						console.log(err2);
				});
			});
	});

	// ====================================
	// Sends the fileURLs array as response
	// ====================================
	res.send(fileURLs);
});

app.get('/image/:id', function (req, res) {

	var filePath = __dirname+"/uploads/"+req.params.id;


	fs.exists(filePath, function(exists) {
	  if (exists) {
	    fs.createReadStream(filePath).pipe(res);
	  } else {
	    res.status(404).send("File Not Found (Error 404)");

	  }
	});	
});

// ===============
// Starting Server
// ===============
app.listen(port, function () {
	console.log('App listening on port '+port);
});