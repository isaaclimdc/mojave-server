// Set up ======================================================================
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var mongodb = require('./config/database.js');
var AWS = require('aws-sdk');
var fs = require('fs');

// Configuration ===============================================================
mongoose.connect(mongodb.url); // connect to our database

require('./config/passport.js')(passport); // pass passport for configuration
require('./config/aws.js')(AWS);  // setup Amazon S3

app.configure(function() {
	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(express.session({ secret: 'mojavesecretkey' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
});

// Routes ======================================================================
require('./app/routes/pages.js')(app, passport);
require('./app/routes/api.js')(app, passport, AWS, fs);

// Launch ======================================================================
app.listen(port);
console.log('Mojave Server is ready on port ' + port);
