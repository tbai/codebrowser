define(function () {
  /* Data list control */
  Array.prototype.findBy = function (attrname, value) {
    for (var i = 0; i < this.length; i++) {
    		var item = this[i];
    		if (item[attrname] == value) {
          return item;
    		}
    }
    return null;
  }

  return {
    selectText: function (element) {
		    var doc = document,
        text = doc.getElementById(element),
        range,
        selection;

		    if (doc.body.createTextRange) { //ms
          range = doc.body.createTextRange();
          range.moveToElementText(text);
          range.select();
		    } else if (window.getSelection) { //all others
          selection = window.getSelection();
          range = doc.createRange();
          range.selectNodeContents(text);
          selection.removeAllRanges();
          selection.addRange(range);
		    }
    },

    debug: function (str, obj) {
      if (window.console && window.console.log) {
        var formatted = str;
        if (obj && window.JSON && window.JSON.stringify) {
          formatted += " " + window.JSON.stringify(obj);
        }

      }
    }
  }
});

