// 日付関係の関数
// DateUtils = loadDateUtils();

loadDateUtils = function () {
  var DateUtils = {};

  // 今を返す
  var _now = new Date();
  var now = function(datetime) {
    if(typeof datetime != 'undefined') {
      _now = datetime;
    }
    return _now;
  };
  DateUtils.now = now;

  // テキストから時間を抽出
  DateUtils.parseTime = function(str) {
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
  };

  // テキストから日付を抽出
  DateUtils.parseDate = function(str) {
    str = str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    if(str.match(/(明日|tomorrow)/)) {
      var tomorrow = new Date(now().getFullYear(), now().getMonth(), now().getDate()+1);
      return [tomorrow.getFullYear(), tomorrow.getMonth()+1, tomorrow.getDate()]
    }

    if(str.match(/(今日|today)/)) {
      return [now().getFullYear(), now().getMonth()+1, now().getDate()]
    }

    if(str.match(/(昨日|yesterday)/)) {
      var yesterday = new Date(now().getFullYear(), now().getMonth(), now().getDate()-1);
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
        if((now().getMonth() + 1) >= 11 && month <= 2) {
          year = now().getFullYear() + 1;
        }
        else if((now().getMonth() + 1) <= 2 && month >= 11) {
          year = now().getFullYear() - 1;
        }
        else {
          year = now().getFullYear();
        }
      }

      return [year, month, day];
    }

    return null;
  };

  // 日付と時間の配列から、Dateオブジェクトを生成
  DateUtils.normalizeDateTime = function(date, time) {
    // 時間だけの場合は日付を補完する
    if(date) {
      if(!time) date = null;
    }
    else {
      date = [now().getFullYear(), now().getMonth()+1, now().getDate()];
      if(!time) {
        time = [now().getHours(), now().getMinutes()];
      }
    }

    // 日付を指定したけど、時間を書いてない場合は扱わない
    if(date && time) {
      return(new Date(date[0], date[1]-1, date[2], time[0], time[1], 0));
    }
    else {
      return null;
    }
  };

  // 日時をいれてparseする
  DateUtils.parseDateTime = function(str) {
    var date = DateUtils.parseDate(str);
    var time = DateUtils.parseTime(str);
    if(!date) return null;
    if(time) {
      return(new Date(date[0], date[1]-1, date[2], time[0], time[1], 0));
    }
    else {
      return(new Date(date[0], date[1]-1, date[2], 0, 0, 0));
    }
  };

  // Dateから日付部分だけを取り出す
  DateUtils.toDate = function(date) {
    return(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  };

  // 曜日を解析
  DateUtils.parseWday = function(str) {
    str = str.replace(/曜日/, '');
    var result = [];
    var wdays = [/(sun|日)/i, /(mon|月)/i, /(tue|火)/i, /(wed|水)/i, /(thu|木)/i, /(fri|金)/i, /(sat|土)/i];
    for(var i=0; i<wdays.length; ++i) {
      if(str.match(wdays[i])) result.push(i);
    }
    return result;
  }

  var replaceChars = {
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Day
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    D: function() { return replaceChars.shortDays[this.getDay()]; },
    j: function() { return this.getDate(); },
    l: function() { return replaceChars.longDays[this.getDay()]; },
    N: function() { return this.getDay() + 1; },
    S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
    w: function() { return this.getDay(); },
    z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
    // Week
    W: function() { var d = new Date(this.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
    // Month
    F: function() { return replaceChars.longMonths[this.getMonth()]; },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    M: function() { return replaceChars.shortMonths[this.getMonth()]; },
    n: function() { return this.getMonth() + 1; },
    t: function() { var d = now(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate() }, // Fixed now, gets #days of date
    // Year
    L: function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
    o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    // Time
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
    g: function() { return this.getHours() % 12 || 12; },
    G: function() { return this.getHours(); },
    h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
'0' : '')) + m; },
    // Timezone
    e: function() { return "Not Yet Supported"; },
    I: function() {
        var DST = null;
        for (var i = 0; i < 12; ++i) {
          var d = new Date(this.getFullYear(), i, 1);
          var offset = d.getTimezoneOffset();

          if (DST === null) {
            DST = offset;
          }
          else if (offset < DST) {
            DST = offset; break;
          }
          else if (offset > DST) {
            break;
          }
        }
        return (this.getTimezoneOffset() == DST) | 0;
      },
    O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
    P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
    T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
    Z: function() { return -this.getTimezoneOffset() * 60; },
    // Full Date/Time
    c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
    r: function() { return this.toString(); },
    U: function() { return this.getTime() / 1000; }
  };

  DateUtils.format = function(format, date) {
    var returnStr = '';
    for (var i = 0; i < format.length; i++) {
      var curChar = format.charAt(i);
      if (i - 1 >= 0 && format.charAt(i - 1) == "\\") {
        returnStr += curChar;
      }
      else if (replaceChars[curChar]) {
        returnStr += replaceChars[curChar].call(date);
      }
      else if (curChar != "\\"){
        returnStr += curChar;
      }
    }
    return returnStr;
  };

  return DateUtils;
};

if(typeof exports !== 'undefined') {
  exports.DateUtils = loadDateUtils();
}
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
// Google Apps Script専用ユーティリティ


// GASのログ出力をブラウザ互換にする
if(typeof(console) == 'undefined' && typeof(Logger) != 'undefined') {
  console = Logger;
}

// デバッグ用メッセージ出力
function debug(msg) {
  // Google SpreadsheetにDebugシートがあればそれに出力
  if(SpreadsheetApp && ScriptProperties) {
    var spreadsheet = SpreadsheetApp.openById(ScriptProperties.getProperty('spreadsheet'));
    if(spreadsheet) {
      var sheet = spreadsheet.getSheetByName("_debug");
      if(sheet) {
        sheet.getRange('a'+(sheet.getLastRow()+1)).setValue(msg);
      }
    }
  }

  // コンソールに出力
  if(console) {
    console.log(msg);
  }

  return msg;
}
// メッセージテンプレート
// GSTemplate = loadGSTemplate();

loadGSTemplate = function() {
  var GSTemplate = function(spreadsheet) {
    this.spreadsheet = spreadsheet;

    // メッセージテンプレート設定
    this.sheet = this.spreadsheet.getSheetByName('_メッセージ');
    if(!this.sheet) {
      this.sheet = this.spreadsheet.insertSheet('_メッセージ');
      if(!this.sheet) {
        throw "エラー: メッセージシートを作れませんでした";
      }
      else {
        var now = DateUtils.now();
        this.sheet.getRange("A1:K2").setValues([
          [
            "出勤", "出勤更新", "退勤", "退勤更新", "休暇", "休暇取消",
            "出勤中", "出勤なし", "休暇中", "休暇なし", "使い方"
          ],
          [
            "<@#1> おはようございます (#2)", "<@#1> 出勤時間を#2へ変更しました",
            "<@#1> お疲れ様でした (#2)", "<@#1> 退勤時間を#2へ変更しました",
            "<@#1> #2を休暇として登録しました", "<@#1> #2の休暇を取り消しました",
            "#1が出勤しています", "全員退勤しています",
            "#1は#2が休暇です", "#1に休暇の人はいません",
            "<@#1> 使い方は管理者へお問い合わせ下さい"]
          ]
        );
      }
    }
  };

  // テンプレートからメッセージを生成
  GSTemplate.prototype.template = function(label) {
    var labels = this.sheet.getRange("A1:Z1").getValues()[0];
    for(var i = 0; i < labels.length; ++i) {
      if(labels[i] == label) {
        var template = _.sample(
          _.filter(
            _.map(this.sheet.getRange(String.fromCharCode(i+65)+'2:'+(String.fromCharCode(i+65))).getValues(), function(v) {
            return v[0];
          }),
            function(v) {
              return !!v;
            }
        )
        );

        var message = template;
        for (var i = 1; i < arguments.length; i++) {
          message = message.replace("#"+i, arguments[i]);
        }

        return message;
      }
    }
    return arguments.join(', ');
  }

  return GSTemplate;
};

if(typeof exports !== 'undefined') {
  exports.GSTemplate = loadGSTemplate();
}
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
    var rowNo = this.scheme.properties.length + 4;
    var startAt = DateUtils.parseDate(this.settings.get("開始日"));
    rowNo += parseInt(DateUtils.now()/(1000*24*60*60)) - parseInt(new Date(startAt[0], startAt[1]-1, startAt[2])/(1000*24*60*60));
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

    return row;
  };

  GSTimesheets.prototype.getUsers = function() {
    return _.keys(this.data);
  };

  GSTimesheets.prototype.getByDate = function(date) {
    dateStr = String(DateUtils.toDate(date));
    return _.compact(_.map(this.data, function(row) {
      return row[dateStr];
    }));
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function(username) {
    return DateUtils.parseWday(sheet.getRange("B1").getValues());
  };

  return GSTimesheets;
};

if(typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
var init = function() {
  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  if(typeof DateUtils === 'undefined') DateUtils = loadDateUtils();
  if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  if(typeof GSTemplate === 'undefined') GSTemplate = loadGSTemplate();
  if(typeof GSTimesheets === 'undefined') GSTimesheets = loadGSTimesheets();
  if(typeof Timesheets === 'undefined') Timesheets = loadTimesheets();
  if(typeof Slack === 'undefined') Slack = loadSlack();
}


// SlackのOutgoingから来るメッセージ
function doPost(e) {
}


function test1() {
  init();

  var incomingURL = 'https://toreta.slack.com/services/hooks/incoming-webhook?token=lXfhZCSiZQNZZvt2hsAq0ej2';
  var spreadsheet = SpreadsheetApp.openById("1GNNpwiOx3xmuGPvJnzsx0G-oDxQtxxryyPOCZ1CaduY");
  var settings = new GASProperties();
  var template = new GSTemplate(spreadsheet);
  var slack = new Slack(incomingURL, template);
  var storage = new GSTimesheets(spreadsheet, settings);
  var timesheets = new Timesheets(storage, slack);

  slack.receiveMessage({parameters:{user_name:'foo',text:'おはよう 10:00'}});

};
// Slackのインタフェース
// Slack = loadSlack();

loadSlack = function () {
  var Slack = function(incomingURL, template) {
    EventListener.apply(this);
    this.incomingURL = incomingURL;
    this._template = template;
  };

  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Slack.prototype, EventListener.prototype);

  // 受信したメッセージをtimesheetsに投げる
  Slack.prototype.receiveMessage = function(message) {
    var username = String(message.parameters.user_name);
    var body = String(message.parameters.text);

    // 特定のアカウントには反応しない
    var ignore_users = ['hubot', 'slackbot'];
    if(_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if(body.match(/^-/)) return;

    this.fireEvent('receiveMessage', username, body);
  };

  // メッセージ送信
  Slack.prototype.send = function(message, options) {
    options = _.clone(options || {});
    options["text"] = message;

    var send_options = {
      method: "post",
      payload: {"payload": JSON.stringify(options)}
    };

    if(this.incomingURL) {
      UrlFetchApp.fetch(this.incomingURL, send_options);
    }

    return message;
  };

  // テンプレート付きでメッセージ送信
  Slack.prototype.template = function() {
    this.send(this._template.template.apply(this._template, arguments));
  };

  return Slack;
};

if(typeof exports !== 'undefined') {
  exports.Slack = loadSlack();
}
// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadTimesheets = function (exports) {
  var Timesheets = function(storage, responder) {
    this.storage = storage;
    this.responder = responder;

    var self = this;
    this.responder.on('receiveMessage', function(username, message) {
      self.receiveMessage(username, message);
    });
  };

  // メッセージを受信する
  Timesheets.prototype.receiveMessage = function(username, message) {
    // 日付は先に処理しておく
    this.date = DateUtils.parseDate(message);
    this.time = DateUtils.parseTime(message);
    this.datetime = DateUtils.normalizeDateTime(this.date, this.time);
    if(this.datetime !== null) {
      this.dateStr = DateUtils.format("Y/m/d", this.datetime);
      this.datetimeStr = DateUtils.format("Y/m/d H:i", this.datetime);
    }

    // コマンド集
    var commands = [
      ['actionSignOut', /(バ[ー〜ァ]*イ|ば[ー〜ぁ]*い|おやすみ|お[つっ]|お先|お疲|帰|乙|bye|night|(c|see)\s*(u|you)|退勤|ごきげんよう|グッバイ|ばい)/],
      ['actionWhoIsOff', /(だれ|誰|who\s*is).*(休|やす(ま|み|む))/],
      ['actionWhoIsIn', /(だれ|誰|who\s*is)/],
      ['actionCancelOff', /(休|やす(ま|み|む)).*(キャンセル|消|止|やめ|ません)/],
      ['actionOff', /(休|やす(ま|み|む))/],
      ['actionSignIn', /(モ[ー〜]+ニン|も[ー〜]+にん|おっは|おは|へろ|はろ|ヘロ|ハロ|hi|hello|morning|出勤)/],
    ];

    // メッセージを元にメソッドを探す
    var command = _.find(commands, function(ary) {
      return(ary && message.match(ary[1]));
    });

    // メッセージを実行
    if(command && this[command[0]]) {
      return this[command[0]](username, message);
    }
  }

  // 出勤
  Timesheets.prototype.actionSignIn = function(username, message) {
    if(this.datetime) {
      var data = this.storage.get(username, this.datetime);
      if(typeof data.signIn == 'undefined' || data.signIn === '-') {
        this.storage.set(username, this.datetime, {signIn: this.datetime});
        this.responder.template("出勤", username, this.datetimeStr);
      }
      else {
        // 更新の場合は時間を明示する必要がある
        if(!!this.time) {
          this.storage.set(username, this.datetime, {signIn: this.datetime});
          this.responder.template("出勤更新", username, this.datetimeStr);
        }
      }
    }
  };

  // 退勤
  Timesheets.prototype.actionSignOut = function(username, message) {
    if(this.datetime) {
      var data = this.storage.get(username, this.datetime);
      if(typeof data.signOut == 'undefined' || data.signOut === '-') {
        this.storage.set(username, this.datetime, {signOut: this.datetime});
        this.responder.template("退勤", username, this.datetimeStr);
      }
      else {
        // 更新の場合は時間を明示する必要がある
        if(!!this.time) {
          this.storage.set(username, this.datetime, {signOut: this.datetime});
          this.responder.template("退勤更新", username, this.datetimeStr);
        }
      }
    }
  };

  // 休暇申請
  Timesheets.prototype.actionOff = function(username, message) {
    if(this.date) {
      var dateObj = new Date(this.date[0], this.date[1]-1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if(typeof data.signOut == 'undefined' || data.signOut === '-') {
        this.storage.set(username, dateObj, {signIn: '-', signOut: '-', note: message});
        this.responder.template("休暇", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 休暇取消
  Timesheets.prototype.actionCancelOff = function(username, message) {
    if(this.date) {
      var dateObj = new Date(this.date[0], this.date[1]-1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if(typeof data.signOut == 'undefined' || data.signOut === '-') {
        this.storage.set(username, dateObj, {signIn: null, signOut: null, note: message});
        this.responder.template("休暇取消", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 出勤中
  Timesheets.prototype.actionWhoIsIn = function(username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function(row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if(_.isEmpty(result)) {
      this.responder.template("出勤なし");
    }
    else {
      this.responder.template("出勤中", result.sort().join(', '));
    }
  };

  // 休暇中
  Timesheets.prototype.actionWhoIsOff = function(username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var dateStr = DateUtils.format("Y/m/d", dateObj);
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function(row){
      return row.signIn === '-' ? row.user : undefined;
    }));

    // 定休の処理
    var wday = dateObj.getDay();
    var self = this;
    _.each(this.storage.getUsers(), function(username) {
      if(_.indexOf(self.storage.getDayOff(username), wday) >= 0) {
        result.push(username);
      }
    });
    result = _.uniq(result);

    if(_.isEmpty(result)) {
      this.responder.template("休暇なし", dateStr);
    }
    else {
      this.responder.template("休暇中", dateStr, result.sort().join(', '));
    }
  };

  return Timesheets;
};

if(typeof exports !== 'undefined') {
  exports.Timesheets = loadTimesheets();
}
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r=Array.prototype,e=Object.prototype,u=Function.prototype,i=r.push,a=r.slice,o=r.concat,l=e.toString,c=e.hasOwnProperty,f=Array.isArray,s=Object.keys,p=u.bind,h=function(n){return n instanceof h?n:this instanceof h?void(this._wrapped=n):new h(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=h),exports._=h):n._=h,h.VERSION="1.7.0";var g=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}};h.iteratee=function(n,t,r){return null==n?h.identity:h.isFunction(n)?g(n,t,r):h.isObject(n)?h.matches(n):h.property(n)},h.each=h.forEach=function(n,t,r){if(null==n)return n;t=g(t,r);var e,u=n.length;if(u===+u)for(e=0;u>e;e++)t(n[e],e,n);else{var i=h.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},h.map=h.collect=function(n,t,r){if(null==n)return[];t=h.iteratee(t,r);for(var e,u=n.length!==+n.length&&h.keys(n),i=(u||n).length,a=Array(i),o=0;i>o;o++)e=u?u[o]:o,a[o]=t(n[e],e,n);return a};var v="Reduce of empty array with no initial value";h.reduce=h.foldl=h.inject=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length,o=0;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[o++]:o++]}for(;a>o;o++)u=i?i[o]:o,r=t(r,n[u],u,n);return r},h.reduceRight=h.foldr=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[--a]:--a]}for(;a--;)u=i?i[a]:a,r=t(r,n[u],u,n);return r},h.find=h.detect=function(n,t,r){var e;return t=h.iteratee(t,r),h.some(n,function(n,r,u){return t(n,r,u)?(e=n,!0):void 0}),e},h.filter=h.select=function(n,t,r){var e=[];return null==n?e:(t=h.iteratee(t,r),h.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e)},h.reject=function(n,t,r){return h.filter(n,h.negate(h.iteratee(t)),r)},h.every=h.all=function(n,t,r){if(null==n)return!0;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,!t(n[u],u,n))return!1;return!0},h.some=h.any=function(n,t,r){if(null==n)return!1;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,t(n[u],u,n))return!0;return!1},h.contains=h.include=function(n,t){return null==n?!1:(n.length!==+n.length&&(n=h.values(n)),h.indexOf(n,t)>=0)},h.invoke=function(n,t){var r=a.call(arguments,2),e=h.isFunction(t);return h.map(n,function(n){return(e?t:n[t]).apply(n,r)})},h.pluck=function(n,t){return h.map(n,h.property(t))},h.where=function(n,t){return h.filter(n,h.matches(t))},h.findWhere=function(n,t){return h.find(n,h.matches(t))},h.max=function(n,t,r){var e,u,i=-1/0,a=-1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],e>i&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(u>a||u===-1/0&&i===-1/0)&&(i=n,a=u)});return i},h.min=function(n,t,r){var e,u,i=1/0,a=1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],i>e&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(a>u||1/0===u&&1/0===i)&&(i=n,a=u)});return i},h.shuffle=function(n){for(var t,r=n&&n.length===+n.length?n:h.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=h.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},h.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=h.values(n)),n[h.random(n.length-1)]):h.shuffle(n).slice(0,Math.max(0,t))},h.sortBy=function(n,t,r){return t=h.iteratee(t,r),h.pluck(h.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var m=function(n){return function(t,r,e){var u={};return r=h.iteratee(r,e),h.each(t,function(e,i){var a=r(e,i,t);n(u,e,a)}),u}};h.groupBy=m(function(n,t,r){h.has(n,r)?n[r].push(t):n[r]=[t]}),h.indexBy=m(function(n,t,r){n[r]=t}),h.countBy=m(function(n,t,r){h.has(n,r)?n[r]++:n[r]=1}),h.sortedIndex=function(n,t,r,e){r=h.iteratee(r,e,1);for(var u=r(t),i=0,a=n.length;a>i;){var o=i+a>>>1;r(n[o])<u?i=o+1:a=o}return i},h.toArray=function(n){return n?h.isArray(n)?a.call(n):n.length===+n.length?h.map(n,h.identity):h.values(n):[]},h.size=function(n){return null==n?0:n.length===+n.length?n.length:h.keys(n).length},h.partition=function(n,t,r){t=h.iteratee(t,r);var e=[],u=[];return h.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},h.first=h.head=h.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:a.call(n,0,t)},h.initial=function(n,t,r){return a.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},h.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:a.call(n,Math.max(n.length-t,0))},h.rest=h.tail=h.drop=function(n,t,r){return a.call(n,null==t||r?1:t)},h.compact=function(n){return h.filter(n,h.identity)};var y=function(n,t,r,e){if(t&&h.every(n,h.isArray))return o.apply(e,n);for(var u=0,a=n.length;a>u;u++){var l=n[u];h.isArray(l)||h.isArguments(l)?t?i.apply(e,l):y(l,t,r,e):r||e.push(l)}return e};h.flatten=function(n,t){return y(n,t,!1,[])},h.without=function(n){return h.difference(n,a.call(arguments,1))},h.uniq=h.unique=function(n,t,r,e){if(null==n)return[];h.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=h.iteratee(r,e));for(var u=[],i=[],a=0,o=n.length;o>a;a++){var l=n[a];if(t)a&&i===l||u.push(l),i=l;else if(r){var c=r(l,a,n);h.indexOf(i,c)<0&&(i.push(c),u.push(l))}else h.indexOf(u,l)<0&&u.push(l)}return u},h.union=function(){return h.uniq(y(arguments,!0,!0,[]))},h.intersection=function(n){if(null==n)return[];for(var t=[],r=arguments.length,e=0,u=n.length;u>e;e++){var i=n[e];if(!h.contains(t,i)){for(var a=1;r>a&&h.contains(arguments[a],i);a++);a===r&&t.push(i)}}return t},h.difference=function(n){var t=y(a.call(arguments,1),!0,!0,[]);return h.filter(n,function(n){return!h.contains(t,n)})},h.zip=function(n){if(null==n)return[];for(var t=h.max(arguments,"length").length,r=Array(t),e=0;t>e;e++)r[e]=h.pluck(arguments,e);return r},h.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},h.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=h.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}for(;u>e;e++)if(n[e]===t)return e;return-1},h.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=n.length;for("number"==typeof r&&(e=0>r?e+r+1:Math.min(e,r+1));--e>=0;)if(n[e]===t)return e;return-1},h.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var d=function(){};h.bind=function(n,t){var r,e;if(p&&n.bind===p)return p.apply(n,a.call(arguments,1));if(!h.isFunction(n))throw new TypeError("Bind must be called on a function");return r=a.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(a.call(arguments)));d.prototype=n.prototype;var u=new d;d.prototype=null;var i=n.apply(u,r.concat(a.call(arguments)));return h.isObject(i)?i:u}},h.partial=function(n){var t=a.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===h&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},h.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=h.bind(n[r],n);return n},h.memoize=function(n,t){var r=function(e){var u=r.cache,i=t?t.apply(this,arguments):e;return h.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},h.delay=function(n,t){var r=a.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},h.defer=function(n){return h.delay.apply(h,[n,1].concat(a.call(arguments,1)))},h.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var l=function(){o=r.leading===!1?0:h.now(),a=null,i=n.apply(e,u),a||(e=u=null)};return function(){var c=h.now();o||r.leading!==!1||(o=c);var f=t-(c-o);return e=this,u=arguments,0>=f||f>t?(clearTimeout(a),a=null,o=c,i=n.apply(e,u),a||(e=u=null)):a||r.trailing===!1||(a=setTimeout(l,f)),i}},h.debounce=function(n,t,r){var e,u,i,a,o,l=function(){var c=h.now()-a;t>c&&c>0?e=setTimeout(l,t-c):(e=null,r||(o=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,a=h.now();var c=r&&!e;return e||(e=setTimeout(l,t)),c&&(o=n.apply(i,u),i=u=null),o}},h.wrap=function(n,t){return h.partial(t,n)},h.negate=function(n){return function(){return!n.apply(this,arguments)}},h.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},h.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},h.before=function(n,t){var r;return function(){return--n>0?r=t.apply(this,arguments):t=null,r}},h.once=h.partial(h.before,2),h.keys=function(n){if(!h.isObject(n))return[];if(s)return s(n);var t=[];for(var r in n)h.has(n,r)&&t.push(r);return t},h.values=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},h.pairs=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},h.invert=function(n){for(var t={},r=h.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},h.functions=h.methods=function(n){var t=[];for(var r in n)h.isFunction(n[r])&&t.push(r);return t.sort()},h.extend=function(n){if(!h.isObject(n))return n;for(var t,r,e=1,u=arguments.length;u>e;e++){t=arguments[e];for(r in t)c.call(t,r)&&(n[r]=t[r])}return n},h.pick=function(n,t,r){var e,u={};if(null==n)return u;if(h.isFunction(t)){t=g(t,r);for(e in n){var i=n[e];t(i,e,n)&&(u[e]=i)}}else{var l=o.apply([],a.call(arguments,1));n=new Object(n);for(var c=0,f=l.length;f>c;c++)e=l[c],e in n&&(u[e]=n[e])}return u},h.omit=function(n,t,r){if(h.isFunction(t))t=h.negate(t);else{var e=h.map(o.apply([],a.call(arguments,1)),String);t=function(n,t){return!h.contains(e,t)}}return h.pick(n,t,r)},h.defaults=function(n){if(!h.isObject(n))return n;for(var t=1,r=arguments.length;r>t;t++){var e=arguments[t];for(var u in e)n[u]===void 0&&(n[u]=e[u])}return n},h.clone=function(n){return h.isObject(n)?h.isArray(n)?n.slice():h.extend({},n):n},h.tap=function(n,t){return t(n),n};var b=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof h&&(n=n._wrapped),t instanceof h&&(t=t._wrapped);var u=l.call(n);if(u!==l.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]===n)return e[i]===t;var a=n.constructor,o=t.constructor;if(a!==o&&"constructor"in n&&"constructor"in t&&!(h.isFunction(a)&&a instanceof a&&h.isFunction(o)&&o instanceof o))return!1;r.push(n),e.push(t);var c,f;if("[object Array]"===u){if(c=n.length,f=c===t.length)for(;c--&&(f=b(n[c],t[c],r,e)););}else{var s,p=h.keys(n);if(c=p.length,f=h.keys(t).length===c)for(;c--&&(s=p[c],f=h.has(t,s)&&b(n[s],t[s],r,e)););}return r.pop(),e.pop(),f};h.isEqual=function(n,t){return b(n,t,[],[])},h.isEmpty=function(n){if(null==n)return!0;if(h.isArray(n)||h.isString(n)||h.isArguments(n))return 0===n.length;for(var t in n)if(h.has(n,t))return!1;return!0},h.isElement=function(n){return!(!n||1!==n.nodeType)},h.isArray=f||function(n){return"[object Array]"===l.call(n)},h.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},h.each(["Arguments","Function","String","Number","Date","RegExp"],function(n){h["is"+n]=function(t){return l.call(t)==="[object "+n+"]"}}),h.isArguments(arguments)||(h.isArguments=function(n){return h.has(n,"callee")}),"function"!=typeof/./&&(h.isFunction=function(n){return"function"==typeof n||!1}),h.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},h.isNaN=function(n){return h.isNumber(n)&&n!==+n},h.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===l.call(n)},h.isNull=function(n){return null===n},h.isUndefined=function(n){return n===void 0},h.has=function(n,t){return null!=n&&c.call(n,t)},h.noConflict=function(){return n._=t,this},h.identity=function(n){return n},h.constant=function(n){return function(){return n}},h.noop=function(){},h.property=function(n){return function(t){return t[n]}},h.matches=function(n){var t=h.pairs(n),r=t.length;return function(n){if(null==n)return!r;n=new Object(n);for(var e=0;r>e;e++){var u=t[e],i=u[0];if(u[1]!==n[i]||!(i in n))return!1}return!0}},h.times=function(n,t,r){var e=Array(Math.max(0,n));t=g(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},h.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},h.now=Date.now||function(){return(new Date).getTime()};var _={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},w=h.invert(_),j=function(n){var t=function(t){return n[t]},r="(?:"+h.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};h.escape=j(_),h.unescape=j(w),h.result=function(n,t){if(null==n)return void 0;var r=n[t];return h.isFunction(r)?n[t]():r};var x=0;h.uniqueId=function(n){var t=++x+"";return n?n+t:t},h.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var A=/(.)^/,k={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},O=/\\|'|\r|\n|\u2028|\u2029/g,F=function(n){return"\\"+k[n]};h.template=function(n,t,r){!t&&r&&(t=r),t=h.defaults({},t,h.templateSettings);var e=RegExp([(t.escape||A).source,(t.interpolate||A).source,(t.evaluate||A).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,a,o){return i+=n.slice(u,o).replace(O,F),u=o+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":a&&(i+="';\n"+a+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var a=new Function(t.variable||"obj","_",i)}catch(o){throw o.source=i,o}var l=function(n){return a.call(this,n,h)},c=t.variable||"obj";return l.source="function("+c+"){\n"+i+"}",l},h.chain=function(n){var t=h(n);return t._chain=!0,t};var E=function(n){return this._chain?h(n).chain():n};h.mixin=function(n){h.each(h.functions(n),function(t){var r=h[t]=n[t];h.prototype[t]=function(){var n=[this._wrapped];return i.apply(n,arguments),E.call(this,r.apply(h,n))}})},h.mixin(h),h.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=r[n];h.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],E.call(this,r)}}),h.each(["concat","join","slice"],function(n){var t=r[n];h.prototype[n]=function(){return E.call(this,t.apply(this._wrapped,arguments))}}),h.prototype.value=function(){return this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return h})}).call(this);
//# sourceMappingURL=underscore-min.map