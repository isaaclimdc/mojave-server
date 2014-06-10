// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

var BUCKET_NAME = 'mojave';
var SERVER_NAME = 'https://s3-us-west-1.amazonaws.com';

var User = require('../models/userModel');
var Album = require('../models/albumModel');
var Asset = require('../models/assetModel');

function apiPath(arg) { return '/api'+arg; }

function albumPath(albumID) { return 'albums/'+albumID; }

function assetPaths(albumID, assetID, fileType) {
	var pre = 'albums/' + albumID;
	var file = assetID + '.' + fileType;
	return { 'thumb' : pre + '/thumb/' + file,
	         'full' : pre + '/full/' + file };
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

module.exports = function(app, s3, fs) {

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
		newAlbum.title = req.body.title;

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
		var fileName = req.files.newImage.name;
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;
		var fileType = getExt(fileName);

		// Create database entry so we have the assetID
		var newAsset = new Asset();
		newAsset.fileType = fileType;
		newAsset.owner = req.user._id;

		newAsset.save(function(err, asset) {
		  if (err) throw err;

		  var assetID = asset._id;

		  var remotePaths = assetPaths(albumID, assetID, fileType);
		  console.log("Preparing to upload image...");
		  console.log("Album ID:", albumID);
		  console.log("Local path:", localPath);
		  console.log("Remote path:", remotePaths.thumb, remotePaths.full);

		  sendImageToS3(remotePaths.full, false);
		  sendImageToS3(remotePaths.thumb, false); // TODO: GENERATE THUMBNAILS! Pretending for now

  		function sendImageToS3(remotePath, isThumb) {
  			if (isThumb) {
  				// Generate thumbnail here!
  			}
  			else {
	  			fs.readFile(localPath, function (err, data) {
	  				if (err) throw err;

			  		var params = {
			  	    Bucket: BUCKET_NAME,
			  	    Key: remotePath,
			  	    Body: data,
			  	    ContentType: 'image/jpeg',
			  	  };

			  	  s3.client.putObject(params, function (err, ETag) {
			  	  	if (err) throw err;

		  	    	console.log('Successfully uploaded file!', ETag);

	  	    		// Update album's list of assets
		    			Album.findById(albumID, function (err, album) {
			    			if (err) throw err;

			    			var remoteURL = assetURL(remotePath);
			    			console.log(remoteURL);

			    			album.assets.unshift(assetID);

			    	    album.save(function (err, album) {
			    	    	if (err) throw err;

			    	      console.log("Asset added to album!", album);
			    	      res.send(200);
			    	    });
		    	  	});
	  	 			});
	  			});
	  		}
	  	}
		});
	});

	// Get photo
	app.get(apiPath('/album/:albumID/:assetID'), function(req, res) {
		var albumID = req.params.albumID;
		var assetID = req.params.assetID;

		// Find asset in db
		Asset.findById(assetID, function (err, asset) {
			if (err) throw err;

			// Get remote URL
			var remotePaths = assetPaths(albumID, assetID, asset.fileType);

			// Get signed URL from S3
			var params = { Bucket: BUCKET_NAME, Key: remotePaths.thumb };
			s3.getSignedUrl('getObject', params, function (err, url) {
				if (err) throw err;

			  console.log("The URL is", url);
			  res.send(url);
			});
		});
	});

};
