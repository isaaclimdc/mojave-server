// =============================================================================
// ALBUM MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AlbumSchema = mongoose.Schema({
  users : [Number],        // Array of userID
  assets : [Number],       // Array of assetID
  coverAsset : Number      // assetID or index?
});

module.exports = mongoose.model('Album', AlbumSchema);
