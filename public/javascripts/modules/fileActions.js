/**
 * How to use:
 * 		module = new Module(id, model);
 */

define(
// dependencies
["jquery", "clientUtils", "jqueryCookie"], 
function (jquery, utils) {
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
				$el.on("click", "a", function(ev){ 
					ev.stopPropagation();
					if (this.parentNode.className == "actove") return; // it is already active

		    		$el.find("li").removeClass("active");
		    		this.parentNode.className = "active";

		    		// filename
		    		if (this.name == "filename"){
		    			$el.trigger("filename", currentModel);
		    		} else if (this.name == "patch"){
		    			$el.trigger("patch", currentModel);
					} else if (this.name == "history"){
						$el.trigger("history", currentModel);
					} 

					return false;
		    	});

		    	// Share button
			    $('#shareFileModal').on("shown", function(){
					utils.selectText("shareLinkContainer");
			    });
			    $('#FileInfoModal').on("shown", function(){					
					that.fileInfoUpdatePath();
					//$("#fileinfo-displaypath").select();
			    });
			    $("#fileinfo-basepath").keyup(that.fileInfoUpdatePath);
			    $("#fileinfo-basepath").keydown(that.fileInfoUpdatePath);
			    $("#fileinfo-basepath").keypress(that.fileInfoUpdatePath);
			    
			    $("#editor-top-buttons").on("click", "button", function(ev){ 
			    	if (this.name == "share-file"){
			    		that.shareFile();
			    	} else if (this.name == "file-info"){
						that.fileInfo();
					}
			    });
			},
	
			clear: function(){
				// clear
				$el.css("visibility", "hidden");
				$el.find("li").removeClass("active");
				$el.find("li").css("visibility", "hidden");
			},

			update: function(model){
				currentModel = model;
				that.clear();
				$el.css("visibility", "visible");

				// tab filename
				var tabFilenameEl = $el.find("#tab-filename");
				tabFilenameEl.html(model.get("basename"));
				tabFilenameEl.attr("title", model.get("displaypath"));	
				
				tabFilenameEl.parent().addClass("active");
				$("#editor-top-buttons").css("visibility", "visible");

				// active file in the list
				if(model.get("type") == "search"){
					tabFilenameEl.parent().css("visibility", "visible");
				} else {
					$el.find("li").css("visibility", "visible");
				}
			},

			shareFile: function(){
				var linkEl = document.getElementById("shareLinkContainer");
	    		var currentLine = 0;
    			if ( $("#tab-filename").parent().hasClass("active") ){
    				currentLine = currentModel.get("currentLine");
    				if (currentLine == null){
    					currentLine = 0;
    				}
    			}
    		
	    		linkEl.innerHTML = "http://" + window._host + "/file/"+currentModel.get("_id") + "/view?l=" + currentLine;
	    		$('#shareFileModal').modal('show');
			},

			fileInfoUpdatePath: function(){
				if (!currentModel || !currentModel.get("displaypath")) return;			    	
		    	var basepath = $("#fileinfo-basepath").val();
		    	$.cookie('localfolder', basepath);

		    	var repo = currentModel.get("_repository");
		    	
		    	var displaypath = basepath + "/" + currentModel.get("displaypath");
		    	$("#fileinfo-reponame").html(repo.name); 
		    	$("#fileinfo-displaypath").html(displaypath.replace(/\//g, "\\")); 
		    	$("#fileinfo-name").html(currentModel.get("basename")); 
		    	//$("#fileinfo-basename").val(currentModel.get("basename")); 
			},

			fileInfo: function(){
				// set default path before show
				var basepath = $.cookie('localfolder');
				if (basepath)
					$("#fileinfo-basepath").val(basepath);
				$('#FileInfoModal').modal('show');
			}
		};

		that.init();
		that.initEvents();

		return that;
	} // Constructor

}); // define 