// =============================================================================
// ALBUM MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AlbumSchema = mongoose.Schema({
  collabs : [mongoose.Schema.Types.ObjectId],      // Array of userIDs
  assets : [{      // TODO: Make this and AssetSchema the same thing
    assetID : mongoose.Schema.Types.ObjectId,
    thumbURL : String,
    fullURL : String
  }],
  coverAsset : Number,                             // Index into assets array
  title : String                                   // Album title
});

module.exports = mongoose.model('Album', AlbumSchema);
