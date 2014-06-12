// =============================================================================
// USER MODEL ==================================================================
// =============================================================================

var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  fbID : Number,              // Facebook ID (!= _id)
  email : String,
  firstName : String,
  lastName : String,
  picture : String,           // URL of picture from Facebook
  fbToken : String,
  friends : [mongoose.Schema.Types.ObjectId],         // Array of userID
  albums : [mongoose.Schema.Types.ObjectId],          // Array of albumID
  currentAlbum : mongoose.Schema.Types.ObjectId,      // albumID
  appPrefs : {
    syncOnData : Boolean,
    syncOnBattery : Boolean
  }
});

module.exports = mongoose.model('User', UserSchema);
