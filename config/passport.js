// load all the things we need
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var User = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {

	// ===========================================================================
  // SESSION SETUP =============================================================
  // ===========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // ===========================================================================
  // FACEBOOK LOGIN ============================================================
  // ===========================================================================

  passport.use(new FacebookStrategy({
    // pull in our app id and secret from our auth.js file
    clientID     : configAuth.facebookAuth.clientID,
    clientSecret : configAuth.facebookAuth.clientSecret,
    callbackURL  : configAuth.facebookAuth.callbackURL
  },

  // facebook will send back the token and profile
  function(token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their facebook id
      User.findOne({ 'fbID' : profile.id }, function(err, user) {

        // if there is an error, stop everything and return that
        // ie an error connecting to the database
        if (err) {
          return done(err);
        }

        // if the user is found, then log them in
        if (user) {
          return done(null, user); // user found, return that user
        }
        else {
          // if there is no user found with that fbid, create them
          var newUser = new User();

          // set all of the facebook information in our user model
          newUser.fbID = profile.id;
          newUser.email = profile.emails[0].value;
          newUser.fbToken = token;
          newUser.firstName = profile.name.givenName
          newUser.lastName = profile.name.familyName;
          newUser.picture = "https://graph.facebook.com/" + profile.id +
                              "/picture?type=large" + "&access_token=" + token;
          newUser.friends = [];
          newUser.albums = [];

          // save our user to the database
          newUser.save(function(err) {
            if (err) throw err;
            return done(null, newUser);
          });
        }
      });
    });
  }));
};
