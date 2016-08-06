
/**
 * Module dependencies.
 */
var express = require('express')
  , https = require('https')
  , http = require('http')
  , less = require('less-middleware')
  , path = require('path')
  , util = require("util")
  , flash = require('connect-flash')
  , passport = require("passport")
  , urlMappings = require("./urlMappings")
  , repositoryService = require("./lib/repositoryService")
  , config = require("./config")
  , fs = require('fs');

// connect to Mongo when the app initializes
var mongoose = require('mongoose')
mongoose.connect(config.MONGODB_CONNECTION_STR);

var app = express();

// all environments
app.set('port', config.SERVER_PORT);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next){
  res.locals.appTitle = config.appTitle;
  next();
});

repositoryService.configure(app);

app.use(app.router);

// Bootstrap and less
var bootstrapPath = path.join(__dirname, 'public', 'bootstrap');
app.use(less({
      src     : path.join(__dirname, 'assets', 'less')
    , paths   : [path.join(bootstrapPath, 'less')]
    , dest    : path.join(__dirname, 'public', 'stylesheets')
    , prefix  : '/stylesheets'
    , debug   : true
    , force   : true
  }));
app.use('/img', express['static'](path.join(bootstrapPath, 'img')));
app.use('/javascripts/lib', express['static'](path.join(bootstrapPath, '/docs/assets/js')));
app.use(express['static'](path.join(__dirname, 'public')));
app.use('/ace-builds', express['static'](path.join(__dirname, 'node_modules/ace-builds')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Configure Routes and authentication
urlMappings.setup(app);

// production mode using https
if (app.get('port') == 443) {
    try{
      var options = {
        key: fs.readFileSync(config.SSH_OPTIONS.key),
        cert: fs.readFileSync(config.SSH_OPTIONS.cert)
      };

      https.createServer(options, app).listen(app.get('port'));
    } catch (e){
      console.log(e);
    }

    // Creates a different app to redirect from port 80 to 443 case using https
    var redirectApp = express();
    redirectApp.set('port', 80);

    redirectApp.get("*", function(req, res, next){
      if(req.headers["x-forwarded-proto"] != "https")
        res.redirect("https://" + req.host);
      else next();
    });

    try{
      http.createServer(redirectApp).listen(redirectApp.get('port'), function(){
          console.log('Redirect server listening on port ' + redirectApp.get('port'));
      });
    } catch (e){
      console.log(e);
    }
// development mode
} else {
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Server listening on port ' + app.get('port'));
    });
}

