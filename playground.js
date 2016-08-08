var express = require('express')
  , http = require('http')
  , less = require('less-middleware')
  , path = require('path')
  , util = require("util")
  , passport = require("passport")
  , urlMappings = require("./urlMappings")
  , config = require("./config")
  , db = require("./models/db")
  , repositoryService = require("./lib/repositoryService");



//db.files.ensureIndex({basename:1})

// connect to Mongo when the app initializes

var mongoose = require('mongoose')
mongoose.connect(config.MONGODB_CONNECTION_STR)

/*

repositoryService.createRepository({
    name: "codebrowser",
    path: "/opt/repositories/codebrowser",
    scanfolders: [""],
    ignoreFolders: [
      "node_modules",
      "public/bootstrap",
      "public/javascripts/lib",
      "public/javascripts/require",
      "public/javascripts/text",
      ".vscode"
    ]
});

repositoryService.createRepository({
    name: "cooktem",
    path: "/opt/repositories/cooktem",
    scanfolders: [""],
    ignoreFolders: []
});

repositoryService.createRepository({
    name: "resume",
    path: "/opt/repositories/resume",
    scanfolders: [""],
    ignoreFolders: []
});

*/


  // repositoryService.scanAll().then(
  //     success => {
  //         console.log("success");
  //         process.exit(0);
  //     },

  //     error => {
  //         console.error(error);
  //         process.exit(1);
  //     }
  // );


// create users
/*
var authorizedusers = ["a@b.com"];
for (var i=0, user; i<authorizedusers.length; i++){
	user = new db.User({email:authorizedusers[i]});
	user.save();
}
console.log("done...");
*/

/*
db.Repository.findOne({name:"renamed-00r"}, function(err, repo){
	if(err || !repo){
		console.error(err);
		return;
	}
	console.log("Found repository: " + repo.name);
	repositoryService.scan(repo);
});
*/


/*
var repository = new db.Repository({
	name:"renamed-00r"
	,path:"/media/tbai/GIT/renamed_00r"
	,basepath:"Source/HP"
	,scanfolders:[
		"Source/HP/Mfp"
		,"Source/HP/Test"
		,"Source/HP/Common"
	]
});

repository.save(function(err){
	if(err){
		console.error(err)
		process.exit(1);
	} else {
		console.log("Success! Repository id= " + repository._id)
		process.exit(0);
	}
});*/
