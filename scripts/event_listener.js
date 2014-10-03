// 日付関係の関数
// EventListener = loadEventListener();

loadEventListener = function (exports) {
  if(typeof exports === 'undefined') exports = {};

  exports.EventListener = function() {
    this._events = {};
  }

  // イベントを捕捉
  exports.EventListener.prototype.on = function(eventName, func) {
    if(this._events[eventName]) {
      this._events[eventName].push(func);
    }
    else {
      this._events[eventName] = [func];
    }
  };

  // イベント発行
  exports.EventListener.prototype.fireEvent = function(eventName) {
    var funcs = this._events[eventName];
    if(funcs) {
      for(var i = 0; i < funcs.length; ++i) {
        funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  return exports.EventListener;
};

if(typeof exports !== 'undefined') {
  loadEventListener(exports);
}
