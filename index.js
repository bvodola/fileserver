// Imports
var express = require('express');
var morgan = require('morgan');
var multer = require('multer');
var fs = require('fs');

// ===============
// App Definitions
// ===============
var app = express();
console.log(app.settings.env);
var port = (app.settings.env == 'development' ? 3000 : 18972);

// ==========
// Middleware
// ==========
app.use(morgan('combined'));

//========
// Routing
//========
app.get('/', function(req, res) {
	res.sendFile(__dirname+'/public/index.html');
});

app.post('/', multer({ dest: __dirname + '/uploads/' }).any(), function(req, res) {
	res.status(204).end();
});

app.get('/image/:id', function (req, res) {
  // Validate that req.params.id is 16 bytes hex string
  // Get the stored image type for this image
  // res.setHeader('Content-Type', storedMimeType);
  fs.createReadStream(__dirname+"/uploads/"+req.params.id).pipe(res);
});

// ===============
// Starting Server
// ===============
app.listen(port, function () {
  console.log('App listening on port '+port);
});