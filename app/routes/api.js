// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

var BUCKET_NAME = 'b1.mojavebucket';

module.exports = function(app, passport, s3, fs) {
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
		var imageName = req.files.newImage.name
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;
		var remotePath = assetPath(albumID, imageName);
		console.log(albumID, localPath, remotePath);

		// Read in the file
		fs.readFile(localPath, function (imgErr, imgData) {
			if (imgErr) {
				console.log("Error reading image!")
				res.redirect("/");
				res.send(404);
			} else {
				// Send the file to S3
			  s3.client.putObject({
			    Bucket: BUCKET_NAME,
			    Key: remotePath,
			    Body: imgData
			  }, function (s3Err, s3Data) {
			    if (s3Err) {
			    	console.log(s3Err, s3Err.stack);
			    	res.send(404);
			    } else {
			    	console.log('Successfully uploaded file!', s3Data);
			    	res.send(200);
			    }
			  });
			}
		});
	});

	// // Get photo
	// app.get(apiPath('/album/:albumID/:assetID'), function(req, res) {
	// 	var albumID = req.params.albumID;
	// 	var assetID = req.params.assetID;
	// 	var remotePath = assetPath(albumID, filePath);
	// 	console.log(albumID, fullFilePath, remotePath);

	// 	// Read in the file and store to S3
	// 	fs.readFile(fullFilePath, function (imgErr, imgData) {
	// 	  if (imgErr) throw imgErr;

	// 	  s3.client.putObject({
	// 	    Bucket: BUCKET_NAME,
	// 	    Key: remotePath,
	// 	    Body: imgData
	// 	  }, function (s3Err, s3Data) {
	// 	    if (s3Err) {
	// 	    	console.log(s3Err, s3Err.stack);
	// 	    	res.send(400);
	// 	    } else {
	// 	    	console.log('Successfully uploaded file!', s3Data);
	// 	    	res.send(200);
	// 	    }
	// 	  });
	// 	});
	// });

};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't, redirect them to home
	res.redirect('/');
}
