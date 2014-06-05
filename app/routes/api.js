// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

module.exports = function(app, passport, knox) {

	// Authentication: Facebook login
	app.get('/auth/facebook',
					passport.authenticate('facebook', { scope : 'email' }));
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/albums',
			failureRedirect : '/'
		}));

	// Upload photo
	app.get('/api/upload', function(req, res) {
		console.log(JSON.stringify(req.query));
		res.send(200);
	});
};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't, redirect them to home
	res.redirect('/');
}
