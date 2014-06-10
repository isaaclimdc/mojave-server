// =============================================================================
// ASSET MODEL =================================================================
// =============================================================================

var mongoose = require('mongoose');

var AssetSchema = mongoose.Schema({
  owner : mongoose.Schema.Types.ObjectId,     // Uploader's user ID
  fileType : String                           // File extension (.jpg, etc)
});

module.exports = mongoose.model('Asset', AssetSchema);
