// 日付関係の関数
// EventListener = loadEventListener();

loadEventListener = function () {
  var EventListener = function() {
    this._events = {};
  }

  // イベントを捕捉
  EventListener.prototype.on = function(eventName, func) {
    if(this._events[eventName]) {
      this._events[eventName].push(func);
    }
    else {
      this._events[eventName] = [func];
    }
  };

  // イベント発行
  EventListener.prototype.fireEvent = function(eventName) {
    var funcs = this._events[eventName];
    if(funcs) {
      for(var i = 0; i < funcs.length; ++i) {
        funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  return EventListener;
};

if(typeof exports !== 'undefined') {
  exports.EventListener = loadEventListener();
}
