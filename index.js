// Imports
var express = require('express');
var morgan = require('morgan');
var multer = require('multer');
var crypto = require('crypto');
var mime = require('mime');
var jimp = require('jimp');
var fs = require('fs');

// ===============
// App Definitions
// ===============
var app = express();
var port = (process.env.HOSTNAME == 'wf-207-38-92-253.webfaction.com' ? 11339 : 4000);

// ==========
// Middleware
// ==========

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// ==================
// Multer Definitions
// ==================

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname+'/uploads/')
	},
	filename: function (req, file, cb) {
		crypto.pseudoRandomBytes(16, function (err, raw) {
			cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
		});
	}
});

//========
// Routing
//========

app.get('/', function(req, res) {
	res.sendFile(__dirname+'/public/index.html');
});

app.post('/upload*', multer({ storage: storage }).any(), function(req, res) {

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

	// Edits the image accordingly to the parameters present in
	// the routeParams object. Currently, only the first file
	// is edited.

	// To Do:
	// - Check if the file is an image before trying to edit it

	fileURLs.forEach(function(fileURL, i, fileURLs) {

		// Gets the fileID  from the URL
		var fileID = fileURL.split('/').splice(-1)[0];

		jimp.read(__dirname+"/uploads/"+fileID, function (err, img) {
			// To Do:
			// - Validate that req.params.id is 16 bytes hex string
			// - res.setHeader('Content-Type', storedMimeType);
			if (err) {
				console.log(err);

				// If the File is not an image, but we are in the last iteraction
				// we must then send the Files URLs to the http response
				if (i == fileURLs.length-1) {
					res.send(fileURLs);
				}
			}

			else if(img.getMIME().split('/').splice(0,1) == 'image') {
				// Defining the image manipulation parameters variables
				var q, h, w;

				// Calculating image resizing parameters
				if(routeParams.width || routeParams.height) {
					if(routeParams.width && routeParams.height) {
						w = routeParams.width;
						h = routeParams.height;
					} else if(routeParams.width){
						w = routeParams.width;
						h = jimp.AUTO;
					} else if(routeParams.height) {
						w = jimp.AUTO;
						h = routeParams.height;
					}

					w = Math.round(w);
					h = Math.round(h);
				} else {
					w = img.bitmap.width;
					h = img.bitmap.height;
				}

				// Setting the image quality parameter
				if(routeParams.quality || routeParams.q) {
					q = Math.round((routeParams.quality ? routeParams.quality : routeParams.q));
				} else {
					q = 70;
				}


				// ==============================
				// Image manipulating and writing
				// ==============================
				console.log(img.bitmap.height);
				img.resize(w, h, function(err, img) {
					if(err) throw err;
					console.log('w,h', i);
					img.quality(q, function(err, img) {

						// Writes the image
						// To Do:
						// - Currently, all images are saved as .jpg. They should
						// be saved accordingly to the image type
						img.write(__dirname+"/uploads/"+fileID, function(err) {
							if(err) throw err;

							// Sends the fileURLs array as response
							if(i == fileURLs.length-1) {
								res.send(fileURLs);
							}
						});
					});
				});
			}

		});
	});
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

app.delete('/image/:id', function (req, res) {

	var filePath = __dirname+"/uploads/"+req.params.id;


	fs.exists(filePath, function(exists) {
		if (exists) {
			fs.unlink(filePath, function(e) {
				res.status(204).send("File deleted (Status 204)");
			});
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
