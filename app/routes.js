module.exports = function(app, passport) {

	// =====================================
	// HOME (with login) ===================
	// =====================================
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			res.redirect('/albums');
		}
		else {
			res.render('index.ejs');
		}
	});

	// =====================================
	// FACEBOOK LOGIN ======================
	// =====================================
	// route for facebook authentication and login
	app.get('/auth/facebook',
					passport.authenticate('facebook', { scope : 'email' }));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/albums',
			failureRedirect : '/'
		}));

	// =====================================
	// ALBUMS ==============================
	// =====================================
	app.get('/albums', isLoggedIn, function(req, res) {
		res.render('albums.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// PROFILE =============================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
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
