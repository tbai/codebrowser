/**
 *  How to use:
 * 		editor = new EditorModule(id, model);
 */

define(
  // dependencies
  [
    "text!/text/introduction.txt",
    "clientUtils",
    "modules/editableModel",
    "jquery",
    'ace'
  ],
  function (introductionText, utils) {
    /**
     * Constructor
     * @param id The element id
     * @param model
     */
    return function (id) {
      var $el = $("#" + id),
        el = document.getElementById(id);


      var editor = ace.edit(id);
      editor.setFontSize(16);
      editor.setTheme("ace/theme/monokai");
      editor.getSession().setMode("ace/mode/text");
      editor.setValue(introductionText);
      editor.gotoLine(0);
      var _emptyEditSession = editor.getSession();

      var currentModel = null;
      var MSG_LOADING_HISTORY = "Loading file history from git...";

      var that = {
        $el: $el,
        el: el,

        _editor: editor,
        _modes: { // map file extension to mode name used in ece editor
          ".xsd": "xml", ".xml": "xml", ".xsl": "xml", ".config": "xml",  ".cs": "csharp", ".c": "c_cpp", ".h": "c_cpp",
          ".cpp": "c_cpp", ".make": "makefile", ".js": "javascript", ".ts": "typescript", ".json": "json", ".css": "css", ".scss": "css",
           ".less": "css", ".vm": "xml", ".ejs": "ejs", ".jsp": "jsp", ".gsp": "gsp"
        },

        init: function () {
          $el.trigger("init");
        },

        initEvents: function () {
          $el.on("click", ".ace_line", function (ev) {
            //console.log("click in line");
          });
          editor.on("dblclick", function (ev, o, a) {
            var pos = editor.getCursorPosition();
            if (currentModel.get("type") == "search") {
              var filePath = that.findSearchFilePath(pos.row);
              if (filePath) {
                // find search line
                var opts = { displaypath: filePath, line: 0 };
                var line = editor.getSession().getLine(pos.row);
                if (/^\d/.test(line)) {
                  try {
                    var number = parseInt(line.match(/^\d+/)[0]);
                    opts.line = number;
                  } catch (e) { }
                }

                $el.trigger("search_result_click", opts);
              }
            } else if (currentModel.get("type") == "file" && currentModel.get("history")) {
              //    /^\@\@.+LOAD FULL HISTORY.+\@\@$/.test("
              var line = editor.getSession().getLine(pos.row);
              if (/^\@\@.+LOAD FULL HISTORY.+\@\@$/.test(line)) {
                $el.trigger("completehistory", currentModel);
                that.loadCompleteHistory();
              }
            }
          });

          editor.on("changeSelection", function (ev, ed, c) {
            if (!currentModel) return;
            try {
              var lineNumber = editor.selection.getCursor().row + 1;
              currentModel.set({ "currentLine": lineNumber });
            } catch (e) {
              console.log(e);
            }
          });
        },

        findSearchFilePath: function (currentRow) {
          if (currentRow > 0) {
            var lineText;
            for (var i = currentRow; i >= 0; i--) {
              lineText = editor.getSession().getLine(i);
              if (/\w\/.+:$/.test(lineText)) {
                var filepath = lineText.substring(0, lineText.length - 1);
                return filepath;
              }
            }
          }
          return null;
        },

        resize: function () {
          editor.resize();
        },

        clear: function () {
          editor.setSession(_emptyEditSession);
          editor.setValue("");
          editor.gotoLine(0);
        },

        getMode: function (model) {
          var mode = that._modes[model.get("extension")];
          if (!mode) {
            mode = "text";
          }
          return mode;
        },

        showFile: function () {
          if (!currentModel) return;
          var model = currentModel;
          if (!model._editSession) {
            var mode = that.getMode(model);
            var modelId = model.get("_id");
            var text = model.get("text");
            model._editSession = new ace.EditSession(text, "ace/mode/" + mode);
            // Don't know what this line does, but it stops a javascript exception from ace editor.
            model._editSession.setUseWorker(false);
          }
          editor.setSession(model._editSession);
        },

        showHistory: function () {
          if (!currentModel) return;
          if (currentModel._historySession) {
            editor.setSession(currentModel._historySession);
            return;
          }
          that.setMessage(MSG_LOADING_HISTORY);
          if (!currentModel.get("history")) {
            currentModel.fetchHistory(function () {
              setHistoryContent();
            });
          } else {
            setHistoryContent();
          }

          function setHistoryContent() {
            currentModel._historySession = new ace.EditSession(MSG_LOADING_HISTORY, "ace/mode/diff");
            editor.setSession(currentModel._historySession);
            editor.setValue(currentModel.get("history"));
            editor.gotoLine(0);
          }
        },

        /**
         * We are currently showing file history and user clicks on "LOAD FULL HISTORY" on the text.
         * This method will fetch the complete history and display, keeping the user in the same text position.
         */
        loadCompleteHistory: function () {
          if (!currentModel._historySession) return;

          var pos = editor.getCursorPosition();
          var currentRow = pos.row;
          var editDocument = currentModel._historySession.getDocument();
          editor.clearSelection();
          setTimeout(function () {
            editDocument.removeLines(currentRow, currentRow + 1);
            editDocument.insertLines(currentRow, ["@@ " + MSG_LOADING_HISTORY + " @@", ""]);
            editor.clearSelection();
          }, 100);

          currentModel.fetchCompleteHistory(function () {
            var editSession = currentModel._historySession;
            editor.setSession(editSession);
            var scrollTop = editSession.getScrollTop();
            // place the cursor in the same position as before
            editor.setValue(currentModel.get("history"));
            editor.gotoLine(currentRow);
            editSession.setScrollTop(scrollTop);
          });
        },

        diffLineMode: function (text1, text2) {
          var DMP = new diff_match_patch();
          var a = DMP.diff_linesToChars_(text1, text2);
          var lineText1 = a[0];
          var lineText2 = a[1];
          var lineArray = a[2];

          var diffs = DMP.diff_main(a.chars1, a.chars2, false);

          // Use cleaupSemantic here if you want to stay at the line level.
          DMP.diff_cleanupSemantic(diffs);

          DMP.diff_charsToLines_(diffs, a.lineArray);
          return diffs;
        },

        diff: function (text1, text2) {
          var DMP = new diff_match_patch();
          var t = that.diffLineMode(text1, text2);
          return DMP.patch_toText(DMP.patch_make(t));
        },

        showPatch: function () {
          if (!currentModel) return;

          var originalText = currentModel.get('text');
          var currentText
          try {
            currentText = currentModel._editSession.getValue();
          } catch (e) {
            currentText = editor.getValue();
          }

          var patchText = decodeURI(that.diff(originalText, currentText));

          if (!currentModel._patchSession) {
            currentModel._patchSession = new ace.EditSession(patchText, "ace/mode/diff")
          } else {
            currentModel._patchSession.setValue(patchText)
          }
          editor.setSession(currentModel._patchSession);
          editor.gotoLine(0);
        },

        update: function (model) {
          currentModel = model;
          that.showFile();
        },

        find: function (searchQuery, searchOptions) {
          editor.find(searchQuery, searchOptions, true);
        },

        findAll: function (searchQuery, searchOptions) {
          editor.findAll(searchQuery, searchOptions, false);
        },

        setMessage: function (message) {
          that.clear();
          _emptyEditSession.setValue(message);
          editor.setSession(_emptyEditSession);
          editor.gotoLine(0);
        },

        gotoLine: function (line) {
          editor.gotoLine(line);
        }
      };

      that.init();
      that.initEvents();

      return that;
    } // Constructor

  }); // define
