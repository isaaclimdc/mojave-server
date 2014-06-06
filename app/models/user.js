var mongoose = require('mongoose');

// User model
var UserSchema = mongoose.Schema({
  userID : Number,            // Facebook ID
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
