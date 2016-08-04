var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

var repositorySchema = new Schema({    
	 // Given name, E.g: codebrowser
	 name: {type:String, index:{unique:true}}
	 // Git folder path, this is the base for git commands. 
	 // E.g. "/opt/git/codebrowser"
    ,path: {type:String} 
     // List of folders to read. e.g. ["models", "routes", "views"]
     // One empty string will scan all folders. e.g: [""]
    ,scanfolders:[]

    // Remote branch, e.g.: github
    ,remoteBranch:String

    ,lastUpdated:Date
});

module.exports = mongoose.model('Repository', repositorySchema);