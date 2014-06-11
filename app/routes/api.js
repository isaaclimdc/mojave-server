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

function apiPath(arg) { return '/api'+arg; }

function albumPath(albumID) { return 'albums/'+albumID; }

function assetPaths(albumID, assetID) {
	var pre = 'albums/' + albumID;
	var file = assetID + '.jpg';     //TODO: Support other filetypes
	return { 'thumb' : pre + '/thumb/' + file,
	         'full' : pre + '/full/' + file };
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
	app.get(apiPath('/user/:userID'), function(req, res) {
		User.findById(req.params.userID, function (err, user) {
			if (err) throw err;
			res.send(user);
	  });
	});

	// ALBUM =====================================================================

	// Get album object with albumID
	app.get(apiPath('/album/:albumID'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) throw err;

			var assetURLs = [];
			for (var i = 0; i < album.assets.length; i++) {
				var asset = album.assets[i];

				// Get remote URL
				var remotePaths = assetPaths(albumID, asset.assetID);

				var urls = synchGetSignedURLs(remotePaths);
				asset.thumbURL = urls.thumb;
				asset.fullURL = urls.full;
			}

			console.log(album.assets);
			res.send(album);
	  });
	});

	// Get album cover URL with albumID
	app.get(apiPath('/album/:albumID/cover'), function (req, res) {
		var albumID = req.params.albumID;

		Album.findById(albumID, function (err, album) {
			if (err) throw err;

			var coverAssetID = album.coverAsset;
			var resObj = { albumID : albumID };

			if (coverAssetID == undefined | coverAssetID == null) {
				resObj.coverURL = 'img/phAlbumCover.png';
				res.send(resObj);
				return;
			}

			// Get remote URL
			var remotePaths = assetPaths(albumID, coverAssetID);

			getSignedURL(remotePaths.thumb, function (thumbURL) {
				resObj.coverURL = thumbURL;
				res.send(resObj);
			});
		});
	});

	// Create a new album
	app.post(apiPath('/album/new'), function (req, res) {
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
	app.post(apiPath('/album/:albumID/upload'), function (req, res) {
		// Prepare file upload
		var fileName = req.files.newImage.name;
		var localPath = req.files.newImage.path;
		var albumID = req.params.albumID;
		var fileType = getExt(fileName);

		// Create database entry so we have the assetID
		var newAsset = new Asset();
		newAsset.fileType = fileType;
		newAsset.owner = req.user._id;

		newAsset.save(function (err, asset) {
		  if (err) throw err;

		  var assetID = asset._id;

		  var remotePaths = assetPaths(albumID, assetID);
		  console.log("Preparing to upload image...");
		  console.log("Album ID:", albumID);
		  console.log("Local path:", localPath);
		  console.log("Remote path:", remotePaths.thumb, remotePaths.full);

		  sendImageToS3(remotePaths.full, false);
		  sendImageToS3(remotePaths.thumb, true);

  		function sendImageToS3(remotePath, isThumb) {
  			var params = {
	  	    Bucket: BUCKET_NAME,
	  	    Key: remotePath,
	  	    ContentType: 'image/jpeg',
	  	  };

  			if (isThumb) {
  				var tmpLocalPath = localPath+'thumb';

					im.resize({ srcPath: localPath, dstPath: tmpLocalPath, width: 200 },
						function (err) {
						  if (err) throw err;

						  console.log('Resized image to width of 200px!');

						  fs.readFile(tmpLocalPath, function (err, data) {
								if (err) throw err;

								params.Body = data;
					  	  s3.client.putObject(params, function (err, ETag) {
					  	  	if (err) throw err;

				  	    	console.log('Successfully uploaded file!', ETag);
				  	    	res.send(200);
			  	 			});
					  	});
		  			});
  			}
  			else {
	  			fs.readFile(localPath, function (err, data) {
	  				if (err) throw err;

	  				params.Body = data;
			  	  s3.client.putObject(params, function (err, ETag) {
			  	  	if (err) throw err;

		  	    	console.log('Successfully uploaded file!', ETag);

	  	    		// Update album's list of assets
		    			Album.findById(albumID, function (err, album) {
			    			if (err) throw err;

			    			var remoteURL = assetURL(remotePath);
			    			console.log(remoteURL);

			    			var asset = makeAsset(assetID, null, null);

			    			album.assets.unshift(asset);

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
	app.get(apiPath('/album/:albumID/:assetID'), function (req, res) {
		var albumID = req.params.albumID;
		var assetID = req.params.assetID;

		// Get remote URL
		var remotePaths = assetPaths(albumID, assetID);

		// Get signed URLs from S3
		getSignedURLs(remotePaths, function (urls) {
  		console.log("Image URLs are:", urls);
  	  res.send(urls);
		});
	});

	// HELPERS ===================================================================

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
};
