var  http = require("http")
    ,db = require("../models/db")
	 ,$ = require("jquery")
    ,util = require("util")
    ,repositoryService = require("../lib/repositoryService");



exports.filename = function(req, res){
   var query = req.param("q");
   var repoid = req.param("repoid") ? req.param("repoid") : repositoryService.getCurrentRepositoryId(req);   
   var regex = new RegExp(query.replace(/\./g,'\\.').replace(/\*/g,'.+'), "i");

   console.info("Quickopen query("+(req.user && req.user.email ? req.user.email : "unknown user")+"):" + query+ " repo:" + repoid);
   db.File.find({basename:regex, _repository:repoid}, {displaypath:1}, (error, list) => {
      var result = {error:error};
      result.total = list.total;
      result.list = [];

      var item, i;
      for( i=0; i< list.length; i++){
         item = list[i];
         result.list.push({
            _id: item._id,
            displaypath: item.displaypath,
         });
      }

      res.json(result);
   });
}

exports.text = function(req, res){
   var query = req.param("query");
   var repoid = repositoryService.getCurrentRepositoryId(req);
   util.debug("search text("+(req.user && req.user.email ? req.user.email : "unknown user")+"):" +query+
      " repoid=" + repoid +
      " inPath=" +req.param("inPath") + 
      " regExp=" +req.param("regExp") + 
      " caseSensitive=" + req.param("caseSensitive") + 
      " wholeWord=" + req.param("wholeWord") +
      " inFiles=" + req.param("inFiles")
   );

   var findQuery = query, regexOptions = "";
   if (req.param("regExp") != "true"){
      findQuery = query.replace(/\./g,'\\.');
   }
   if (req.param("caseSensitive") != "true"){
      regexOptions="i";
   }
   if (req.param("wholeWord") == "true"){
      findQuery= "\b" + findQuery;
   }

   var regex = new RegExp(findQuery, regexOptions);
   var queryMap = {text:regex, _repository:repoid};
   if (req.param("inPath")){
      queryMap.displaypath = new RegExp(req.param("inPath"),"i");
   }  

   // in files
   if (req.param("inFiles")){
      var inFilesList = req.param("inFiles").split(",");
      if (inFilesList.length > 0){
         queryMap._id = {$in:inFilesList};
      }
   }
   db.File.find(queryMap,{_id:1, displaypath:1, text:1}, (error, list) => {
      if (error){
         res.json(403, {error:error});
         return;
      }

      var filesIds = [];
      
      var headerText = 'Searching for: "'+query+'"\n', nMatches = 0;
      if(list.length == 0){
         headerText += '\nNo results found!';
      }

      var text = "";
      var lines, file, entry, printedlist = [];
      for (var i=0; i<list.length; i++){
         file = list[i];
         filesIds.push(file._id);
         text += "" + file.displaypath + ":\n...\n";
         lines = file.text.split("\n");
         // find the correct line
         printedlist = [];
         for (var j=0; j<lines.length; j++){
            if (regex.test(lines[j])){

               nMatches++;
               printline(lines, j);
            }
         }
         text += "...\n";
      }

      if (nMatches > 0){         
         //...320 matches across 12 files...
         headerText += "..." + nMatches + " matches across "+list.length+" files. "
         headerText += 'Double-click to open file.\n\n';
      }

      function printline(array, index){
         // print 5 lines
         var first = index -2 >=0 ? index-2 : 0;
         var last = index +2 < array.length ? index+2 : array.length-1;

         // print block separator "..."
         if (printedlist.length >0 && printedlist[printedlist.length-1] < first){
            text += "...\n";
         }

         for (var z=first; z<=last; z++){
            if (printedlist.indexOf(z) == -1){ // not in the list already
               text += "" + z + ": " + array[z]; + " \n";
               printedlist.push(z);
            }
         }
      }
      res.json({text:headerText + text,inFiles:filesIds});
   });
}

