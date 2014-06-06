// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

module.exports = function(app, passport, AWS, fs) {
	function apiPath(arg) {
		return '/api'+arg
	}

	function albumPath(albumID) {
		return 'albums/'+albumID
	}

	function assetPath(albumID, filename) {
		return 'albums/'+albumID+'/'+filename;
	}

	function getFileExt(filename) {
		var a = filename.split('.');
		if (a.length === 1 || (a[0] === '' && a.length === 2))
		  return '';
		return a.pop();
	}

	// ALBUM =====================================================================

	// Upload photo
	app.post(apiPath('/album/:albumID/upload'), function(req, res) {
		var albumID = req.params.albumID;
		var filePath = req.query.file;
		var fullFilePath = __dirname+'/'+filePath;
		var remotePath = assetPath(albumID, filePath);
		console.log(albumID, fullFilePath, remotePath);

		// Read in the file and store to S3
		fs.readFile(fullFilePath, function (err, data) {
		  if (err) throw err;

		  var s3 = new AWS.S3();

		  s3.client.putObject({
		    Bucket: 'b1.mojavebucket',
		    Key: remotePath,
		    Body: data
		  }, function (s3err, s3data) {
		    if (s3err) {
		    	console.log(s3err, s3err.stack);
		    	res.send(400);
		    } else {
		    	console.log('Successfully uploaded file!', s3data);
		    	res.send(200);
		    }
		  });
		});
	});

};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't, redirect them to home
	res.redirect('/');
}
