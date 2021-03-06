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
			if (err) return sendIntErr('User not found.', err, res);
			return res.json(user);
	  });
	});

	// ALBUM =====================================================================

	// Get album object with albumID
	app.get(apiPath('/album/:albumID'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) return sendIntErr('Album not found', err, res);

			async.each(album.assets, function (asset, callback) {
				var remotePaths = assetPaths(albumID, asset.assetID);
				getSignedURLs(remotePaths, function (urls) {
					asset.thumbURL = urls.thumb;
					asset.fullURL = urls.full;
					callback();  // Means this async call is done.
				});
			}, function (err) {
				if (err) return sendIntErr('Could not update album assets', err, res);
				return res.json(album);  // All iterators are done, send back album!
			});
	  });
	});

	// Get album cover URL with albumID
	app.get(apiPath('/album/:albumID/cover'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) return sendIntErr('Album not found', err, res);

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
		if (title.length == 0)
			return sendBadReq('Title cannot be empty', res);
		collabs.forEach(function (userID) {
			if (!currentUser.friends.contains(userID))
				return sendBadReq('You must be friends with the colloborators', res);
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
			if (err) return sendIntErr('Could not save album', err, res);

			async.each(collabs, function (userID, callback) {
				// Update user's album list with new albumID
				User.findById(userID, function (err, user) {
					if (err) return sendIntErr('User not found', err, res);

					user.albums.push(album._id);   // Add to the back

			    user.save(function (err, user) {
			    	if (err) return sendIntErr('Could not save user', err, res);
			    	callback();  // Means this async call is done.
			    });
			  });
			}, function (err) {
				if (err) return sendIntErr('Could not update collabs', err, res);
				return res.send(200);  // All iterators are done, send "OK"!
			});
		});
	});

	// Upload photo
	app.post(apiPath('/album/:albumID/upload'), function (req, res, next) {
		// Prepare file upload
		var fileName = req.files.newImage.name;
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;
		var fileType = getExt(fileName);

		// Validate fields
		// Protect against empty form submission.
		if (!fileName) return sendBadReq('No image selected for upload', res);

		// Create database entry so we have the assetID
		var newAsset = new Asset();
		newAsset.fileType = fileType;
		newAsset.owner = req.user._id;

  	// Find album we're uploading to
		Album.findById(albumID, function (err, album) {
			if (err) return sendIntErr('Album not found', err, res);

			if (!album.collabs.contains(req.user._id))
				return sendBadReq('You must be a colloborator to upload photos', res);

			newAsset.save(function (err, asset) {
			  if (err) return sendIntErr('Could not save asset', err, res);

  			// Append to the album's list of assets
  			var assetID = asset._id;
  			album.assets.push(makeAsset(assetID, null, null));

  	    album.save(function (err, album) {
  	    	if (err) return sendIntErr('Could not save album', err, res);

  	      // Prepare upload
				  var remotePaths = assetPaths(albumID, assetID);

					var params = {
		  	    Bucket: BUCKET_NAME,
		  	    ContentType: 'image/jpeg',
		  	  };

		  	  // Upload thumbnail and full image to S3 __in parallel__
		  	  async.parallel([
		  	  	// THUMBNAIL
		  	  	function (callback) {
	  		  	  // Resize image into thumbnail, save locally
	  					var tmpLocalPath = localPath+'thumb';
	  					im.resize({ srcPath: localPath, dstPath: tmpLocalPath, width: 200 },
	  						function (err) {
	  						  if (err) return sendIntErr('Could not create image thumbnail', err, res);

	  						  console.log('Resized image to width of 200px!');

	  						  // Read in local thumbnail image
	  						  fs.readFile(tmpLocalPath, function (err, data) {
	  								if (err) return sendIntErr('Could not read file', err, res);

	  								// Send thumbnail to S3
	  								params.Body = data;
	  								params.Key = remotePaths.thumb;
	  					  	  s3.client.putObject(params, function (err, ETag) {
	  					  	  	if (err) return sendIntErr('Could not upload thumbnail', err, res);

	  				  	    	console.log('Successfully uploaded thumbnail!');
	  				  	    	callback();
  				    	    });
  			    	  	});
  		  	 			});
		  	  	},
		  	  	// FULL IMAGE
		  	  	function (callback) {
	    	      // In the background, upload full image to S3, don't respond.
	    	      fs.readFile(localPath, function (err, data) {
			  				if (err) return sendIntErr('Could not read file', err, res);

			  				params.Body = data;
			  				params.Key = remotePaths.full;
					  	  s3.client.putObject(params, function (err, ETag) {
					  	  	if (err) return sendIntErr('Could not upload image', err, res);

				  	    	console.log('Successfully uploaded full image!');
				  	    	callback();
			  	 			});
			  			});
		  	  	}
		  	  ],
		  	  // BOTH DONE!
		  	  function (err, results) {
    	      console.log('Uploaded both thumbnail and full image!');
    	      return res.send(200);
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

	// Send an internal server error (500)
	function sendIntErr(responseText, err, res) {
		return res.send(400, responseText+'. '+err);
	}

	function sendBadReq(responseText, res) {
		return res.send(500, responseText);
	}

	// TODO: Optimize by not calling .getSignedUrl every time.
	function getSignedURL(remotePath, success) {
		var params = { Bucket: BUCKET_NAME, Key: remotePath };
		s3.getSignedUrl('getObject', params, function (err, signedURL) {
			if (err) throw err;
			success(signedURL);
		});
	}

	function getSignedURLs(remotePaths, success) {
		getSignedURL(remotePaths.thumb, function (thumbURL) {
		  getSignedURL(remotePaths.full, function (fullURL) {
	  	  success({ thumb : thumbURL, full : fullURL });
	  	});
		});
	}

	Array.prototype.contains = function(obj) {
    return this.indexOf(obj) != -1;
	}
};
