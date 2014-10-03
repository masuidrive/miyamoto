function createSpreadsheetStorage(spreadsheetId, settings) {
  loadSpreadsheetStorage();
  return(new SpreadsheetStorage(spreadsheetId, settings));
}

function SpreadsheetStorage(spreadsheetId, settings) {
  StorageInterface.call(this);
  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  this.settings = settings;
  this.start_date = this.settings.get('開始日');
}

loadSpreadsheetStorage = function() {
  loadSpreadsheetStorage = function(){};
  loadStorageInterface();

  inherits(SpreadsheetStorage, StorageInterface);

  // ユーザ名からシート
  SpreadsheetStorage.prototype.getSheet = function(username) {
    var sheet = this.spreadsheet.getSheetByName(username);
    if(!sheet) {
      sheet = this.spreadsheet.insertSheet(username);
      if(!sheet) {
        this.fireEvent("error", "エラー: "+username+"のシートが作れませんでした");
      }
      else {
        // ヘッダがなかったら書き込み
        if(sheet.getLastRow() == 0) {
          sheet.getRange("A1:E3").setValues([
            ["アカウント", "有効", "← 有効, Activeじゃない文字を入れると、アカウントを停止", null, null],
            ["休み", "土,日", "← 月,火,水みたいに入力してください", null, null],
            ["日付", "出勤", "退社", "時間数", "コメント"]
          ]);
        }
        this.on("newUser", username);
      }
    }
    return sheet;
  }

  // 行番号
  SpreadsheetStorage.prototype.getRowNo = function(username, date) {
    return(3 + parseInt((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000)) - parseInt((this.start_date.getTime() - this.start_date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000)));
  };

  // 出退勤の時間
  SpreadsheetStorage.prototype.get = function(username, date) {
    var sheet = this.getSheet(username);
    var row_no = this.getRowNo(username, date);
    if(row_no) {
      var data = (sheet.getRange("B"+row_no+':D'+row_no).getValues())[0];
      if(data) {
        return({inTime: (data[0] == '' ? null : data[0]), outTime: (data[1] == '' ? null : data[1]), comment: data[2]});
      }
      else {
        return({inTime: undefined, outTime:undefined, comment: undefined});
      }
    }
    else {
      return null;
    }
  };

  // 出勤
  SpreadsheetStorage.prototype.doIn = function(username, datetime, force, comment) {
    var sheet = this.getSheet(username);
    var row_no = this.getRowNo(username, datetime);
    if(row_no) {
      sheet.getRange("A"+row_no).setValue(toDate(datetime));

      // まだ出勤していないなら普通に入れる
      // 既に出勤していてもforce==trueなら、入れて色を変える
      if(sheet.getRange("B"+row_no).getValue() == '') {
        sheet.getRange("B"+row_no).setValue(datetime);
        if(force) {
          sheet.getRange("B"+row_no).setBackground("#dddddd");
        }
        return 'ok';
      }
      else if(force) {
        sheet.getRange("B"+row_no).setValue(datetime);
        sheet.getRange("B"+row_no).setBackground("#ffdddd");
        return 'updated';
      }
    }
    return false;
  };

  // 退勤
  SpreadsheetStorage.prototype.doOut = function(username, datetime, force, comment, row_no) {
    var sheet = this.getSheet(username);
    if(!row_no) {
      row_no = this.getRowNo(username, datetime);
    }
    if(row_no) {
      if(sheet.getRange("B"+row_no).getValue()) { // 出勤してないと退勤できない
        sheet.getRange("D"+row_no).setFormula("=C"+row_no+"-B"+row_no);

        // まだ退勤していないなら普通に入れる
        // 既に退勤していてもforce==trueなら、入れて色を変える
        if(sheet.getRange("C"+row_no).getValue() == '') {
          sheet.getRange("C"+row_no).setValue(datetime);
          if(force) {
            sheet.getRange("C"+row_no).setBackground("#dddddd");
          }
          return 'ok';
        }
        else if(force) {
          sheet.getRange("C"+row_no).setValue(datetime);
          sheet.getRange("C"+row_no).setBackground("#ffdddd");
          return 'updated';
        }
      }
      else { // 前日退勤していて居なく、午前6時前以前なら前日の退勤として扱う
        var yesterday = new Date(datetime.getTime() - (24 * 60 * 60 * 1000));
        var data = this.get(username, yesterday);
        if(datetime.getHours() < 6 && !data.outTime) {
          return(this.doOut(username, datetime, force, comment, this.getRowNo(username, yesterday)));
        }
      }
    }
    return false;
  };

  // その日は定休日か
  SpreadsheetStorage.prototype.isActive = function(username) {
    var sheet = this.getSheet(username);
    return(_.indexOf(['有効', 'active', 'enable'], String(sheet.getRange("B1").getValue()).trim().toLowerCase()) >= 0);
  };

  // その日は定休日か
  SpreadsheetStorage.prototype.isRegularOffDay = function(username, date) {
    var sheet = this.getSheet(username);
    var days = String(sheet.getRange("B2").getValue()).trim().split(/\s*,\s*/).map(function(day) {
      var i = _.indexOf(['日','月','火','水','木','金','土'], day.substring(0,1));
      if(i < 0) {
        i = _.indexOf(['sun','mon','tue','wed','thu','fri','sat'], day.substring(0,3).toLowerCase());
      }
      return i;
    });
    return(_.indexOf(days, date.getDay()) >= 0);
  }

  // 休暇
  SpreadsheetStorage.prototype.doOff = function(username, date, comment) {
    var sheet = this.getSheet(username);
    var row_no = this.getRowNo(username, date);
    if(row_no) {
      if(sheet.getRange("B"+row_no).getValue() == '') { // 出勤していると休暇にはできない
        sheet.getRange("A"+row_no+":C"+row_no).setValues([[toDate(date), '-', '-']]);
        return true;
      }
    }
    return false;
  };

  // 休暇取消
  SpreadsheetStorage.prototype.doCancelOff = function(username, date) {
    var sheet = this.getSheet(username);
    var row_no = this.getRowNo(username, date);
    if(row_no) {
      if(sheet.getRange("B"+row_no).getValue() == '-') { // 休暇だとキャンセル
        sheet.getRange("A"+row_no+":C"+row_no).setValues([[toDate(date), '', '']]);
        return true;
      }
    }
    return false;
  };

  // 誰が休みか
  SpreadsheetStorage.prototype.whoIsOff = function(date) {
    var self = this;
    var names = [];
    this.spreadsheet.getSheets().forEach(function(sheet) {
      var data = self.get(sheet.getName(), date);
      if(data.inTime == '-') {
        names.push(sheet.getName());
      }
      else if(data.inTime == null && self.isActive(sheet.getName()) && self.isRegularOffDay(sheet.getName(), date)) {
        names.push(sheet.getName());
      }
    });
    return(names.length < 1 ? null : _.uniq(names));
  };

  // 誰が出勤中か
  SpreadsheetStorage.prototype.whoIsIn = function(date) {
    var self = this;
    var names = [];
    this.spreadsheet.getSheets().forEach(function(sheet) {
      var data = self.get(sheet.getName(), date);
      if(data.inTime != null && data.inTime == null) {
        names.push(sheet.getName());
      }
    });
    return(names.length < 1 ? null : names);
  };
}
