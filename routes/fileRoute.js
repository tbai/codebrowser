var path = require('path');
var exec = require('child_process').exec;
var db = require("../models/db");
var config = require("../config");




exports.history = function (req, res) {

  result = { text: "" };

  if (req.param("id")) {
    var id = req.param("id");
    db.File.findOne({ _id: id }).populate("_repository").exec(function (error, file) {
      if (error) {
        res.json(error);
        return;
      }

      console.info("History(" + (req.user && req.user.email ? req.user.email : "unknown user") + "):" + file.basename);

      if (file.history) {
        result.text = file.history;
        res.json(result);
      } else {
        var repo = file._repository;
        console.log("exec: cd " + repo.path + " && git log -n 10 -p " + file.fullpath);

        exec("cd " + repo.path + " && git log -n 10 -p " + file.fullpath, (error, stdout, stderr) => {
          if (error) {
            console.log(error);
          }
          var logresult = stdout;

          if (!isGitLogComplete(logresult)) {
            logresult += "\n" +
              "@@ HISTORY IS NOT COMPLETE, DOUBLE CLICK HERE TO LOAD FULL HISTORY... @@" +
              "\n";
          }
          file.history = logresult;
          file.save();
          result.text = logresult;
          res.json(result);
        });
      }
    });
  }

}



/**
 * Check to see if current log result is complete
 */
function isGitLogComplete(text) {
  // if the log is complete, the first commit will be from "--- /dev/null"
  var lines = text.split("\n");
  for (var i = lines.length - 1; i >= 0; i--) {
    if (lines[i].indexOf("diff --git") == 0) {
      return false;
    } else if (lines[i].indexOf("--- /dev/null") == 0) {
      return true;
    }
  }
  return false;
}



exports.completehistory = function (req, res) {
  result = { text: "" };

  if (req.param("id")) {
    var id = req.param("id");
    db.File.findOne({ _id: id }).populate("_repository").exec(function (error, file) {
      if (error) {
        res.json(error);
        return;
      }

      var repo = file._repository;
      exec("cd " + repo.path + " && git log -p " + file.fullpath, (error, stdout, stderr) => {
        file.history = stdout;
        file.save();
        result.text = stdout;
        res.json(result);
      });
    });
  }
}



exports.get = function (req, res) {

  try {
    if (req.param("id")) {
      var id = req.param("id");
      db.File.findOne({ _id: id }).populate("_repository").exec(function (error, file) {
        console.info("Get file(" + (req.user && req.user.email ? req.user.email : "unknown user") + "):" + file.basename);
        res.json({ error: error, file: file });
      });

    } else if (req.param("displaypath")) {
      var displaypath = req.param("displaypath");
      db.File.findOne({ displaypath: displaypath }).populate("_repository").exec(function (error, file) {
        console.info("Get file(" + (req.user && req.user.email ? req.user.email : "unknown user") + "):" + file.basename);
        res.json({ error: error, file: file });
      });
    }
  } catch (error) {
    res.json({ error: error });
  }

};
