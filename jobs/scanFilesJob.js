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

/*
repositoryService.scanAll(function(scanError){
	if(scanError){
		console.error(scanError);
		process.exit(1);
	} else {
		console.log("DB updated at " + new Date());
		process.exit(0);
	}
});*/


var interval = 60 * 60 * 1000; // every hour
var isUpdating = false;

function scanFilesJob(){
	console.log("Scan files job - check");
	if(isUpdating){
		return;
	}
	
	db.Repository.findOne({}, function(error, firstRepo){
		var lastUpdated = firstRepo.lastUpdated;
		var now = new Date();

		// update every day
		if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) >  86400000) { // number of milliseconds in a day
			isUpdating = true;
			console.log("Updating git repositories...");
			repositoryService.gitPullAll(function(gitError){
				if(error){
					console.error(error);
					process.exit(1); // exit with error
				} else {
					console.log("Scanning folders...");
					repositoryService.scanAll(function(scanError){
						if(scanError){
							console.error(scanError);
							process.exit(1); // exit with error
						} else {
							console.log("DB updated at " + new Date());
							isUpdating = false;
						}
					});
				}
			});
		}
	});

}
scanFilesJob();
setInterval(scanFilesJob, interval);

