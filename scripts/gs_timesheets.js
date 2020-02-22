// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGSTimesheets = function () {
  var GSTimesheets = function(spreadsheet, settings) {
    this.spreadsheet = spreadsheet;
    this.settings = settings;
    this._sheets = {};

    this.scheme = {
      columns: [
        { name: '日付' },
        { name: '出勤' },
        { name: '退勤' },
        { name: 'ノート' },
      ],
      properties: [
        { name: 'DayOff', value: '土,日', comment: '← 月,火,水みたいに入力してください。アカウント停止のためには「全部」と入れてください。'},
      ]
    };
  };

  GSTimesheets.prototype._getSheet = function(username) {
    if(this._sheets[username]) return this._sheets[username];

    var sheet = this.spreadsheet.getSheetByName(username);
    if(!sheet) {
      sheet = this.spreadsheet.insertSheet(username);
      if(!sheet) {
        throw "エラー: "+sheetName+"のシートが作れませんでした";
      }
      else {
        // 中身が無い場合は新規作成
        if(sheet.getLastRow() == 0) {
          // 設定部の書き出し
          var properties = [["Properties count", this.scheme.properties.length, null]];
          this.scheme.properties.forEach(function(s) {
            properties.push([s.name, s.value, s.comment]);
          });
          sheet.getRange("A1:C"+(properties.length)).setValues(properties);

          // ヘッダの書き出し
          var rowNo = properties.length + 2;
          var cols = this.scheme.columns.map(function(c) { return c.name; });
          sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + cols.length - 1)+rowNo).setValues([cols]);
        }
        //this.on("newUser", username);
      }
    }

    this._sheets[username] = sheet;

    return sheet;
  };

  GSTimesheets.prototype._getRowNo = function(username, date) {
    if(!date) date = DateUtils.now();
    var rowNo = this.scheme.properties.length + 4;
    var startAt = DateUtils.parseDate(this.settings.get("開始日"));
    var s = new Date(startAt[0], startAt[1]-1, startAt[2], 0, 0, 0);
    rowNo += parseInt((date.getTime()-date.getTimezoneOffset()*60*1000)/(1000*24*60*60), 10) - parseInt((s.getTime()-s.getTimezoneOffset()*60*1000)/(1000*24*60*60), 10);
    return rowNo;
  };

  GSTimesheets.prototype.get = function(username, date) {
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);
    var row = sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + this.scheme.columns.length - 1)+rowNo).getValues()[0].map(function(v) {
      return v === '' ? undefined : v;
    });

    return({ user: username, date: row[0], signIn: row[1], signOut: row[2], note: row[3] });
  };

  GSTimesheets.prototype.set = function(username, date, params) {
    var row = this.get(username, date);
    _.extend(row, _.pick(params, 'signIn', 'signOut', 'note'));

    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);

    var data = [DateUtils.toDate(date), row.signIn, row.signOut, row.note].map(function(v) {
      return v == null ? '' : v;
    });
    sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + this.scheme.columns.length - 1)+rowNo).setValues([data]);
    sheet.getRange("B"+rowNo+":C"+rowNo).setNumberFormat('hh:mm')

    return row;
  };

  GSTimesheets.prototype.getUsers = function() {
    return _.compact(_.map(this.spreadsheet.getSheets(), function(s) {
      var name = s.getName();
      return String(name).substr(0, 1) == '_' ? undefined : name;
    }));
  };

  GSTimesheets.prototype.getByDate = function(date) {
    var self = this;
    return _.map(this.getUsers(), function(username) {
      return self.get(username, date);
    });
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function(username) {
    var sheet = this._getSheet(username);
    return DateUtils.parseWday(sheet.getRange("B2").getValue());
  };

  return GSTimesheets;
};

if(typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
