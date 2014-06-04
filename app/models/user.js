// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

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

// generating a hash
UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);
