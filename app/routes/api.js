// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

var BUCKET_NAME = 'b1.mojavebucket';

var User = require('../models/userModel');
var Album = require('../models/albumModel');
var Asset = require('../models/assetModel');

module.exports = function(app, passport, s3, fs) {
	function apiPath(arg) {
		return '/api'+arg
	}

	function albumPath(albumID) {
		return 'albums/'+albumID
	}

	function assetPath(albumID, assetID, filename) {
		return 'albums/'+albumID+'/'+assetID+'.'+getExt(filename);
	}

	function getExt(filename) {
		var a = filename.split('.');
		if (a.length === 1 || (a[0] === '' && a.length === 2))
		  return '';
		return a.pop();
	}

	// ALBUM =====================================================================

	// Create a new album
	app.post(apiPath('/album/new'), function(req, res) {
		var currentUser = req.user;

		// Create database entry so we have the new albumID
		var newAlbum = new Album();
		newAlbum.users = [currentUser._id];
		newAlbum.assets = [];
		newAlbum.coverAsset = null;
		newAlbum.save(function(err, album) {
			if (err) throw err;

			// Update user's album list using new albumID
			User.findById(currentUser._id, function (err, user) {
				user.albums.unshift(album._id);
		    user.save(function (err, user, count) {
		    	if (err) throw err;
		      console.log("Album added to user!", user);
		      res.send(200);
		    });
		  });
		});
	});

	// Upload photo
	app.post(apiPath('/album/:albumID/upload'), function(req, res) {
		// Prepare file upload
		var filename = req.files.newImage.name;
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;

		// Create database entry so we have the assetID
		var newAsset = new Asset();
		newAsset.save(function(err, asset) {
		  if (err) throw err;

		  var assetID = asset._id;

		  var remotePath = assetPath(albumID, assetID, filename);
		  console.log("Preparing to upload image...");
		  console.log("Album ID:", albumID);
		  console.log("Local path:", localPath);
		  console.log("Remote path:", remotePath);

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
		  	    Body: imgData,
		  	    ContentType: 'image/jpeg',
		  	  }, function (s3Err, s3Data) {
		  	    if (s3Err) {
		  	    	console.log(s3Err, s3Err.stack);
		  	    	res.send(404);
		  	    } else {
		  	    	console.log('Successfully uploaded file!', s3Data);

		  	    	// Update database with S3 key
		  	    	// asset.update({_id: assetID}, {s3Key: remotePath})

		  	    	res.send(200);
		  	    }
		  	  });
		  	}
		  });
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
