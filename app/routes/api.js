// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

module.exports = function(app, passport, knox) {

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
