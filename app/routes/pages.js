// =============================================================================
// PAGES =======================================================================
// =============================================================================

module.exports = function(app, passport) {

	// Home (with login)
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			res.redirect('/albums');
		}
		else {
			res.render('index.ejs');
		}
	});

	// Authentication: Facebook login
	app.get('/auth/facebook',
					passport.authenticate('facebook', { scope : 'email' }));
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/albums',
			failureRedirect : '/'
		}));

	// Albums
	app.get('/albums', isLoggedIn, function(req, res) {
		res.render('albums.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// Profile - login access only
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// Logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't, redirect them to home
	res.redirect('/');
}
