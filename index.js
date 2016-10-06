// Imports
var express = require('express');
var morgan = require('morgan');

// ===============
// App Definitions
// ===============
var app = express();
var port = (process.env.HOSTNAME == 'web506.webfaction.com' ? 99999 : 4000);

//========
// Routing
//========

app.get('/', function(req, res) {
	res.sendFile(__dirname+'/public/index.html');
});

// ===============
// Starting Server
// ===============
app.listen(port, function () {
	console.log('App listening on port '+port);
});
