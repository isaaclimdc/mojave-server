// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

var BUCKET_NAME = 'b1.mojavebucket';
var SERVER_NAME = 'https://s3-us-west-1.amazonaws.com';

var User = require('../models/userModel');
var Album = require('../models/albumModel');
var Asset = require('../models/assetModel');

function apiPath(arg) { return '/api'+arg; }

function albumPath(albumID) { return 'albums/'+albumID; }

function assetPath(albumID, assetID, filename) {
	return 'albums/' + albumID + '/' + assetID + '.' + getExt(filename);
}

function assetURL(remotePath) {
	return SERVER_NAME + '/' + BUCKET_NAME + '/' + remotePath;
}

function getExt(filename) {
	var a = filename.split('.');
	if (a.length === 1 || (a[0] === '' && a.length === 2))
	  return '';
	return a.pop();
}

module.exports = function(app, passport, s3, fs) {

	// ALBUM =====================================================================

	// Get album object with albumID
	app.get(apiPath('/album/:albumID'), function(req, res) {
		// Update user's album list using new albumID
		Album.findById(req.params.albumID, function (err, album) {
			if (err) throw err;
			res.send(album);
	  });
	});

	// Create a new album
	app.post(apiPath('/album/new'), function(req, res) {
		var currentUser = req.user;

		// Create database entry so we have the new albumID
		var newAlbum = new Album();
		newAlbum.users = [currentUser._id];
		newAlbum.assets = [];
		newAlbum.coverAsset = null;
		newAlbum.title = 'Default Album Title';

		newAlbum.save(function(err, album) {
			if (err) throw err;

			// Update user's album list using new albumID
			User.findById(currentUser._id, function (err, user) {
				if (err) throw err;
				user.albums.unshift(album._id);
		    user.save(function (err, user) {
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
		  fs.readFile(localPath, function (err, data) {
		  	if (err) throw err;

	  		// Send the file to S3
	  		var params = {
	  	    Bucket: BUCKET_NAME,
	  	    Key: remotePath,
	  	    Body: data,
	  	    ContentType: 'image/jpeg',
	  	  };
	  	  s3.client.putObject(params, function (err, data) {
	  	  	if (err) throw err;

  	    	console.log('Successfully uploaded file!', data);

	    		// Update album's list of assets
	    		Album.findById(albumID, function (err, album) {
	    			if (err) throw err;

	    			var remoteURL = assetURL(remotePath);
	    			console.log(remoteURL);

	    			album.assets.unshift(assetID);
	    			album.assetThumbs.unshift(remoteURL);  // TODO: Actually do thumbnail

	    	    album.save(function (err, album) {
	    	    	if (err) throw err;
	    	      console.log("Asset added to album!", album);
	    	      res.send(200);
	    	    });
	    	  });

  	    	res.send(200);
	  	  });
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
