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
        { name: '休憩' },
        { name: '就業時間' },
        { name: '累計' }
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
          sheet.getRange("B5:B").setNumberFormat("H:MM");
          sheet.getRange("C5:C").setNumberFormat("H:MM");
        }
        //this.on("newUser", username);
      }
    }

    this._sheets[username] = sheet;

    return sheet;
  };

  GSTimesheets.prototype._getRowNo = function(username, date) {
    if(!date) date = DateUtils.now();
    var rowNo = this.scheme.properties.length + 7;
    var startAt = DateUtils.parseDate(this.settings.get("開始日"));
    var s = new Date(startAt[0], startAt[1]-1, startAt[2], 0, 0, 0);
    rowNo += parseInt((date.getTime()-date.getTimezoneOffset()*60*1000)/(1000*24*60*60)) - parseInt((s.getTime()-s.getTimezoneOffset()*60*1000)/(1000*24*60*60));
    return rowNo;
  };

  GSTimesheets.prototype.get = function(username, date) {
    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);
    var row = sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + this.scheme.columns.length - 1)+rowNo).getValues()[0].map(function(v) {
      return v === '' ? undefined : v;
    });

    return({ user: username, date: row[0], signIn: row[1], signOut: row[2], note: row[3], kyuukei: row[4], workedHours: row[5], totalWorkedInMonth: row[6] });
  };

  GSTimesheets.prototype.set = function(username, date, params) {
    var row = this.get(username, date);
    _.extend(row, _.pick(params, 'signIn', 'signOut', 'note', 'kyuukei', 'workedHours', 'totalWorkedInMonth'));

    var sheet = this._getSheet(username);
    var rowNo = this._getRowNo(username, date);

    var data = [DateUtils.toDate(date), row.signIn, row.signOut, row.note, row.kyuukei, row.workedHours, row.totalWorkedInMonth].map(function(v) {
      return v == null ? '' : v;
    });
    sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + this.scheme.columns.length - 1)+rowNo).setValues([data]);

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

  // １ヶ月分の集計
  GSTimesheets.prototype.getRawValue = function (username, month, year) {
    var matomeSheet = this._getSheet(username);
    var lastRow = matomeSheet.getLastRow();
    var matomeRange = "B5:B" + lastRow;
    var matomeData = matomeSheet.getRange(matomeRange).getValues();
    var firstDay = null;
    var lastDay = null;

    var actualMonth = month+1;
    var helperStringInit = username+"さんが"+year+"年"+actualMonth+"月には";
    var helperStringFin = "時間働きました";

    for (var i = 0; i < matomeData.length; i++) {
      if (matomeData[i][0].getMonth() == month && matomeData[i][0].getYear() == year) {
        firstDay = i+5;
        break;
      }
    }
    for (var j = matomeData.length-1; j >= 0; j--) {
      if (matomeData[j][0].getMonth() == month && matomeData[j][0].getYear() == year) {
        lastDay = j+5;
        break;
      }
    }
    if (firstDay != null && lastDay != null) {
      var hoursData = 0;
      for (var n = firstDay; n <= lastDay; n++) {
        hoursData += matomeSheet.getRange("F"+n).getValue();
      }
      return helperStringInit+hoursData+helperStringFin;
    }
    else {
      return helperStringInit+"出勤しませんでした";
    }
  };

  return GSTimesheets;
};

if(typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
