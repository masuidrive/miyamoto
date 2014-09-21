function StorageInterface() {
  this._events = {};
}

loadStorageInterface = function() {
  loadStorageInterface = function(){};

  // イベントを捕捉
  StorageInterface.prototype.on = function(eventName, func) {
    if(this._events[eventName]) {
      this._events[eventName].push(func);
    }
    else {
      this._events[eventName] = [func];
    }
  };

  // 出勤
  StorageInterface.prototype.doIn = function(username, datetime) {
    return false;
  };

  // 退勤
  StorageInterface.prototype.doOut = function(username, datetime) {
    return false;
  };

  // 休暇
  StorageInterface.prototype.doOff = function(username, date) {
    return false;
  };

  // 休暇取消
  StorageInterface.prototype.doCancelOff = function(username, date) {
    return false;
  };

  // 誰が休みか
  StorageInterface.prototype.whoIsOff = function(username, date) {
    return false;
  };

  // 誰が出勤中か
  StorageInterface.prototype.whoIsIn = function(username, date) {
    return false;
  };

  // イベント発行
  StorageInterface.prototype.fireEvent = function(eventName) {
    var funcs = this._events[eventName];
    if(funcs) {
      for(var i = 0; i < funcs.length; ++i) {
        funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };
};

function testStorageInterface() {
  var results = [];

  loadStorageInterface();
  var storageInterface = new StorageInterface();
  storageInterface.on('test1', function(e) {
    results.push('TEST1:'+e);
  });

  storageInterface.on('test2', function(e) {
    results.push('TEST2:'+e);
  });

  storageInterface.fireEvent('test1', 'A');
  console.log(results.length == 1 && results[0] == 'TEST1:A');

  storageInterface.fireEvent('test2', 'B');
  console.log(results.length == 2 && results[0] == 'TEST1:A' && results[1] == 'TEST2:B');

  storageInterface.fireEvent('test1', 'C');
  console.log(results.length == 3 && results[0] == 'TEST1:A' && results[1] == 'TEST2:B' && results[2] == 'TEST1:C');
}
