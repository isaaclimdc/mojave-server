// =============================================================================
// ALBUM MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AlbumSchema = mongoose.Schema({
  users : [mongoose.Schema.Types.ObjectId],        // Array of fbID
  assets : [{
    assetID : mongoose.Schema.Types.ObjectId,
    thumbURL : String,
    fullURL : String
  }],
  coverAsset : mongoose.Schema.Types.ObjectId,     // assetID
  title : String                                   // Album title
});

module.exports = mongoose.model('Album', AlbumSchema);
