// =============================================================================
// USER MODEL ==================================================================
// =============================================================================

var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  fbID : Number,              // Facebook ID (!= _id)
  email : String,
  fbToken : String,
  firstName : String,
  lastName : String,
  picture : String,           // URL of picture from Facebook
  friends : [Number],         // Array of userID
  albums : [Number],          // Array of albumID
  currentAlbum : Number,      // albumID
  appPrefs : {
    syncOnData : Boolean,
    syncOnBattery : Boolean
  }
});

module.exports = mongoose.model('User', UserSchema);
