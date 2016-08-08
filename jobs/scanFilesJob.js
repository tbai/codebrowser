/*
para rodar:
node --max-old-space-size=1000 jobs/scanFilesJob.js
*/
var config = require("../config")
	,mongoose = require('mongoose')
	,repositoryService = require("../lib/repositoryService")
	,db = require("../models/db");

// connect to Mongo when the app initializes
mongoose.connect(config.MONGODB_CONNECTION_STR);

var interval = 60 * 1000; // every minute
var isUpdating = false;

function scanFilesJob(){
	console.log("Scan files job - check");
	if(isUpdating){
		return;
	}

	db.Repository.findOne({}, function(error, firstRepo){
		var lastUpdated = firstRepo.lastUpdated;
		var now = new Date();

    isUpdating = true;
    console.log("Updating git repositories...");
    repositoryService.gitPullAll(function(gitError){
      if(error){
        console.error(error);
        process.exit(1); // exit with error
      } else {
        console.log("Scanning folders...");
        repositoryService.scanAll().then(
          success => {
            console.log("DB updated at " + new Date());
            isUpdating = false;
          },
          scanError => {
            console.error(scanError);
            process.exit(1); // exit with error
          }
        );

      }
    });


	});

}
scanFilesJob();
setInterval(scanFilesJob, interval);

