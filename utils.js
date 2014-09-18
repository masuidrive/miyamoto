
// テスト
function testParseTime() {
  Logger.log("Test: parseTime");
  Logger.log(_.isEqual([13,1], parseTime("13:01")));
  Logger.log(_.isEqual([14,2], parseTime("2:02pm")));
  Logger.log(_.isEqual([16,3], parseTime("午後4:3")));
  Logger.log(_.isEqual([17,0], parseTime("5pm")));
  Logger.log(_.isEqual([17,1], parseTime("5:1pm")));
  Logger.log(_.isEqual([18,0], parseTime("18時")));
  Logger.log(_.isEqual([19,20], parseTime("19 : 20")));
  Logger.log(_.isEqual([20,0], parseTime("午後８")));
  
  // 下記の様な書き方はサポートしない
  Logger.log(_.isEqual(null, parseTime("お昼")));
}

// 文章内から時間を取ってくる
function parseTime(str) {
  str = str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  var reg = /((\d{1,2})\s*[:時]{1}\s*(\d{1,2})\s*(pm|)|(am|pm|午前|午後)\s*(\d{1,2})(\s*[:時]\s*(\d{1,2})|)|(\d{1,2})(\s*[:時]{1}\s*(\d{1,2})|)(am|pm)|(\d{1,2})\s*時)/;
  var matches = str.match(reg);
  if(matches) {
    var hour, min;
    
    // 1時20, 2:30, 3:00pm
    if(matches[2] != null) {
      hour = parseInt(matches[2]);
      min = parseInt(matches[3] ? matches[3] : '0');
      if(_.contains(['pm'], matches[4])) {
        hour += 12;
      }
    }

    // 午後1 午後2時30 pm3
    if(matches[5] != null) {
      hour = parseInt(matches[6]);
      min = parseInt(matches[8] ? matches[8] : '0');
      if(_.contains(['pm', '午後'], matches[5])) {
        hour += 12;
      }
    }

    // 1am 2:30pm
    if(matches[9] != null) {
      hour = parseInt(matches[9]);
      min = parseInt(matches[11] ? matches[11] : '0');
      if(_.contains(['pm'], matches[12])) {
        hour += 12;
      }
    }

    // 14時
    if(matches[13] != null) {
      hour = parseInt(matches[13]);
      min = 0;
    }

    return [hour, min];
  }
  return null;
}

// テスト
function testParseDate() {
  Logger.log("Test: parseDate");
  
  var y201601 = new Date(2016,1-1,1);
  Logger.log(_.isEqual([2015,12,1], parseDate("12/1", y201601)));
  Logger.log(_.isEqual([2016,1,1], parseDate("1/1", y201601)));
  Logger.log(_.isEqual([2016,2,3], parseDate("2月3日", y201601)));
  Logger.log(_.isEqual([2020,1,1], parseDate("2020/1/1", y201601)));
  Logger.log(_.isEqual([1976,2,8], parseDate("1976年2月8日", y201601)));
  Logger.log(_.isEqual([2015,12,31], parseDate("昨日", y201601)));
  Logger.log(_.isEqual([2016,1,1], parseDate("今日", y201601)));
  Logger.log(_.isEqual([2016,1,2], parseDate("明日", y201601)));
  
  var y201612 = new Date(2016,12-1,1);
  Logger.log(_.isEqual([2017,1,1], parseDate("1/1", y201612)));
  Logger.log(_.isEqual([2016,11,30], parseDate("昨日", y201612)));
  Logger.log(_.isEqual([2016,12,1], parseDate("今日", y201601)));
  Logger.log(_.isEqual([2016,12,2], parseDate("明日", y201612)));
  
  // 下記の様な書き方はサポートしない
  Logger.log(_.isEqual(null, parseDate("3日後", y201612)));
}

// 文章内から日付を取ってくる
function parseDate(str, now) {
  if(!now) {
    now = new Date();
  }
  str = str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  if(str.match(/(明日|tomorrow)/)) {
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
    return [tomorrow.getFullYear(), tomorrow.getMonth()+1, tomorrow.getDate()]
  }
  
  if(str.match(/(今日|today)/)) {
    return [now.getFullYear(), now.getMonth()+1, now.getDate()]
  }
  
  if(str.match(/(昨日|yesterday)/)) {
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
    return [yesterday.getFullYear(), yesterday.getMonth()+1, yesterday.getDate()]
  }
  
  var reg = /((\d{4})[-\/年]{1}|)(\d{1,2})[-\/月]{1}(\d{1,2})/;
  var matches = str.match(reg);
  if(matches) {
    var year = parseInt(matches[2]);
    var month = parseInt(matches[3]);
    var day = parseInt(matches[4]);
    if(_.isNaN(year) || year < 1970) {
      // 
      if((now.getMonth() + 1) >= 11 && month <= 2) {
        year = now.getFullYear() + 1;
      }
      else if((now.getMonth() + 1) <= 2 && month >= 11) {
        year = now.getFullYear() - 1;
      }
      else {
        year = now.getFullYear();
      }
    }
    
    return [year, month, day];
  }
  
  return null;
}

function normalizeDateTime(date, time) {
  // 時間だけの場合は日付を補完する
  if(date) {
    if(!time) date = null;
  }
  else {
    var now = new Date();
    date = [now.getFullYear(), now.getMonth()+1, now.getDate()];
    if(!time) {
      time = [now.getHours(), now.getMinutes()];
    }
  }
  
  // 日付を指定したけど、時間を書いてない場合は扱わない
  if(date && time) {
    return(new Date(date[0], date[1]-1, date[2], time[0], time[1], 0));
  }
  else {
    return null;
  }
}

// console.log(require('util').inherits.toString()); より
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

// 継承
// console.log(require('util').inherits.toString()); より
// http://qiita.com/LightSpeedC/items/d307d809ecf2710bd957
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

// Dateから日付部分だけを取り出す
function toDate(date) {
  return(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
}

function debug(msg) {
  var spreadsheet = SpreadsheetApp.openById(ScriptProperties.getProperty('spreadsheet'));
  if(spreadsheet) {
    var sheet = spreadsheet.getSheetByName("Debug");
    if(sheet == null) {
      sheet = spreadsheet.insertSheet("Debug");
    }
    sheet.getRange('a'+(sheet.getLastRow()+1)).setValue(msg);
  }
  else if(Logger) {
    Logger.log(msg);
  }
  else if(console) {
    console.log(msg);
  }
  return msg;
}
