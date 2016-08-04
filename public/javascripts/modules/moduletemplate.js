/**
 * How to use:
 * 		module = new Module(id);
 */

define(
// dependencies
["lib/jquery", "/javascripts/client-utils.js"], 
function (jquery, utils) {
	/**  
 	 * Constructor
 	 * @param id The element id
	 */
	return function(id){
		var $el = $("#" + id),
		el = document.getElementById(id);

		var that = {
			$el:$el,
			el:el,

			init: function(){

			},

			initEvents: function(){

			},

			update: function(model){

			}
		};

		that.init();
		that.initEvents();

		return that;
	} // Constructor

}); // define 