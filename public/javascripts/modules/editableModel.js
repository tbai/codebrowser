
/*
$('#foo').on('custom', function(event, param1, param2) {
  alert(param1 + "\n" + param2);
});
$('#foo').trigger('custom', ['Custom', 'Event']);
*/

define(
  // dependencies
  ["jquery", "clientUtils"],
  function (jquery, utils) {

    return function () {
      var $el = $(document.createElement("div"));

      var that = {

        $el: $el,

        schema: {
          _id: 1
          , displaypath: 1
          , basename: 1
          , _repository: 1
          , extension: 1
          , text: 1
          , history: 1
          , datesCreated: 1
          , lastUpdated: 1
          , currentLine: 1
          , inFiles: 1
          , type: 1
        },

        attributes: {},
        oldAttributes: {},

        set: function (map) {
          if (!map) return;

          var changed = [];

          for (n in this.schema) {
            if (map[n] && this.attributes[n] != map[n]) {
              that.oldAttributes[n] = that.attributes[n];
              that.attributes[n] = map[n];
              that[n] = map[n];
              changed.push(n);
            }
          }

          if (changed.length > 0) {
            $el.trigger("change", this.attributes, changed);
          }
        },

        get: function (name) {
          var result = null;;
          try {
            if (typeof (that.attributes[name]) != "undefined")
              result = that.attributes[name];
          } catch (e) {
            return null;
          }

          return result;
        },

        init: function () {

        },

        initEvents: function () {

        },

        fetch: function () {
          $el.trigger("beforefetch", that.attributes);
          var data = {};
          if (that.get("_id")) {
            data.id = that.get("_id");
          } else if (that.attributes.displaypath) {
            data.displaypath = that.attributes.displaypath
          } else {
            return;
          }
          $.ajax({
            url: "/file/get",
            dataType: "json",
            method: "GET",
            data: data,
            success: function (data) {
              that.attributes = data.file;
              that.attributes.type = "file";
              $el.trigger("fetch", that.attributes);
            },
            error: function () {
              alert("Ocorreu um erro:" + error.message);
            }
          });
        },

        fetchHistory: function (callbackFn) {
          that.abortRequest();
          window._fileRequest = $.ajax({
            url: "/file/" + that.get("_id") + "/history",
            dataType: "json",
            method: "GET",
            success: function (data) {
              that.set({ history: data.text });
              if (callbackFn)
                callbackFn(data.text);
              $el.trigger("fetchHistory", that.attributes);
            },
            error: function () {
              alert("Ocorreu um erro:" + error.message);
            }
          });
        },

        fetchCompleteHistory: function (callbackFn) {
          that.abortRequest();
          window._fileRequest = $.ajax({
            url: "/file/" + that.get("_id") + "/completehistory",
            dataType: "json",
            method: "GET",
            success: function (data) {
              that.set({ history: data.text });
              if (callbackFn)
                callbackFn(data.text);
              $el.trigger("fetchCompleteHistory", that.attributes);
            },
            error: function () {
              alert("Ocorreu um erro:" + error.message);
            }
          });
        },

        abortRequest: function () {
          if (window._fileRequest) {
            window._fileRequest.abort();
          }
        }
      };

      that.init();
      that.initEvents();

      return that;

    }
  });
