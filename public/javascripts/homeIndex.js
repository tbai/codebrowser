// Start the main app logic.

/*

	TODO:
	- On paste in quick open field
	- control+f in selected text
	- create search file object before
	- save history in db - delete object when reindex
	- Search in folder using options
*/
var asciiartNumber = parseInt(Math.random() * 10) % 6 + 1;
var helpText = '\n' +
  '\n' +
  '<-- Use the left panel to open files from the repositories' +
  '\n';

requirejs([
  'jquery'
  , "clientUtils"
  , "modules/editableModel"
  , "modules/fileList"
  , "modules/fileActions"
  , "modules/searchBar"
  , "modules/editor"
  , 'jqueryLayout'
  , "diffMatchPatch"
  , "jqueryUi"
  , "bootstrap"
], function ($, ClientUtils, EditableModel, FileList, FileActions, SearchBar, Editor) {

  $(document).ready(function () {
    // Default ajax error handler - redirect to login page case we have an ajax error
    $(document).ajaxError(function (e, jqXHR, ajaxSettings, thrownError) {
      if (ajaxSettings.dataType == "json") {
        var contentType = jqXHR.getResponseHeader("Content-Type")
        if (contentType && contentType.indexOf("text/html") != -1) {
          window.location = "/logout";
        }
      }
    });

    // create the jquery layout panels
    var layout = $('body').layout({
      applyDemoStyles: false,

      north: {
        resizable: false
        , closable: false
      },
      south: {
        size: 34
        , resizable: false
        , closable: false
      },
      center__childOptions: {
        north: {
          resizable: false
          , closable: false
        }
      },
      west: {
        size: 300
        , showOverflowOnHover: false
      }
    });

    var fileList = new FileList("file-list-module");
    var editor = new Editor("ace-editor");
    var fileActions = new FileActions("editor-top-buttons");
    var searchBar = new SearchBar("search-bar");

    function initEvents() {
      fileList.$el.on("select", function (ev, fileModel) {
        editor.update(fileModel);
        fileActions.update(fileModel);
        searchBar.update(fileModel);
      });

      fileList.$el.on("empty", function (ev, fileModel) {
        editor.clear();
        fileActions.clear();
      });

      // fix jquery layout issues with popups
      fileList.$el.on("show-typeahead", function () {
        //layout.allowOverflow($("#quickopenform ul.typeahead")[0])
        layout.allowOverflow("west")
      });
      fileList.$el.on("hide-typeahead", function () {
        layout.resetOverflow("west")
      });

      fileActions.$el.on("filename", function (ev, fileModel) {
        editor.showFile();
      });

      fileActions.$el.on("patch", function (ev, fileModel) {
        editor.showPatch();
      });

      fileActions.$el.on("history", function (ev, fileModel) {
        editor.showHistory();
      });

      searchBar.$el.on("find", function (ev, searchQuery, searchOptions) {
        editor.find(searchQuery, searchOptions);
      });

      searchBar.$el.on("findAll", function (ev, searchQuery, searchOptions) {
        editor.findAll(searchQuery, searchOptions);
      });

      searchBar.$el.on("beforeFindInFolder", function (ev, o) {
        fileActions.clear();
        editor.setMessage('Searching for: "' + o.searchQuery + '"', "ace/mode/makefile");
      });

      searchBar.$el.on("findInFolder", function (ev, o) {
        //$el.trigger("findInFolder", {model:model, searchQuery:query, searchOptions:searchOptions});l
        fileList.addToFileList(o.model);
        fileList.select(o.model);
        editor.findAll(o.searchQuery, o.searchOptions);
      });

      editor.$el.on("search_result_click", function (ev, fileAttributes) {
        fileList.$el.one("quickOpenFile", function () {
          editor.gotoLine(0);
          setTimeout(function () {
            editor.gotoLine(fileAttributes.line + 1);
          }, 100);
        });
        fileList.quickOpenFile(fileAttributes);
      });

      $("#feedback-link").click(function () {
        $('#FeedbackModal').modal('show');
        $("#feedbacktext").val("");
        $("#feedbacktext").focus();
        return false;
      });
      $("#submitfeedbackbutton").click(function () {
        if (!$("#feedbacktext").val()) {
          return false
        }
        $.ajax({
          url: "/user/feedback",
          dataType: "json",
          method: "POST",
          data: { feedback: $("#feedbacktext").val() },
          success: function (data) {
            alert("Feedback sent!");
          },
          error: function () { }
        });
        return true;
      });
    }

    function loadFileById(fileid, line) {
      var model = new EditableModel();
      model.$el.one("fetch", function (ev, attributes) {
        fileList.addToFileList(model);
        fileList.select(model);
        editor.gotoLine(line);
      });
      model.set({ _id: fileid });
      model.fetch();
    }

    function init() {
      $(window).resize(resize);
      resize();

      setTimeout(function () {
        $(document.body).addClass("rendered");
      }, 1000);

      // Open file id received from url
      if (window.showFileId) {
        var gotoLine = 0;
        if ($.isNumeric(window._gotoLineNumber))
          gotoLine = window._gotoLineNumber;
        loadFileById(showFileId, gotoLine);
      }
    }


    function resize() {
      try {
        searchBar.resize();
        setTimeout(function () {
          editor.resize();
        }, 500);
      } catch (e) { }
    }

    initEvents();
    init();


  }); // document.ready
}); // requirejs



/*

editSession.setAnnotations([{
row: 10,
column: 0,
text: "Strange error",
type: "info"
}]);

editor.getSelectionRange()


editSession.setBreakpoint(5, "breakpoint");

*/

