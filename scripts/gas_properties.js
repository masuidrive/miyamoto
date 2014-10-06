// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGASProperties = function (exports) {
  var GASProperties = function() {
     this.properties = PropertiesService.getScriptProperties();
  };

  GASProperties.prototype.get = function(key) {
    return this.properties.getProperty(key);
  };

  GASProperties.prototype.set = function(key, val) {
    this.properties.setProperty(key, val);
    return val;
  };

  return GASProperties;
};

if(typeof exports !== 'undefined') {
  exports.GASProperties = loadGASProperties();
}
