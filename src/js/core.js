
var app = app || {};

app._merge = function () {
  var args = [];
  for (var arg in arguments) {
    args.push(arguments[arg]);
  }
  args.push(function (a, b) {
    return _.isArray(a) ? a.concat(b) : undefined;
  });
  return _.merge.apply(_, args);
};

if (!Function.prototype.bind) {
  Function.prototype.bind = function (binding) {
    var self = this;
    return function () {
      self.apply(binding, arguments);
    };
  };
}

Function.prototype.property = function(key) {
  console.log(app.viewHelper.last, key);
  return this;
};

String.prototype.capitalize = function() {
  return this[0].toUpperCase() + this.slice(1, this.length);
};

String.prototype.insert = function (pos, string) {
  var result = this;
  if (pos > 0) {
    result = this.substring(0, pos) + string + this.substring(pos, this.length);
  }
  else if (pos === 0) {
    result = string + this;
  }

  return result;
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
       for (var i = (start || 0), j = this.length; i < j; i++) {
           if (this[i] === obj) { return i; }
       }
       return -1;
  };
}

if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

app.cookie = {
  set: function (opt) {
    var d = new Date();
    var cname = opt.cname;
    d.setTime(d.getTime() + (opt.exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    var path = "path=/";
    document.cookie =cname + "=" + opt.content + "; " + expires + ";" + path;
  },
  get: function (opt) {
    var name = opt.cname+'=';
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1);
      if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
  },

  delete: function(opt) {
      document.cookie = opt.cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  },
};

(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());