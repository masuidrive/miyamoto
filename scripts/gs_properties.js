// KVS

loadGSProperties = function (exports) {
  var GSProperties = function(spreadsheet) {
    // 初期設定
    this.sheet = spreadsheet.getSheetByName('_設定');
    if(!this.sheet) {
      this.sheet = spreadsheet.insertSheet('_設定');
    }
  };

  GSProperties.prototype.get = function(key) {
    if(this.sheet.getLastRow() < 1) return defaultValue;
    var vals = _.find(this.sheet.getRange("A1:B"+this.sheet.getLastRow()).getValues(), function(v) {
      return(v[0] == key);
    });
    if(vals) {
      if(_.isDate(vals[1])) {
        return DateUtils.format("Y-m-d H:M:s", vals[1]);
      }
      else {
        return String(vals[1]);
      }
    }
    else {
      return null;
    }
  };

  GSProperties.prototype.set = function(key, val) {
    if(this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A"+this.sheet.getLastRow()).getValues();
      for(var i = 0; i < this.sheet.getLastRow(); ++i) {
        if(vals[i][0] == key) {
          this.sheet.getRange("B"+(i+1)).setValue(String(val));
          return val;
        }
      }
    }
    this.sheet.getRange("A"+(this.sheet.getLastRow()+1)+":B"+(this.sheet.getLastRow()+1)).setValues([[key, val]]);
    return val;
  };

  GSProperties.prototype.setNote = function(key, note) {
    if(this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A"+this.sheet.getLastRow()).getValues();
      for(var i = 0; i < this.sheet.getLastRow(); ++i) {
        if(vals[i][0] == key) {
          this.sheet.getRange("C"+(i+1)).setValue(note);
          return;
        }
      }
    }
    this.sheet.getRange("A"+(this.sheet.getLastRow()+1)+":C"+(this.sheet.getLastRow()+1)).setValues([[key, '', note]]);
    return;
  };

  return GSProperties;
};

if(typeof exports !== 'undefined') {
  exports.GSProperties = loadGSProperties();
}
