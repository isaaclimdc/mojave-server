// =============================================================================
// ALBUM MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AlbumSchema = mongoose.Schema({
  users : [mongoose.Schema.Types.ObjectId],        // Array of fbID
  assets : [mongoose.Schema.Types.ObjectId],       // Array of assetID
  coverAsset : mongoose.Schema.Types.ObjectId,     // assetID or index?
  title : String                                   // Album title
});

module.exports = mongoose.model('Album', AlbumSchema);
