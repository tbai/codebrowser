var routes = require('./routes/routes')
    ,db = require("./models/db")
    ,config = require("./config")
    ,passport = require('passport')
    ,LocalStrategy = require('passport-local').Strategy
	,ldap = require('ldapjs');



exports.setup = function(app){
    setupAuthUrls(app);
    setupAppUrls(app);
}

// Place your application urls here
function setupAppUrls(app){
    // file
    app.get('/file/get',                  isAuthenticated, routes.file.get);    
    app.get('/file/:id/history',          isAuthenticated, routes.file.history);
    app.get('/file/:id/completehistory',  isAuthenticated, routes.file.completehistory);

    // search    
    app.get('/search/filename',           isAuthenticated, routes.search.filename);
    app.get('/search/text',               isAuthenticated, routes.search.text);
    app.get('/search/filename/:q',        isAuthenticated, routes.search.filename);
    app.get('/search/repo/:repoid/filename/:q', isAuthenticated, routes.search.filename);
    
    // feedback
    app.post('/user/feedback',             isAuthenticated, routes.home.feedback);

    // pages
    app.get('/file/:fileId/view',         isAuthenticated, routes.home.index);
    app.get('/help',                      routes.home.help);
    app.get('/:repository',               isAuthenticated, routes.home.index);
    app.get('/',                          isAuthenticated, routes.home.index);
    
}

// Authentication urls
function setupAuthUrls(app){
    // ----------------------------------------------
    // security / authentication
    // ----------------------------------------------
    app.get('/login', routes.auth.loginForm);
    app.get('/logout', routes.auth.logout);

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err) }
            if (!user) {
                req.flash('error', info.message);
                req.flash('email', info.email);
                return res.redirect('/login')
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                var url = req.session.requestedUrl ? req.session.requestedUrl : "/";
                req.session.requestedUrl = null;
                return res.redirect(url);
            });
        })(req, res, next);
    });
}

// setup passport for simple login
passport.use(new LocalStrategy( {
    usernameField: 'email',
    passwordField: 'password'
}, function(username, password, done) {
    var unauthorizedMessage = 'User is not authorized. Please request authorization to ' + config.ADMIN_EMAIL;
	client = ldap.createClient({
        url: config.AUTH_LDAP_URL
	});

	client.bind(username, password, function(err){
        if (err) {
            console.error(JSON.stringify(err));
            return done(null, false, {message:'Invalid username or password.',email:username});
        }
        db.User.findOne({ email: username }, function(err, user) {
            if (!user || user.status == "blocked") {
                return done(null, false, {message:unauthorizedMessage,email:username});
            } else if (user.status == "created"){
                // update user status
                user.status = "active";
                user.save();
                // send email to admin
                reportUserActivation(user);
            }
            return done(null, user);
        });
	});
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  db.User.findById(id, function (err, user) {
    done(err, user);
  });
});

function isAuthenticated(req, res, next) {
    var activateAuth = config.ACTIVATE_AUTHENTICATION;
    if (activateAuth){
        if (req.isAuthenticated()) { return next(); }
        req.session.requestedUrl = req.url;
        res.redirect('/login');
    } else {
        return next();
    }
}


var nodemailer = require("nodemailer");
var nodeMailerTransport = nodemailer.createTransport("Sendmail", "/usr/sbin/sendmail");
function reportUserActivation(user){
    var mailOptions = {
        from: config.ADMIN_EMAIL
        ,to: config.ADMIN_EMAIL
        ,subject: config.appTitle + ' User activated ' + user.email
        ,text: 'User activated ' + user.email
    };

    nodeMailerTransport.sendMail(mailOptions, function(err, response){
        if(err){
            console.error(err);
        }else{
            console.log("Message sent: " + response.message);
        }
    });
}






