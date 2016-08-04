/**
 * How to use:
 * 		fileListModel = new FileListModule(id, fileModel);
 */

define( 
// dependencies
["jquery", "clientUtils", "modules/editableModel", "jqueryUi", "bootstrap"], 
function(jquery, utils, EditableModel) {
	/**  
 	 * Constructor
 	 * @param id The element id
 	 * @param model
	 */
	return function(id){

		var $el = $("#" + id),
			el = document.getElementById(id);

		var _fileList = [],
			_findFileRequest = null;
	    	_queryFileList = []; // list of files returned from quick open query

    	var COOKIE_FILE_LIST = "codebrowser_" + (window._repository ? window._repository : '0'),
    		FILE_ID_PREFIX = "quickopen-";


		var that = {
			//on:$el.on,
			$el:$el,
			el:el,

			init: function(){
				// disable form submition
				$el.find('form').keypress(function(e) {
				  return e.which !== 13  
				});

				// drag and drop
				$el.find( "#file-list" ).sortable();

				that.loadFilesFromCookie();

				// extend typeahead to trigger show and hide events
				var showFn = $.fn.typeahead.Constructor.prototype.show;
				$.fn.typeahead.Constructor.prototype.show = function() {
					that.$el.trigger("show-typeahead");
					return showFn.call(this);
				};
				var hideFn = $.fn.typeahead.Constructor.prototype.hide;
				$.fn.typeahead.Constructor.prototype.hide = function() {
					that.$el.trigger("hide-typeahead");
					return hideFn.call(this);
				};

				// filelist autocomplete			    
			    $('#quickopen').typeahead({
			    	minLength:4,
			    	items:30,
			    	source:function(query, processCallbackFn){
			    		if(_findFileRequest && _findFileRequest.abort){
							_findFileRequest.abort();
						}
						//console.log("searching for " + query);
						$("#quickopen-loadingbar").css("visibility","visible");
			    		_findFileRequest = $.ajax({
							url: "/search/repo/"+_repository+"/filename/" + query,
							dataType: "json",
							method:"GET",
							success:function(data){
								//console.log(data.list.length +  " results found for " + query);
								$("#quickopen-loadingbar").css("visibility","hidden");
								var list = [];
								for(var i=0; i< data.list.length; i++){
									list.push(data.list[i].displaypath);
								}
								_queryFileList = data.list;
								processCallbackFn(list);
							},
							error:function(){
								$("#quickopen-loadingbar").css("visibility","hidden");
							}
						});
			    	},
			    	matcher: function (item) {
			    		// the filter is done by the server
				      	return true;
				    },
				    highlighter: function(item){
				    	// Replace * to .+ in replace regex
				    	var query = this.query.replace(/[\-\[\]{}()+?.,\\\^$|#\s]/g, '\\$&').replace(/\*/g, '.+');
						return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
							return '<strong>' + match + '</strong>'
						});
				    },
			    	updater:function(displaypath){
			    		// check if the file is in the query list created in the "Open file..." autocomplete
			    		var file = _queryFileList.findBy("displaypath", displaypath);
						if(!file){
							alert("File not found: " + displaypath);
							return;
						}
						that.quickOpenFile(file);
			    	}
			    });
			},

			initEvents: function(){
				// click events on list items
				$el.on("click", "div.file-item", function(e){
					if(e.target.className == "close-file"){		
						that.removeEl(this);
					} else {
						that.selectEl(this);
					}
				});

				// save list to cookie on sort
				$el.find( "#file-list" ).on( "sortupdate", function( ev, ui ) {
					that.saveToCookie();
				});
			}, 

			/** 
			 * Select a list item based on the HTML element
			 */
			selectEl: function(listEl){
				var fileId = listEl.id.replace(FILE_ID_PREFIX, "");
				var fileObj = that.findFileModel(fileId);
				if(fileObj){
					that.select(fileObj);
				}
			},

			/** 
			 * Remove a list item providing the HTML element
			 */
			removeEl: function(listEl){
				var fileId = listEl.id.replace(FILE_ID_PREFIX, "");
				var fileObj = that.findFileModel(fileId);
				// remove the file from list 
				var removeIndex = _fileList.indexOf(fileObj);
				if(removeIndex >=0){
					_fileList.splice(removeIndex, 1);
					var isActive = $(listEl).find(".file-name").hasClass("active");

					if (_fileList.length <=0){
						$el.trigger("empty", {});
					// select next el
					} else if (isActive) {						
						if (listEl.nextSibling){
							that.selectEl(listEl.nextSibling);
						} else if (listEl.previousSibling){
							that.selectEl(listEl.previousSibling);
						}
					}
					// remove from DOM
					listEl.parentNode.removeChild(listEl);
					that.saveToCookie();
				}
			},

			quickOpenFile: function(fileAttributes){
				fileAttributes.type = "file";

				var model = new EditableModel();
				model.$el.one("fetch", function(ev, attributes){
					that.addToFileList(model);
					that.select(model);
					that.saveToCookie();
					$el.trigger("quickOpenFile",{model:model});
				});

				model.set(fileAttributes);
				model.fetch();
			},

			loadFilesFromCookie: function(){
				var cookieValue = $.cookie(COOKIE_FILE_LIST);
				if (!cookieValue) return;
				var list = cookieValue.split(",");
				for (var i=0; i<list.length; i++){
					if ( list[i] && list[i].indexOf("searchresult") == -1)
						createModelAndAddToList(list[i]);
				}

				function createModelAndAddToList(fileid, select){
					var model = new EditableModel();
					model.$el.one("fetch", function(ev, attributes){
						that.addToFileList(model);
						if (select){
							that.select(model);
						}
					});

					model.set({_id:fileid});
					model.fetch();
				}
			},

			saveToCookie: function(){
				var idlist = [];
				$el.find(".file-item").each(function(){
					var fid = this.id
					// do not save search results
					if (fid.indexOf(FILE_ID_PREFIX) >=0 && fid.indexOf("searchresult") == -1){
						idlist.push(fid.replace(FILE_ID_PREFIX, ""));
					}
				});

				$.cookie(COOKIE_FILE_LIST, idlist.join(","));
			},

			findFileModel: function(fileid){
				for (var i=0; i< _fileList.length; i++){
					if (_fileList[i].get("_id") == fileid){
						return _fileList[i];
					}
				}
				return null;
			},

			addToFileList: function(newFile){
				// check if the file is already in the list
				if(that.findFileModel(newFile.get("_id"))){
					return;
				}

				$(".file-item .file-name").removeClass("active");
				_fileList.push(newFile);

				var fileItemDiv = document.createElement("div");
				fileItemDiv.className = "file-item";
				fileItemDiv.id=FILE_ID_PREFIX+newFile.get("_id");
				var title = newFile.get("displaypath");
				var icon = '<i class="icon-file"></i> ';
				if (newFile.get("type") == "search"){
					icon = '<i class="icon-search"></i> ';
				}
				var div = document.createElement("div");
				$(div).text(newFile.get("basename"));
				var filenamehtml = $(div).html();

				fileItemDiv.innerHTML = '<a class="close-file" id="close-'+newFile.get("_id")+'">x</a>'
					+'<span class="file-name" title="'+title+'">'+icon+filenamehtml+'</span>';
		        document.getElementById("file-list").appendChild(fileItemDiv);
			},

			select: function(fileModel){
				$el.find(".file-item .file-name").removeClass("active");
				$el.find("#"+FILE_ID_PREFIX+fileModel.get("_id")+" span.file-name").addClass("active");
				$el.trigger("select", fileModel);
			}
		}

		that.init();
		that.initEvents();

		return that;
	}
});