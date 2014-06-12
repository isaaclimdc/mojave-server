// =============================================================================
// MOJAVE API ==================================================================
// =============================================================================

var BUCKET_NAME = 'mojave';
var SERVER_NAME = 'https://s3-us-west-1.amazonaws.com';

var User = require('../models/userModel');
var Album = require('../models/albumModel');
var Asset = require('../models/assetModel');

var fs = require('fs');
var im = require('imagemagick');
var async = require('async');

function apiPath(arg) { return '/api'+arg; }

function albumPath(albumID) { return 'albums/'+albumID; }

function assetPaths(albumID, assetID) {
	var pre = 'albums/' + albumID;
	var file = assetID + '.jpg';     //TODO: Support other filetypes
	return { thumb : pre + '/thumb/' + file,
	         full : pre + '/full/' + file };
}

function assetURL(remotePath) {
	return SERVER_NAME + '/' + BUCKET_NAME + '/' + remotePath;
}

function makeAsset(assetID, thumb, full) {
	return { 'assetID' : assetID, 'thumbURL' : thumb, 'fullURL' : full};
}

function getExt(filename) {
	return "jpg";     //TODO: Support other filetypes
	// var a = filename.split('.');
	// if (a.length === 1 || (a[0] === '' && a.length === 2))
	//   return '';
	// return a.pop().toLowerCase();
}

module.exports = function(app, s3) {

	// USER ======================================================================

	// Get user object with userID
	app.get(apiPath('/user/:userID'), function (req, res) {
		User.findById(req.params.userID, function (err, user) {
			if (err) throw err;
			return res.json(user);
	  });
	});

	// ALBUM =====================================================================

	// Get album object with albumID
	app.get(apiPath('/album/:albumID'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) throw err;

			album.assets.forEach(function (asset) {
				var remotePaths = assetPaths(albumID, asset.assetID);
				var urls = synchGetSignedURLs(remotePaths);
				asset.thumbURL = urls.thumb;
				asset.fullURL = urls.full;
			});

			return res.json(album);
	  });
	});

	// Get album cover URL with albumID
	app.get(apiPath('/album/:albumID/cover'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) throw err;

			var coverIdx = album.coverAsset;
			var coverAsset = album.assets[coverIdx];

			// If album is empty, send null. Let client handle it
			if (!coverAsset) {
				return res.json(null);
			}

			if (coverAsset.thumbURL) {
				return res.json(coverAsset.thumbURL);
			}
			else {
				var remotePaths = assetPaths(albumID, coverAsset.assetID);
				getSignedURL(remotePaths.thumb, function (thumbURL) {
					return res.json(thumbURL);
				});
			}
		});
	});

	// Create a new album
	app.post(apiPath('/album/new'), function (req, res) {
		var currentUser = req.user;
		var title = req.body.title;
		var collabs = req.body.collabs ? req.body.collabs : [];

		// Validate fields
		if (title.length == 0) return res.send(400);
		collabs.forEach(function (userID) {
			if (!currentUser.friends.contains(userID)) return res.send(400);
		});

		// Add current user to collabs
		collabs.unshift(currentUser._id);

		// Create database entry so we have the new albumID
		var newAlbum = new Album();
		newAlbum.users = collabs;
		newAlbum.assets = [];
		newAlbum.coverAsset = 0;    // Default to the first asset (if exists)
		newAlbum.title = title;

		newAlbum.save(function(err, album) {
			if (err) throw err;

			async.each(collabs, function (userID, callback) {
				// Update user's album list with new albumID
				User.findById(userID, function (err, user) {
					if (err) throw err;

					user.albums.push(album._id);   // Add to the back

			    user.save(function (err, user) {
			    	if (err) throw err;
			    	callback();  // Means this async call is done.
			    });
			  });
			}, function (err) {
				if (err) throw err;
				return res.send(200);  // All iterators are done, send "OK"!
			});
		});
	});

	// Upload photo
	app.post(apiPath('/album/:albumID/upload'), function (req, res) {
		// Prepare file upload
		var fileName = req.files.newImage.name;
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;
		var fileType = getExt(fileName);

		// Validate fields
		// Protect against empty form submission.
		if (!fileName) return res.send(400);

		// Create database entry so we have the assetID
		var newAsset = new Asset();
		newAsset.fileType = fileType;
		newAsset.owner = req.user._id;

  	// Find album we're uploading to
		Album.findById(albumID, function (err, album) {
			if (err) throw err;

			if (!album.collabs.contains(req.user._id)) {
				console.log(typeof(album.collabs[0]), typeof(req.user._id));
				return res.send(400);
			}

			newAsset.save(function (err, asset) {
			  if (err) throw err;

  			// Append to the album's list of assets
  			var assetID = asset._id;
  			album.assets.push(makeAsset(assetID, null, null));

  	    album.save(function (err, album) {
  	    	if (err) throw err;

  	      console.log("Asset added to album in db!", album);

  	      // Prepare upload
				  var remotePaths = assetPaths(albumID, assetID);
				  // console.log("Preparing to upload image...");
				  // console.log("Album ID:", albumID);
				  // console.log("Local path:", localPath);
				  // console.log("Remote path:", remotePaths.thumb, remotePaths.full);

					var params = {
		  	    Bucket: BUCKET_NAME,
		  	    ContentType: 'image/jpeg',
		  	  };

		  	  // Resize image into thumbnail, save locally
					var tmpLocalPath = localPath+'thumb';
					im.resize({ srcPath: localPath, dstPath: tmpLocalPath, width: 200 },
						function (err) {
						  if (err) throw err;

						  console.log('Resized image to width of 200px!');

						  // Read in local thumbnail image
						  fs.readFile(tmpLocalPath, function (err, data) {
								if (err) throw err;

								// Send thumbnail to S3
								params.Body = data;
								params.Key = remotePaths.thumb;
					  	  s3.client.putObject(params, function (err, ETag) {
					  	  	if (err) throw err;

				  	    	console.log('Successfully uploaded thumbnail!');

			    	      // IMPORTANT: Respond "OK" before uploading full image.
			    	      // Potential race condition here, but it's much faster this way
			    	      // TODO: If the lightbox GET fails, just try again after a few seconds.
			    	      res.send(200);

			    	      // In the background, upload full image to S3, don't respond.
			    	      fs.readFile(localPath, function (err, data) {
					  				if (err) throw err;

					  				params.Body = data;
					  				params.Key = remotePaths.full;
							  	  s3.client.putObject(params, function (err, ETag) {
							  	  	if (err) throw err;

						  	    	console.log('Successfully uploaded full image!');
					  	 			});
					  			});
			    	    });
		    	  	});
	  	 			});
			  	});
  			});
		});
	});

	// // Get photo
	// app.get(apiPath('/album/:albumID/:assetID'), function (req, res) {
	// 	var albumID = req.params.albumID;
	// 	var assetID = req.params.assetID;

	// 	// Get signed URLs from S3
	// 	var remotePaths = assetPaths(albumID, assetID);
	// 	getSignedURLs(remotePaths, function (urls) {
 //  		console.log("Image URLs are:", urls);
 //  	  return res.json(urls);
	// 	});
	// });

	// HELPERS ===================================================================

	// TODO: Optimize by not calling .getSignedUrl every time.
	function getSignedURL(remotePath, success) {
		var params = { Bucket: BUCKET_NAME, Key: remotePath };
		s3.getSignedUrl('getObject', params, function (err, signedURL) {
			if (err) throw err;
			success(signedURL);
		});
	}

	function synchGetSignedURL(remotePath) {
		var params = { Bucket: BUCKET_NAME, Key: remotePath };
		return s3.getSignedUrl('getObject', params);
	}

	function getSignedURLs(remotePaths, success) {
		getSignedURL(remotePaths.thumb, function (thumbURL) {
		  getSignedURL(remotePaths.full, function (fullURL) {
	  	  success({ thumb : thumbURL, full : fullURL });
	  	});
		});
	}

	function synchGetSignedURLs(remotePaths) {
		var thumbURL = synchGetSignedURL(remotePaths.thumb);
		var fullURL = synchGetSignedURL(remotePaths.full);
		return { thumb : thumbURL, full : fullURL };
	}

	Array.prototype.contains = function(obj) {
    return this.indexOf(obj) != -1;
	}
};
