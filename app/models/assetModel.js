// =============================================================================
// ASSET MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AssetSchema = mongoose.Schema({
  owner : mongoose.Schema.Types.ObjectId     // Uploader's user ID
});

module.exports = mongoose.model('Asset', AssetSchema);
