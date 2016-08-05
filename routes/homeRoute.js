var db = require("../models/db")
  , url = require("url")
  , config = require("../config")
  , repositoryService = require("../lib/repositoryService");




exports.index = function (req, res) {
  var port = req.app.settings.port,
    host = req.host;
  if (port != 80) {
    host += ":" + port;
  }

  // get the line number
  var lineNumber = 0;
  if (req.param("l")) {
    try {
      lineNumber = parseInt(req.param("l"));
    } catch (e) {
      lineNumber = 0;
    }
  }

  console.info("Home index - repo=" + repositoryService.getCurrentRepositoryId(req));

  // load the list of repositories
  db.Repository.find({}, { _id: 1, name: 1 }, function (err, list) {
    var repoList = [];
    if (!err && list) {
      repoList = list;
    }

    res.render('homeIndex', { host: host, lineNumber: lineNumber, fileId: req.param("fileId"), repositories: repoList, showLogout: config.ACTIVATE_AUTHENTICATION });
  });
};

/* Help page */
exports.help = function (req, res) {
  console.log("Help!!");
  res.render('homeHelp', {});
}


/* Submit feedback */
exports.feedback = function (req, res) {
  console.log("Sending feedback");
  try {
    sendFeedbackEmail(req.user, req.body.feedback);
    res.json({ status: "success" });
  } catch (e) {
    console.error(e);
    res.json({ status: "failure" });
  }
}

var nodemailer = require("nodemailer");
var nodeMailerTransport = nodemailer.createTransport("Sendmail", "/usr/sbin/sendmail");
function sendFeedbackEmail(user, text) {
  var mailOptions = {
    from: config.ADMIN_EMAIL
    , to: config.ADMIN_EMAIL
    , subject: config.appTitle + ' - Feedback from ' + user.email + ':'
    , text: 'Feedback from ' + user.email + '\n\n' + text
  };

  nodeMailerTransport.sendMail(mailOptions, function (err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log("Message sent: " + response.message);
    }
  });
}
