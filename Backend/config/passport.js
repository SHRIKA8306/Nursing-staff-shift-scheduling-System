const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../model/user');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5000/api/auth/google/callback';

if (clientID && clientID !== 'YOUR_GOOGLE_CLIENT_ID' && clientSecret && clientSecret !== 'YOUR_GOOGLE_CLIENT_SECRET') {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : '';
          const profilePic = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
          
          let user = await User.findOne({ googleId: profile.id, role: 'nurse' });
          
          if (!user && email) {
            user = await User.findOne({ email, role: 'nurse' });
            if (user) {
              user.googleId = profile.id;
              if (profilePic && !user.profilePic) user.profilePic = profilePic;
              await user.save();
            }
          }

          if (!user) {
            // Do NOT allow unregistered nurse to log in or create auto account
            return done(null, false, { message: 'Your account is not registered. Please contact the administrator.' });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log('ℹ️ Google OAuth Client Credentials configuration active.');
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;