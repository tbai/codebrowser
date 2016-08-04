/**
 * How to use:
 * 		module = new Module(id);
 */

 // regex to find not in path: /^(?:(?!do not find this).)+$/

define(
// dependencies
["jquery", "clientUtils", "modules/editableModel", "bootstrap"], 
function ($, utils, EditableModel) {
	/**  
 	 * Constructor
 	 * @param id The element id
	 */
	return function(id){
		var $el = $("#" + id),
		el = document.getElementById(id);

		var currentModel = null;

		var that = {
			$el:$el,
			el:el,

			init: function(){
				
			},

			initEvents: function(){
				// disable form submition
				//$el.find('form').keypress(function(e) {
				$el.keypress(function(e) {
				  return e.which !== 13;  
				});

				$el.on("click", "button[name=find],button[name=find-in-folder],button[name=find-all],button[name=find-in-files]", function(ev){
		    		that.execFind(this.name);
		    		return false;
		    	});

				// search on enter key press
				$el.on("keypress", "#text-search-input", function(ev){
					if (ev.which == 13 && that.getSearchQuery()){
						that.execFind("find");
					}
				});

				// search on enter key press
				$el.on("keypress", "#find-in-path-field", function(ev){
					if (ev.which == 13 && that.getSearchQuery() && that.getWhereQuery()){
						that.execFind("find-in-folder");
					}
				});

				// update find in path button text
				$el.on("keypress keyup keydown", "#find-in-path-field", function(ev){
					var buttonlabel = that.getWhereQuery() ? "Find in path" : "Find everywhere";
					$("#find-in-path-button").html(buttonlabel);
				});
			},

			update: function(model){
				currentModel = model;

				if (!model || model.get("type") == "file"){
					// default
					$el.find("button[name=find-in-files]").css("display", "none");
				} else if (model.get("type") == "search" && model.get("inFiles").length){
					$el.find("button[name=find-in-files]").css("display", "inline-block");
				} 

				that.resize();
			},

			getSearchQuery: function(){
				return $.trim($el.find("#text-search-input").val());
			},

			getWhereQuery: function(){
				return $.trim($("#find-in-path-field").val());
			},

			/**
 			 * @param mode find | find-all | find-in-folder
 			 */
			execFind: function(mode){
				var searchQuery = that.getSearchQuery();
	    		if (!searchQuery) {
	    			alert("Search for what? \nType something in the text field!!")
	    			return false;
	    		}

	    		var searchOptions = {
	    			  wrap:true
	    			, caseSensitive : $el.find("button[name=case-sensitive]").hasClass("active")
	    			, regExp : $el.find("button[name=regex]").hasClass("active")
	    			, wholeWord : $el.find("button[name=whole-word]").hasClass("active")
	    		};

	    		// search in file
	    		if (mode == "find"){
	    			$el.trigger("find", searchQuery, searchOptions);
	    	    // find all
	    		} else if (mode == "find-all"){
	    			$el.trigger("findAll", searchQuery, searchOptions);
				// find in folder
	    		} else if (mode == "find-in-folder"){
	    			var inPath = that.getWhereQuery();
	    			that.findInFilesOrFolder(searchQuery, searchOptions, null, inPath);
	    		} else if (mode == "find-in-files"){
	    			var filesIds = currentModel.get("inFiles");
	    			that.findInFilesOrFolder(searchQuery, searchOptions, filesIds);
	    		}
			},

			resize: function(){
				var southWidth = $el.parent().innerWidth();
		    	var bottomUsedSpace = 0;
		    	// calculate the space used by visible buttons
		    	$el.find("span.variable-width").each(function(){
		    		bottomUsedSpace += $(this).outerWidth();
		    	});

		    	// Update input width according with the available space
		    	$el.find("#text-search-input").css("width", (southWidth - bottomUsedSpace -30) + "px");
			},

			// Find in folder 
		    findInFilesOrFolder: function(query, searchOptions, inFiles, inPath){
		    	if(window._fileRequest){window._fileRequest.abort();};

		    	$el.trigger("beforeFindInFolder", {searchQuery:query});
		    	var data = {
					query:query,
					regExp: searchOptions.regExp,
					caseSensitive: searchOptions.caseSensitive,
					wholeWord: searchOptions.wholeWord
				};

		    	if (inFiles){
		    		data.inFiles = inFiles.join(",");
		    	}

		    	if (inPath){
		    		data.inPath = inPath;
		    	}

		    	window._fileRequest = $.ajax({
					url: "/search/text",
					dataType: "json",
					method:"GET",
					data:data,
					success:function(data){
						var fileAttributes = {
							_id: "searchresult-"+parseInt(Math.random()*10000),
							text:data.text,
							inFiles:data.inFiles,
							basename:"Find: " + query,
							displaypath:"Find: " + query,
							extension:".make",
							type:"search"
						}

						var model = new EditableModel();
						model.set(fileAttributes);
						$el.trigger("findInFolder", {model:model, searchQuery:query, searchOptions:searchOptions});
					},
					error:function(){}
				});
		    }
		};

		that.init();
		that.initEvents();
		that.update();

		return that;
	} // Constructor

}); // define 