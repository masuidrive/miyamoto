// Apiのインタフェース
// Api = loadApi();

loadApi = function loadApi() {
  var Api = function Api(slack, storage, template, settings, properties) {
    EventListener.apply(this);
    this.slack = slack;
    this.storage = storage;
    this._template = template;
    this.settings = settings;
    this.properties = properties;
    this.result = {};
    this.command = '';
    this.via = 'API';
  };

  if (typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Api.prototype, EventListener.prototype);

  Api.prototype.extractUsername = function (parameter) {
    if (parameter.access_token != null) {
      var access_token = this.properties.get('access_tokens::' + parameter.access_token);
      return access_token !== null ? JSON.parse(access_token).display_name : '';
    } else {
      return parameter.username || '';
    }
  };

  // 受信したメッセージをtimesheetsに投げる
  Api.prototype.receiveMessage = function (message) {
    var username = this.extractUsername(message);
    var command = message.command;

    // 特定のアカウントには反応しない
    var ignore_users = (this.settings.get("無視するユーザ") || '').toLowerCase().replace(/^\s*(.*?)\s*$/, "$1").split(/\s*,\s*/);
    if (_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if (command.match(/^-/)) return;

    if (this.storage.getUsers().indexOf(username) >= 0) {
      this.command = command;
      this.fireEvent('receiveMessage', username, this._convertCommandToText(command));
    } else {
      this.result = {
        code: 404,
        message: 'User not found.',
        username: username,
        datetime: new Date()
      };
    }

    return ContentService.createTextOutput(JSON.stringify(this.result)).setMimeType(ContentService.MimeType.JSON);
  };

  Api.prototype._convertCommandToText = function (command) {
    switch (command) {
      case 'signIn':
        return 'おはようございます';
      case 'signOut':
        return 'お疲れさまでした';
      case 'getStatus':
        return '__getStatus__';
      default:
        return '';
    }
  };

  // テンプレート付きでメッセージ送信
  Api.prototype.template = function () {
    this.slack.send(this._template.template.apply(this._template, arguments));

    switch (this.command) {
      case 'signIn':
        this.result = {
          code: 200,
          status: 'signedIn',
          username: arguments[1],
          datetime: DateUtils.parseDateTime(arguments[2])
        };
        break;
      case 'signOut':
        this.result = {
          code: 200,
          status: 'signedOut',
          username: arguments[1],
          datetime: DateUtils.parseDateTime(arguments[2])
        };
        break;
      default:
        break;
    }
  };

  return Api;
};

if (typeof exports !== 'undefined') {
  exports.Api = loadApi();
}
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Auth = function () {
  function Auth(properties) {
    _classCallCheck(this, Auth);

    this.properties = properties;
    this.datetime = new Date();
  }

  _createClass(Auth, [{
    key: 'receiveMessage',
    value: function receiveMessage(parameters) {
      var _this = this;

      if (parameters.command != null) {
        var result = typeof this[parameters.command] === 'function' ? this[parameters.command](parameters) : this.commandNotFound();

        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      } else {
        var message = function () {
          if (!_this.validateAccessToken(parameters.state)) {
            return HtmlService.createHtmlOutput('<b>不正なパラメータです</b>');
          } else if (parameters.error === 'access_denied') {
            return _this.handleAccessDenied(parameters.state);
          } else {
            return _this.handleAccessAllowed(parameters.state, parameters.code);
          }
        }();

        return HtmlService.createHtmlOutput('<b>' + message + '</b>');
      }
    }
  }, {
    key: 'commandNotFound',
    value: function commandNotFound() {
      return {
        code: 400,
        message: 'Command not found.',
        datetime: this.datetime
      };
    }
  }, {
    key: 'generateAccessToken',
    value: function generateAccessToken(parameters) {
      var access_token = Utilities.getUuid();
      this.setAccessToken(access_token, {
        display_name: '',
        real_name: '',
        slack_access_token: '',
        created_at: this.datetime
      });

      return {
        code: 201,
        access_token: access_token,
        auth_url: 'https://slack.com/oauth/authorize?scope=users.profile:read&client_id=' + this.properties.get('slack_client_id') + '&state=' + access_token,
        datetime: this.datetime
      };
    }
  }, {
    key: 'getUserInformation',
    value: function getUserInformation(parameters) {
      if (!this.validateAccessToken(parameters.access_token)) {
        return {
          code: 404,
          message: 'Invalid access token.',
          datetime: this.datetime
        };
      }

      var accessToken = this.getAccessToken(parameters.access_token);
      return accessToken.slack_access_token === '' ? {
        code: 401,
        message: 'User not authenticated.',
        datetime: this.datetime
      } : {
        code: 200,
        display_name: accessToken.display_name,
        real_name: accessToken.real_name,
        slack_access_token: accessToken.slack_access_token,
        datetime: this.datetime
      };
    }
  }, {
    key: 'validateAccessToken',
    value: function validateAccessToken(access_token) {
      return this.properties.get('access_tokens::' + access_token) !== null;
    }
  }, {
    key: 'getAccessToken',
    value: function getAccessToken(access_token) {
      return JSON.parse(this.properties.get('access_tokens::' + access_token));
    }
  }, {
    key: 'setAccessToken',
    value: function setAccessToken(access_token, accessToken) {
      this.properties.set('access_tokens::' + access_token, JSON.stringify(accessToken));
    }
  }, {
    key: 'handleAccessDenied',
    value: function handleAccessDenied(access_token) {
      var accessToken = this.getAccessToken(access_token);
      accessToken.denied_at = this.datetime;
      this.setAccessToken(access_token, accessToken);

      return '認証に失敗しました';
    }
  }, {
    key: 'handleAccessAllowed',
    value: function handleAccessAllowed(access_token, code) {
      var slack_access_token_response = this.obtainSlackAccessToken(code);
      if (!slack_access_token_response.ok) return 'Slack ログインに失敗しました';
      var slack_access_token = slack_access_token_response.access_token;

      var user_response = this.retrieveUserProfile(slack_access_token);
      if (!user_response.ok) return 'ユーザ情報の取得に失敗しました';

      var accessToken = this.getAccessToken(access_token);
      accessToken.display_name = user_response.profile.display_name;
      accessToken.real_name = user_response.profile.real_name;
      accessToken.slack_access_token = slack_access_token;
      accessToken.allowed_at = this.datetime;
      this.setAccessToken(access_token, accessToken);

      return 'Slack ログインが完了しました';
    }
  }, {
    key: 'obtainSlackAccessToken',
    value: function obtainSlackAccessToken(code) {
      var response = UrlFetchApp.fetch('https://slack.com/api/oauth.access?client_id=' + this.properties.get('slack_client_id') + '&client_secret=' + this.properties.get('slack_client_secret') + '&code=' + code);
      return JSON.parse(response.getContentText());
    }
  }, {
    key: 'retrieveUserProfile',
    value: function retrieveUserProfile(slack_access_token) {
      var response = UrlFetchApp.fetch('https://slack.com/api/users.profile.get?token=' + slack_access_token);
      return JSON.parse(response.getContentText());
    }
  }]);

  return Auth;
}();
// 日付関係の関数
// DateUtils = loadDateUtils();

loadDateUtils = function loadDateUtils() {
  var DateUtils = {};

  // 今を返す
  var _now = new Date();
  var now = function now(datetime) {
    if (typeof datetime != 'undefined') {
      _now = datetime;
    }
    return _now;
  };
  DateUtils.now = now;

  // テキストから時間を抽出
  DateUtils.parseTime = function (str) {
    str = String(str || "").toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    var reg = /((\d{1,2})\s*[:時]{1}\s*(\d{1,2})\s*(pm|)|(am|pm|午前|午後)\s*(\d{1,2})(\s*[:時]\s*(\d{1,2})|)|(\d{1,2})(\s*[:時]{1}\s*(\d{1,2})|)(am|pm)|(\d{1,2})\s*時)/;
    var matches = str.match(reg);
    if (matches) {
      var hour, min;

      // 1時20, 2:30, 3:00pm
      if (matches[2] != null) {
        hour = parseInt(matches[2], 10);
        min = parseInt(matches[3] ? matches[3] : '0', 10);
        if (_.contains(['pm'], matches[4])) {
          hour += 12;
        }
      }

      // 午後1 午後2時30 pm3
      if (matches[5] != null) {
        hour = parseInt(matches[6], 10);
        min = parseInt(matches[8] ? matches[8] : '0', 10);
        if (_.contains(['pm', '午後'], matches[5])) {
          hour += 12;
        }
      }

      // 1am 2:30pm
      if (matches[9] != null) {
        hour = parseInt(matches[9], 10);
        min = parseInt(matches[11] ? matches[11] : '0', 10);
        if (_.contains(['pm'], matches[12])) {
          hour += 12;
        }
      }

      // 14時
      if (matches[13] != null) {
        hour = parseInt(matches[13], 10);
        min = 0;
      }

      return [hour, min];
    }
    return null;
  };

  // テキストから日付を抽出
  DateUtils.parseDate = function (str) {
    str = String(str || "").toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    if (str.match(/(明日|tomorrow)/)) {
      var tomorrow = new Date(now().getFullYear(), now().getMonth(), now().getDate() + 1);
      return [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()];
    }

    if (str.match(/(今日|today)/)) {
      return [now().getFullYear(), now().getMonth() + 1, now().getDate()];
    }

    if (str.match(/(昨日|yesterday)/)) {
      var yesterday = new Date(now().getFullYear(), now().getMonth(), now().getDate() - 1);
      return [yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate()];
    }

    var reg = /((\d{4})[-\/年]{1}|)(1[0-2]|0?[1-9])[-\/月]{1}([12][0-9]|3[01]|0?[1-9])/;
    var matches = str.match(reg);
    if (matches) {
      var year = parseInt(matches[2], 10);
      var month = parseInt(matches[3], 10);
      var day = parseInt(matches[4], 10);
      if (_.isNaN(year) || year < 1970) {
        //
        if (now().getMonth() + 1 >= 11 && month <= 2) {
          year = now().getFullYear() + 1;
        } else if (now().getMonth() + 1 <= 2 && month >= 11) {
          year = now().getFullYear() - 1;
        } else {
          year = now().getFullYear();
        }
      }

      return [year, month, day];
    }

    return null;
  };

  // 日付と時間の配列から、Dateオブジェクトを生成
  DateUtils.normalizeDateTime = function (date, time) {
    // 時間だけの場合は日付を補完する
    if (date) {
      if (!time) date = null;
    } else {
      date = [now().getFullYear(), now().getMonth() + 1, now().getDate()];
      if (!time) {
        time = [now().getHours(), now().getMinutes()];
      }
    }

    // 日付を指定したけど、時間を書いてない場合は扱わない
    if (date && time) {
      return new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0);
    } else {
      return null;
    }
  };

  // 日時をいれてparseする
  DateUtils.parseDateTime = function (str) {
    var date = DateUtils.parseDate(str);
    var time = DateUtils.parseTime(str);
    if (!date) return null;
    if (time) {
      return new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0);
    } else {
      return new Date(date[0], date[1] - 1, date[2], 0, 0, 0);
    }
  };

  // Dateから日付部分だけを取り出す
  DateUtils.toDate = function (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  };

  // 曜日を解析
  DateUtils.parseWday = function (str) {
    str = String(str).replace(/曜日/g, '');
    var result = [];
    var wdays = [/(sun|日)/i, /(mon|月)/i, /(tue|火)/i, /(wed|水)/i, /(thu|木)/i, /(fri|金)/i, /(sat|土)/i];
    for (var i = 0; i < wdays.length; ++i) {
      if (str.match(wdays[i])) result.push(i);
    }
    return result;
  };

  var replaceChars = {
    Y: function Y() {
      return this.getFullYear();
    },
    y: function y() {
      return String(this.getFullYear()).substr(-2, 2);
    },
    m: function m() {
      return ("0" + (this.getMonth() + 1)).substr(-2, 2);
    },
    d: function d() {
      return ("0" + this.getDate()).substr(-2, 2);
    },

    H: function H() {
      return ("0" + this.getHours()).substr(-2, 2);
    },
    M: function M() {
      return ("0" + this.getMinutes()).substr(-2, 2);
    },
    s: function s() {
      return ("0" + this.getSeconds()).substr(-2, 2);
    }
  };

  DateUtils.format = function (format, date) {
    var result = '';
    for (var i = 0; i < format.length; i++) {
      var curChar = format.charAt(i);
      if (replaceChars[curChar]) {
        result += replaceChars[curChar].call(date);
      } else {
        result += curChar;
      }
    }
    return result;
  };

  DateUtils.ceil30 = function (original_date) {
    var date = new Date(original_date.getTime());
    date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30);
    return date;
  };

  DateUtils.floor30 = function (original_date) {
    var date = new Date(original_date.getTime());
    date.setMinutes(Math.floor(date.getMinutes() / 30) * 30);
    return date;
  };

  DateUtils.getLengthOfService = function (entrance, today) {
    var year = 0;
    while (entrance.setFullYear(entrance.getFullYear() + 1) <= today) {
      year++;
    }
    return year;
  };

  DateUtils.getFiscalYear = function (date) {
    return date.getMonth() <= 2 ? date.getFullYear() - 1 : date.getFullYear();
  };

  return DateUtils;
};

if (typeof exports !== 'undefined') {
  exports.DateUtils = loadDateUtils();
}
// 日付関係の関数
// EventListener = loadEventListener();

loadEventListener = function loadEventListener() {
  var EventListener = function EventListener() {
    this._events = {};
  };

  // イベントを捕捉
  EventListener.prototype.on = function (eventName, func) {
    if (this._events[eventName]) {
      this._events[eventName].push(func);
    } else {
      this._events[eventName] = [func];
    }
  };

  // イベント発行
  EventListener.prototype.fireEvent = function (eventName) {
    var funcs = this._events[eventName];
    if (funcs) {
      for (var i = 0; i < funcs.length; ++i) {
        funcs[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  return EventListener;
};

if (typeof exports !== 'undefined') {
  exports.EventListener = loadEventListener();
}
// KVS
// でも今回は使ってないです

loadGASProperties = function loadGASProperties(exports) {
  var _this = this;

  var GASProperties = function GASProperties() {
    this.properties = PropertiesService.getScriptProperties();
  };

  var values = {
    master_folder_id: function master_folder_id() {
      return DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId();
    },
    employees_folder_id: function employees_folder_id() {
      var master_folder_id = DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId();
      var employees_fi = DriveApp.searchFolders('"' + master_folder_id + '" in parents and title = "Employees"');
      return employees_fi.hasNext() ? employees_fi.next().getId() : _this.master_folder.createFolder('Employees').setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.NONE).setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW).setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW).getId();
    },
    users: function users() {
      var master_folder_id = DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId();
      var employees_fi = DriveApp.searchFolders('"' + master_folder_id + '" in parents and title = "Employees"');
      var employees_folder_id = employees_fi.next().getId();
      var employeesSpreadsheets = DriveApp.searchFiles('"' + employees_folder_id + '" in parents and mimeType = "' + MimeType.GOOGLE_SHEETS + '"');
      var users = {};
      while (employeesSpreadsheets.hasNext()) {
        var ss = employeesSpreadsheets.next();
        users[ss.getName()] = ss.getId();
      }
      return JSON.stringify(users);
    }
  };

  GASProperties.prototype.get = function (key) {
    var val = this.properties.getProperty(key);
    if (!(key in values) || val !== null) return val;

    val = values[key]();
    this.set(key, val);
    return val;
  };

  GASProperties.prototype.set = function (key, val) {
    this.properties.setProperty(key, val);
    return val;
  };

  return GASProperties;
};

if (typeof exports !== 'undefined') {
  exports.GASProperties = loadGASProperties();
}
// Google Apps Script専用ユーティリティ

// GASのログ出力をブラウザ互換にする
if (typeof console == 'undefined' && typeof Logger != 'undefined') {
  console = {};
  console.log = function () {
    Logger.log(Array.prototype.slice.call(arguments).join(', '));
  };
}

// サーバに新しいバージョンが無いかチェックする
checkUpdate = function checkUpdate(responder) {
  if (typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  var current_version = parseFloat(new GASProperties().get('version')) || 0;

  var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/VERSION", { muteHttpExceptions: true });

  if (response.getResponseCode() == 200) {
    var latest_version = parseFloat(response.getContentText());
    if (latest_version > 0 && latest_version > current_version) {
      responder.send("最新のみやもとさんの準備ができました！\nhttps://github.com/masuidrive/miyamoto/blob/master/UPDATE.md を読んでください。");

      var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/HISTORY.md", { muteHttpExceptions: true });
      if (response.getResponseCode() == 200) {
        var text = String(response.getContentText()).replace(new RegExp("## " + current_version + "[\\s\\S]*", "m"), '');
        responder.send(text);
      }
    }
  }
};
// KVS

loadGSProperties = function loadGSProperties(exports) {
  var GSProperties = function GSProperties(spreadsheet) {
    // 初期設定
    this.sheet = spreadsheet.getSheetByName('_設定');
    if (!this.sheet) {
      this.sheet = spreadsheet.insertSheet('_設定');
    }
  };

  GSProperties.prototype.get = function (key) {
    if (this.sheet.getLastRow() < 1) return defaultValue;
    var vals = _.find(this.sheet.getRange("A1:B" + this.sheet.getLastRow()).getValues(), function (v) {
      return v[0] == key;
    });
    if (vals) {
      if (_.isDate(vals[1])) {
        return DateUtils.format("Y-m-d H:M:s", vals[1]);
      } else {
        return String(vals[1]);
      }
    } else {
      return null;
    }
  };

  GSProperties.prototype.set = function (key, val) {
    if (this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A" + this.sheet.getLastRow()).getValues();
      for (var i = 0; i < this.sheet.getLastRow(); ++i) {
        if (vals[i][0] == key) {
          this.sheet.getRange("B" + (i + 1)).setValue(String(val));
          return val;
        }
      }
    }
    this.sheet.getRange("A" + (this.sheet.getLastRow() + 1) + ":B" + (this.sheet.getLastRow() + 1)).setValues([[key, val]]);
    return val;
  };

  GSProperties.prototype.setNote = function (key, note) {
    if (this.sheet.getLastRow() > 0) {
      var vals = this.sheet.getRange("A1:A" + this.sheet.getLastRow()).getValues();
      for (var i = 0; i < this.sheet.getLastRow(); ++i) {
        if (vals[i][0] == key) {
          this.sheet.getRange("C" + (i + 1)).setValue(note);
          return;
        }
      }
    }
    this.sheet.getRange("A" + (this.sheet.getLastRow() + 1) + ":C" + (this.sheet.getLastRow() + 1)).setValues([[key, '', note]]);
    return;
  };

  return GSProperties;
};

if (typeof exports !== 'undefined') {
  exports.GSProperties = loadGSProperties();
}
// メッセージテンプレート
// GSTemplate = loadGSTemplate();

loadGSTemplate = function loadGSTemplate() {
  var GSTemplate = function GSTemplate(spreadsheet) {
    this.spreadsheet = spreadsheet;

    // メッセージテンプレート設定
    this.sheet = this.spreadsheet.getSheetByName('_メッセージ');
    if (!this.sheet) {
      this.sheet = this.spreadsheet.insertSheet('_メッセージ');
      if (!this.sheet) {
        throw "エラー: メッセージシートを作れませんでした";
      } else {
        var now = DateUtils.now();
        this.sheet.getRange("A1:L2").setValues([["出勤", "出勤更新", "退勤", "退勤更新", "休暇", "休暇取消", "出勤中", "出勤なし", "休暇中", "休暇なし", "出勤確認", "退勤確認"], ["<@#1> おはようございます (#2)", "<@#1> 出勤時間を#2へ変更しました", "<@#1> お疲れ様でした (#2)", "<@#1> 退勤時間を#2へ変更しました", "<@#1> #2を休暇として登録しました", "<@#1> #2の休暇を取り消しました", "#1が出勤しています", "全員退勤しています", "#1は#2が休暇です", "#1に休暇の人はいません", "今日は休暇ですか？ #1", "退勤しましたか？ #1"]]);
      }
    }
  };

  // テンプレートからメッセージを生成
  GSTemplate.prototype.template = function (label) {
    var labels = this.sheet.getRange("A1:Z1").getValues()[0];
    for (var i = 0; i < labels.length; ++i) {
      if (labels[i] == label) {
        var template = _.sample(_.filter(_.map(this.sheet.getRange(String.fromCharCode(i + 65) + '2:' + String.fromCharCode(i + 65)).getValues(), function (v) {
          return v[0];
        }), function (v) {
          return !!v;
        }));

        var message = template;
        for (var i = 1; i < arguments.length; i++) {
          var arg = arguments[i];
          if (_.isArray(arg)) {
            arg = _.map(arg, function (u) {
              return "<@" + u + ">";
            }).join(', ');
          }

          message = message.replace("#" + i, arg);
        }

        return message;
      }
    }
    return arguments.join(', ');
  };

  return GSTemplate;
};

if (typeof exports !== 'undefined') {
  exports.GSTemplate = loadGSTemplate();
}
// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGSTimesheets = function loadGSTimesheets() {
  var GSTimesheets = function GSTimesheets(spreadsheet, settings, properties) {
    this.spreadsheet = spreadsheet;
    this.settings = settings;
    this.properties = properties;
    this._spreadsheets = {};
    this._sheets = {};
    this.users = JSON.parse(this.properties.get('users'));

    var rest = DateUtils.parseTime(this.settings.get('休憩時間'));
    var rest_string = rest[0] + ':' + rest[1] + ':00';

    this.scheme = {
      columns: [
        { name: '日付', format: 'yyyy"年"m"月"d"日（"ddd"）"', width: 150 },
        { name: '出勤（打刻）', format: 'H:mm', width: 100 },
        { name: '退勤（打刻）', format: 'H:mm', width: 100 },
        { name: '出勤', format: 'H:mm', formula: '=CEILING(RC[-2],TIME(0,' + this.settings.get('丸め単位（分）') + ',0))', width: 50 },
        { name: '退勤', format: 'H:mm', formula: '=FLOOR(RC[-2],TIME(0,' + this.settings.get('丸め単位（分）') + ',0))', width: 50 },
        { name: '休憩時間', format: '[h]:mm', formula: '=IF(OR(ISBLANK(RC[-3]),ISBLANK(RC[-4])), "", IF(RC[-1]-RC[-2] > TIME(6, 0, 0), TIMEVALUE("' + rest_string + '"), TIMEVALUE("0:00:00")))', width: 75 },
        { name: '勤務時間', format: '[h]:mm', formula: '=IF(OR(ISBLANK(RC[-5]),ISBLANK(RC[-4]),ISBLANK(RC[-1])),0,MAX(RC[-2]-RC[-3]-RC[-1],0))', width: 75 },
        { name: 'メモ', width: 300 }, { name: '承認者', width: 100 }, { name: '経由', width: 50 }
      ],
      properties: [{ name: 'DayOff', value: '土,日', comment: '← 月,火,水みたいに入力してください。アカウント停止のためには「全部」と入れてください。' }, { name: '入社日', value: new Date().toLocaleDateString(), comment: 'デフォルトでシート作成日が入っているので，入社日に修正してください。' }, { name: '勤務形態', value: '正社員', comment: 'デフォルトで「正社員」が入っているので，正しいものを選択してください。編集権限がない場合はコーポレート部門に連絡してください。' }]
    };

    this.seasons = [{ name: '夏季', duration: 3, judge: function judge(date) {
        return [6, 7, 8].includes(date.getMonth());
      } }, { name: '年末年始', duration: 3, judge: function judge(date) {
        return [11, 0].includes(date.getMonth());
      } }];
  };

  GSTimesheets.prototype._getSpreadsheet = function (username) {
    if (this._spreadsheets[username]) return this._spreadsheets[username];

    var user_ss = this._createOrOpenUserSpreadsheet(this.properties.get('employees_folder_id'), username);
    this._spreadsheets[username] = user_ss;
    this._sheets[username] = {};

    return user_ss;
  };

  GSTimesheets.prototype._createOrOpenUserSpreadsheet = function (folder_id, username) {
    var user_ss_id = this.getUserSpreadsheetId(username);
    if (user_ss_id !== null) return SpreadsheetApp.openById(user_ss_id);

    var user_ss_fi = DriveApp.searchFiles('"' + folder_id + '" in parents and mimeType = "' + MimeType.GOOGLE_SHEETS + '" and title = "' + username + '"');
    if (user_ss_fi.hasNext()) {
      var user_ss = SpreadsheetApp.openById(user_ss_fi.next().getId());
      this.addUserSpreadsheet(user_ss);
      return user_ss;
    }

    var new_ss = SpreadsheetApp.create(username);
    var prop_sheet = this._createOrOpenSheet(new_ss, '_設定');
    this._fillPropertiesSheet(prop_sheet);
    this._createPaidHolidaysSheets(new_ss);
    this._createSeasonalHolidaysSheets(new_ss, DateUtils.getFiscalYear(new Date()));

    var new_ss_file = DriveApp.getFileById(new_ss.getId()).setOwner(this.settings.get('管理者メールアドレス')).setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.NONE).setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.COMMENT).setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.COMMENT);
    DriveApp.getFolderById(folder_id).addFile(new_ss_file);
    DriveApp.getRootFolder().removeFile(new_ss_file);

    this.addUserSpreadsheet(new_ss);

    return new_ss;
  };

  GSTimesheets.prototype._getSheet = function (username, sheetName) {
    var spreadsheet = this._getSpreadsheet(username);
    if (this._sheets[username][sheetName]) return this._sheets[username][sheetName];

    var sheet = this._createOrOpenSheet(spreadsheet, sheetName);

    this._sheets[username][sheetName] = sheet;

    return sheet;
  };

  GSTimesheets.prototype._createOrOpenSheet = function (spreadsheet, sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      return sheet;
    }

    sheet = spreadsheet.getSheetByName('シート1');
    if (sheet) {
      sheet.setName(sheetName);
      return sheet;
    }

    sheet = spreadsheet.insertSheet(sheetName, spreadsheet.getNumSheets());
    if (!sheet) {
      throw '\u30A8\u30E9\u30FC: ' + sheetName + '\u306E\u30B7\u30FC\u30C8\u304C\u4F5C\u308C\u307E\u305B\u3093\u3067\u3057\u305F';
    }
    return sheet;
  };

  GSTimesheets.prototype._fillPropertiesSheet = function (sheet) {
    var last_row = sheet.getLastRow();
    var current_props = last_row === 0 ? [['']] : sheet.getRange(1, 1, last_row, 1).getValues();
    var new_props = last_row === 0 ? [["Properties count", this.scheme.properties.length, null]] : [];
    this.scheme.properties.forEach(function (s) {
      if (!_.find(current_props, function (v) {
        return v[0] === s.name;
      })) {
        new_props.push([s.name, s.value, s.comment]);
      }
    });
    if (new_props.length > 0) {
      sheet.getRange(last_row + 1, 1, new_props.length, 3).setValues(new_props);
    }

    this._setDataValidationInPropertiesSheet(sheet);
  };

  GSTimesheets.prototype._setDataValidationInPropertiesSheet = function (sheet) {
    var last_row = sheet.getLastRow();
    if (last_row < 1) return;
    var props = sheet.getRange(1, 1, last_row, 1).getValues();
    props.forEach(function (row, index) {
      if (row[0] !== '勤務形態') return;
      var cell = sheet.getRange(index + 1, 2, 1, 1);
      if (cell.getDataValidation() === null) {
        cell.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['正社員', '業務委託', 'アルバイト'], true).build());
      }
    });
  };

  GSTimesheets.prototype._createPaidHolidaysSheets = function (spreadsheet) {
    var entrance = this._createOrOpenSheet(spreadsheet, '_設定').getRange('B3').getValue();
    var length_of_service = DateUtils.getLengthOfService(entrance, new Date());

    for (var i = 1; i <= length_of_service + 1; i++) {
      var sheet = this._createOrOpenSheet(spreadsheet, i + '\u5E74\u76EE\u6709\u7D66\u4F11\u6687');
      this._fillPaidHolidaysSheet(sheet);
    }
  };

  GSTimesheets.prototype._fillPaidHolidaysSheet = function (sheet) {
    if (sheet.getLastRow() > 0) return;
    var nth_of_year = sheet.getName().match(/\d+/)[0] * 1;

    var rows = [['期間', '', '', ''], ['', '合計時間', '日', '時間'], ['繰越', 0, '', ''], ['付与', 8 * (10 + nth_of_year - 1), '', ''], ['取得済み', '', '', ''], ['残り', '', '', ''], ['', '', '', ''], ['取得日', '取得時間', '', '']];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    sheet.getRange('B1:C1').setFormulas([['=EDATE(\'_\u8A2D\u5B9A\'!B3,' + 12 * (nth_of_year - 1) + ')', '=EDATE(B1,12)-1']]);
    if (nth_of_year > 1) sheet.getRange('B3').setFormula('=\'' + (nth_of_year - 1) + '\u5E74\u76EE\u6709\u7D66\u4F11\u6687\'!B6');
    sheet.getRange('B5').setFormula('=SUM(B9:B88)');
    sheet.getRange('B6').setFormula('=B3+B4-B5');
    sheet.getRange('C3:C6').setFormulaR1C1('=INT(RC[-1]/8)');
    sheet.getRange('D3:D6').setFormulaR1C1('=MOD(RC[-2],8)');
  };

  GSTimesheets.prototype._createSeasonalHolidaysSheets = function (spreadsheet, year) {
    var _this = this;

    this.seasons.forEach(function (season) {
      var sheet = _this._createOrOpenSheet(spreadsheet, year + '\u5E74\u5EA6' + season.name + '\u4F11\u6687');
      _this._fillSeasonalHolidaysSheet(sheet, season);
    });
  };

  GSTimesheets.prototype._fillSeasonalHolidaysSheet = function (sheet, season) {
    if (sheet.getLastRow() > 0) return;

    var rows = [['付与日数', season.duration], ['取得済み日数', ''], ['残り日数', ''], ['', ''], ['取得日', '']];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    sheet.getRange('B2').setFormula('=COUNT(A6:A8)');
    sheet.getRange('B3').setFormula('=B1-B2');
  };

  GSTimesheets.prototype._getMonthlySheet = function (username, date) {
    var sheetName = date.getFullYear() + '\u5E74' + (date.getMonth() + 1) + '\u6708';
    var monthly_sheet = this._getSheet(username, sheetName);
    this._fillMonthlySheet(monthly_sheet, date);
    return monthly_sheet;
  };

  GSTimesheets.prototype._fillMonthlySheet = function (sheet, date) {
    // 中身が無い場合は新規作成
    if (sheet.getLastRow() == 0) {
      // ヘッダの書き出し
      var cols = this.scheme.columns.map(function (c) {
        return c.name;
      });
      sheet.getRange(2, 1, 1, cols.length).setValues([cols]);

      var year = date.getFullYear();
      var month = date.getMonth();
      var rows = [];

      for (var _date = new Date(year, month, 1); _date.getMonth() === month; _date.setDate(_date.getDate() + 1)) {
        var columns = [_date.toLocaleDateString()];
        for (var i = 1; i < this.scheme.columns.length; i++) {
          columns.push(this.scheme.columns[i].hasOwnProperty('value') ? this.scheme.columns[i].value : '');
        }
        rows.push(columns);
      }
      sheet.getRange(3, 1, rows.length, cols.length).setValues(rows);

      for (var _i = 0; _i < this.scheme.columns.length; _i++) {
        if (this.scheme.columns[_i].hasOwnProperty('format')) {
          sheet.getRange(3, _i + 1, rows.length, 1).setNumberFormat(this.scheme.columns[_i].format);
        }
        if (this.scheme.columns[_i].hasOwnProperty('formula')) {
          sheet.getRange(3, _i + 1, rows.length, 1).setFormulaR1C1(this.scheme.columns[_i].formula);
        }
        if (this.scheme.columns[_i].hasOwnProperty('width')) {
          sheet.setColumnWidth(_i + 1, this.scheme.columns[_i].width);
        }
      }

      // 合計勤務時間
      sheet.getRange('G1').setFormulaR1C1('=SUM(R[2]C:R[' + (2 + rows.length - 1) + ']C)').setNumberFormat('[h]:mm');
    }
  };

  GSTimesheets.prototype._getRowNo = function (date) {
    return date.getDate() + (date.getHours() < 6 ? 1 : 2);
  };

  GSTimesheets.prototype.get = function (username, date) {
    var sheet = this._getMonthlySheet(username, date);
    var rowNo = this._getRowNo(date);
    var row = sheet.getRange(rowNo, 1, 1, this.scheme.columns.length).getValues()[0].map(function (v) {
      return v === '' ? undefined : v;
    });

    return { user: username, date: row[0], signIn: row[1], signOut: row[2], rest: row[5], note: row[7], supervisor: row[8], via: row[9] };
  };

  GSTimesheets.prototype.set = function (username, date, params) {
    var row = this.get(username, date);
    _.extend(row, _.pick(params, 'signIn', 'signOut', 'rest', 'note', 'supervisor', 'via'));

    var sheet = this._getMonthlySheet(username, date);
    var rowNo = this._getRowNo(date);

    this._setValues(sheet.getRange(rowNo, 2, 1, 2), [row.signIn, row.signOut]);
    // 休憩時間は数式で設定するようにするため、この処理はコメントアウト
    // this._setValues(sheet.getRange(rowNo, 6, 1, 1), [row.rest]);
    this._setValues(sheet.getRange(rowNo, 8, 1, 3), [row.note, row.supervisor, row.via]);

    return row;
  };

  GSTimesheets.prototype._setValues = function (range, data) {
    range.setValues([data.map(function (v) {
      return v == null ? '' : v;
    })]);
  };

  GSTimesheets.prototype.getUserSpreadsheetId = function (username) {
    return this.properties.get('users::' + username + '::spreadsheet_id');
  };

  GSTimesheets.prototype.setUserSpreadsheetId = function (username, spreadsheet_id) {
    this.properties.set('users::' + username + '::spreadsheet_id', spreadsheet_id);
  };

  GSTimesheets.prototype.getUsers = function () {
    return this.users;
  };

  GSTimesheets.prototype.addUserSpreadsheet = function (spreadsheet) {
    var username = spreadsheet.getName();
    this.setUserSpreadsheetId(username, spreadsheet.getId());
    this.users.push(username);
    this.updateUsers();
  };

  GSTimesheets.prototype.updateUsers = function () {
    this.properties.set('users', JSON.stringify(this.users));
  };

  GSTimesheets.prototype.getByDate = function (date) {
    var self = this;
    return _.map(this.getUsers(), function (username) {
      return self.get(username, date);
    });
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function (username) {
    var sheet = this._getSheet(username, '_設定');
    return DateUtils.parseWday(sheet.getRange("B2").getValue());
  };

  return GSTimesheets;
};

if (typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
// 各モジュールの読み込み
var initLibraries = function initLibraries() {
  if (typeof EventListener === 'undefined') EventListener = loadEventListener();
  if (typeof DateUtils === 'undefined') DateUtils = loadDateUtils();
  if (typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  if (typeof GSProperties === 'undefined') GSProperties = loadGSProperties();
  if (typeof GSTemplate === 'undefined') GSTemplate = loadGSTemplate();
  if (typeof GSTimesheets === 'undefined') GSTimesheets = loadGSTimesheets();
  if (typeof Timesheets === 'undefined') Timesheets = loadTimesheets();
  if (typeof Slack === 'undefined') Slack = loadSlack();
  if (typeof Api === 'undefined') Api = loadApi();
};

var init = function init() {
  var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'slack';

  initLibraries();

  var global_settings = new GASProperties();

  var spreadsheetId = global_settings.get('spreadsheet');
  if (spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var settings = new GSProperties(spreadsheet);
    var template = new GSTemplate(spreadsheet);
    var storage = new GSTimesheets(spreadsheet, settings, global_settings);
    var slack = new Slack(settings.get('Slack Incoming URL'), template, settings);
    var api = new Api(slack, storage, template, settings, global_settings);
    var auth = new Auth(global_settings);
    var receiver = function () {
      switch (mode) {
        case 'slack':
          return slack;
        case 'api':
          return api;
        case 'auth':
          return auth;
      }
    }();
    if (mode === 'auth') return { receiver: receiver, storage: storage };
    var timesheets = new Timesheets(storage, settings, receiver);
    return { receiver: receiver, timesheets: timesheets, storage: storage };
  }
  return null;
};

// SlackのOutgoingから来るメッセージ
function doPost(e) {
  var mode = function () {
    if (e.parameter.command == null) {
      return 'slack';
    } else if (['generateAccessToken', 'getUserInformation'].indexOf(e.parameter.command) >= 0) {
      return 'auth';
    } else {
      return 'api';
    }
  }();
  var miyamoto = init(mode);
  return miyamoto.receiver.receiveMessage(e.parameter);
}

function doGet(e) {
  var miyamoto = init('auth');
  return miyamoto.receiver.receiveMessage(e.parameter);
}

// Time-based triggerで実行
function confirmSignIn() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignIn();
}

// Time-based triggerで実行
function confirmSignOut() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignOut();
}

// 初期化する
function setUp() {
  initLibraries();

  // spreadsheetが無かったら初期化
  var global_settings = new GASProperties();
  if (!global_settings.get('spreadsheet')) {

    // タイムシートを作る
    var spreadsheet = createSpreadsheetInMasterFolder(DriveApp.getFileById(ScriptApp.getScriptId()).getName());
    var sheets = spreadsheet.getSheets();
    if (sheets.length == 1 && sheets[0].getLastRow() == 0) {
      sheets[0].setName('_設定');
    }
    global_settings.set('spreadsheet', spreadsheet.getId());

    var settings = new GSProperties(spreadsheet);
    settings.set('Slack Incoming URL', '');
    settings.setNote('Slack Incoming URL', 'Slackのincoming URLを入力してください');
    settings.set('開始日', DateUtils.format("Y-m-d", DateUtils.now()));
    settings.setNote('開始日', '変更はしないでください');
    settings.set('無視するユーザ', 'miyamoto,hubot,slackbot,incoming-webhook');
    settings.setNote('無視するユーザ', '反応をしないユーザを,区切りで設定する。botは必ず指定してください。');
    settings.set('休憩時間', '1:30:00');
    settings.setNote('休憩時間', '勤務時間からデフォルトで差し引かれる休憩時間を入力してください');
    settings.set('丸め単位（分）', '30');
    settings.setNote('丸め単位（分）', '出退勤時刻の丸め単位を分単位で入力してください');
    settings.set('管理者メールアドレス', 'taimei@arsaga.jp');
    settings.setNote('管理者メールアドレス', 'ファイルのオーナーになるユーザーのメールアドレスを入力してください');

    // 休日を設定 (iCal)
    var calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
    var calendar = CalendarApp.getCalendarById(calendarId);
    var startDate = DateUtils.now();
    var endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth());
    var holidays = _.map(calendar.getEvents(startDate, endDate), function (ev) {
      return DateUtils.format("Y-m-d", ev.getAllDayStartDate());
    });
    settings.set('休日', holidays.join(', '));
    settings.setNote('休日', '日付を,区切りで。来年までは自動設定されているので、以後は適当に更新してください');

    // メッセージ用のシートを作成
    new GSTemplate(spreadsheet);

    // 毎日12時頃に出勤してるかチェックする
    ScriptApp.newTrigger('confirmSignIn').timeBased().everyDays(1).atHour(12).create();

    // 毎日23時45分頃に退勤してるかチェックする
    ScriptApp.newTrigger('confirmSignOut').timeBased().everyDays(1).atHour(23).nearMinute(45).create();
  }
}

function createSpreadsheetInMasterFolder(name) {
  var spreadsheet = SpreadsheetApp.create(name);
  moveSpreadsheetToFolder(spreadsheet, getMasterFolder());
  return spreadsheet;
}

function getMasterFolder() {
  var script_id = ScriptApp.getScriptId();
  return DriveApp.getFileById(script_id).getParents().next();
}

function moveSpreadsheetToFolder(spreadsheet, folder) {
  var ss_file = DriveApp.getFileById(spreadsheet.getId());
  folder.addFile(ss_file);
  DriveApp.getRootFolder().removeFile(ss_file);
}

/* バージョンアップ処理を行う */
function migrate() {
  if (typeof GASProperties === 'undefined') GASProperties = loadGASProperties();

  var global_settings = new GASProperties();
  global_settings.set('version', "::VERSION::");
  console.log("バージョンアップが完了しました。");
}

/*
function test1(e) {
  var miyamoto = init();
  miyamoto.receiver.receiveMessage({user_name:"masuidrive", text:"hello 8:00"});
}
*/
// Slackのインタフェース
// Slack = loadSlack();

loadSlack = function loadSlack() {
  var Slack = function Slack(incomingURL, template, settings) {
    EventListener.apply(this);
    this.incomingURL = incomingURL;
    this._template = template;
    this.settings = settings;
    this.via = 'Slack';
  };

  if (typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Slack.prototype, EventListener.prototype);

  // 受信したメッセージをtimesheetsに投げる
  Slack.prototype.receiveMessage = function (message) {
    var username = String(message.user_name);
    var body = String(message['text']);

    // 特定のアカウントには反応しない
    var ignore_users = (this.settings.get("無視するユーザ") || '').toLowerCase().replace(/^\s*(.*?)\s*$/, "$1").split(/\s*,\s*/);
    if (_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if (body.match(/^-/)) return;

    this.fireEvent('receiveMessage', username, body);
  };

  // メッセージ送信
  Slack.prototype.send = function (message, options) {
    options = _.clone(options || {});
    options["text"] = message;

    var send_options = {
      method: "post",
      payload: { "payload": JSON.stringify(options) }
    };

    if (this.incomingURL) {
      UrlFetchApp.fetch(this.incomingURL, send_options);
    }

    return message;
  };

  // テンプレート付きでメッセージ送信
  Slack.prototype.template = function () {
    this.send(this._template.template.apply(this._template, arguments));
  };

  return Slack;
};

if (typeof exports !== 'undefined') {
  exports.Slack = loadSlack();
}
// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadTimesheets = function loadTimesheets(exports) {
  var Timesheets = function Timesheets(storage, settings, responder) {
    this.storage = storage;
    this.responder = responder;
    this.settings = settings;

    var self = this;
    this.responder.on('receiveMessage', function (username, message) {
      self.receiveMessage(username, message);
    });
  };

  // メッセージを受信する
  Timesheets.prototype.receiveMessage = function (username, message) {
    // 日付は先に処理しておく
    // this.date = DateUtils.parseDate(message);
    // this.time = DateUtils.parseTime(message);
    this.date = DateUtils.parseDate('');
    this.time = DateUtils.parseTime('');
    this.datetime = DateUtils.normalizeDateTime(this.date, this.time);
    if (this.datetime !== null) {
      this.dateStr = DateUtils.format("Y/m/d", this.datetime);
      this.datetimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
    }

    // コマンド集
    var commands = [['actionSignOut', /(バ[ー〜ァ]*イ|ば[ー〜ぁ]*い|おやすみ|お[つっ]ー|おつ|さらば|お先|お疲|帰|乙|bye|night|(c|see)\s*(u|you)|退勤|ごきげんよ|グ[ッ]?バイ)/i], ['actionWhoIsOff', /(だれ|誰|who\s*is).*(休|やす(ま|み|む))/i], ['actionWhoIsIn', /(だれ|誰|who\s*is)/i], ['actionCancelOff', /(休|やす(ま|み|む)|休暇).*(キャンセル|消|止|やめ|ません)/i], ['actionOff', /(休|やす(ま|み|む)|休暇)/i], ['actionSignIn', /(モ[ー〜]+ニン|も[ー〜]+にん|おっは|おは|お早|へろ|はろ|ヘロ|ハロ|hi|hello|morning|出勤)/i], ['getStatus', /__getStatus__/], ['confirmSignIn', /__confirmSignIn__/], ['confirmSignOut', /__confirmSignOut__/]];

    // メッセージを元にメソッドを探す
    var command = _.find(commands, function (ary) {
      return ary && message.match(ary[1]);
    });

    // メッセージを実行
    if (command && this[command[0]]) {
      return this[command[0]](username, message);
    }
    this.responder.result = {
      code: 400,
      message: 'Command not found.',
      username: username,
      datetime: this.datetime
    };
  };

  // 出勤
  Timesheets.prototype.actionSignIn = function (username, message) {
    if (this.datetime) {
      var signInTimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
      var data = this.storage.get(username, this.datetime);
      if (!data.signIn || data.signIn === '-') {
        this.storage.set(username, this.datetime, { signIn: this.datetime, via: this.responder.via });
        this.responder.template("出勤", username, signInTimeStr);
      } else {
        // 更新の場合は時間を明示する必要がある
        if (!!this.time) {
          // this.storage.set(username, this.datetime, { signIn: this.datetime, via: this.responder.via });
          // this.responder.template("出勤更新", username, signInTimeStr);
        } else {
          this.responder.result = {
            code: 400,
            message: 'Already signed in.',
            status: 'signedIn',
            username: username,
            datetime: this.datetime
          };
        }
      }
    }
  };

  // 退勤
  Timesheets.prototype.actionSignOut = function (username, message) {
    if (this.datetime) {
      var signOutTimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
      var data = this.storage.get(username, this.datetime);
      var rest = DateUtils.parseTime(this.settings.get('休憩時間'));
      var rest_string = rest[0] + ':' + rest[1] + ':00';
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, this.datetime, { signOut: this.datetime, rest: rest_string, via: this.responder.via });
        this.responder.template("退勤", username, signOutTimeStr);
      } else {
        // 更新の場合は時間を明示する必要がある
        if (!!this.time) {
          // this.storage.set(username, this.datetime, { signOut: this.datetime, rest: rest_string, via: this.responder.via });
          // this.responder.template("退勤更新", username, signOutTimeStr);
        } else {
          this.responder.result = {
            code: 400,
            message: 'Already signed out.',
            status: 'signedOut',
            username: username,
            datetime: this.datetime
          };
        }
      }
    }
  };

  // 休暇申請
  Timesheets.prototype.actionOff = function (username, message) {
    if (this.date) {
      var dateObj = new Date(this.date[0], this.date[1] - 1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, { signIn: '-', signOut: '-', note: message, via: this.responder.via });
        this.responder.template("休暇", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 休暇取消
  Timesheets.prototype.actionCancelOff = function (username, message) {
    if (this.date) {
      var dateObj = new Date(this.date[0], this.date[1] - 1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if (!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, { signIn: null, signOut: null, note: message, via: this.responder.via });
        this.responder.template("休暇取消", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 出勤中
  Timesheets.prototype.actionWhoIsIn = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if (_.isEmpty(result)) {
      this.responder.template("出勤なし");
    } else {
      this.responder.template("出勤中", result.sort().join(', '));
    }
  };

  // 休暇中
  Timesheets.prototype.actionWhoIsOff = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var dateStr = DateUtils.format("Y/m/d", dateObj);
    var result = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return row.signIn === '-' ? row.user : undefined;
    }));

    // 定休の処理
    var wday = dateObj.getDay();
    var self = this;
    _.each(this.storage.getUsers(), function (username) {
      if (_.contains(self.storage.getDayOff(username), wday)) {
        result.push(username);
      }
    });
    result = _.uniq(result);

    if (_.isEmpty(result)) {
      this.responder.template("休暇なし", dateStr);
    } else {
      this.responder.template("休暇中", dateStr, result.sort().join(', '));
    }
  };

  Timesheets.prototype.getStatus = function (username, message) {
    var datetime = DateUtils.now();
    var user_row = this.storage.get(username, datetime);

    var status = '';
    if (user_row.signIn == null) {
      status = 'notSignedIn';
    } else if (user_row.signOut == null) {
      status = 'signedIn';
    } else {
      status = 'signedOut';
    }

    this.responder.result = { code: 200, status: status, username: username, datetime: datetime };
    return status;
  };

  // 出勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignIn = function (username, message) {
    var self = this;
    var holidays = _.compact(_.map((this.settings.get("休日") || "").split(','), function (s) {
      var date = DateUtils.parseDateTime(s);
      return date ? DateUtils.format("Y/m/d", date) : undefined;
    }));
    var today = DateUtils.toDate(DateUtils.now());

    // 休日ならチェックしない
    if (_.contains(holidays, DateUtils.format("Y/m/d", today))) return;

    var wday = DateUtils.now().getDay();
    var signedInUsers = _.compact(_.map(this.storage.getByDate(today), function (row) {
      var signedIn = _.isDate(row.signIn);
      var off = row.signIn === '-' || _.contains(self.storage.getDayOff(row.user), wday);
      return signedIn || off ? row.user : undefined;
    }));
    var users = _.difference(this.storage.getUsers(), signedInUsers);

    if (!_.isEmpty(users)) {
      this.responder.template("出勤確認", users.sort());
    }

    // バージョンチェックを行う
    // どのみち更新止まっているのでバージョンチェックは削除
    // if(typeof checkUpdate == 'function') checkUpdate(this.responder);
  };

  // 退勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignOut = function (username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var users = _.compact(_.map(this.storage.getByDate(dateObj), function (row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if (!_.isEmpty(users)) {
      this.responder.template("退勤確認", users.sort());
    }
  };

  return Timesheets;
};

if (typeof exports !== 'undefined') {
  exports.Timesheets = loadTimesheets();
}
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function () {
  var n = this,
      t = n._,
      r = Array.prototype,
      e = Object.prototype,
      u = Function.prototype,
      i = r.push,
      a = r.slice,
      o = r.concat,
      l = e.toString,
      c = e.hasOwnProperty,
      f = Array.isArray,
      s = Object.keys,
      p = u.bind,
      h = function h(n) {
    return n instanceof h ? n : this instanceof h ? void (this._wrapped = n) : new h(n);
  };"undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = h), exports._ = h) : n._ = h, h.VERSION = "1.7.0";var g = function g(n, t, r) {
    if (t === void 0) return n;switch (null == r ? 3 : r) {case 1:
        return function (r) {
          return n.call(t, r);
        };case 2:
        return function (r, e) {
          return n.call(t, r, e);
        };case 3:
        return function (r, e, u) {
          return n.call(t, r, e, u);
        };case 4:
        return function (r, e, u, i) {
          return n.call(t, r, e, u, i);
        };}return function () {
      return n.apply(t, arguments);
    };
  };h.iteratee = function (n, t, r) {
    return null == n ? h.identity : h.isFunction(n) ? g(n, t, r) : h.isObject(n) ? h.matches(n) : h.property(n);
  }, h.each = h.forEach = function (n, t, r) {
    if (null == n) return n;t = g(t, r);var e,
        u = n.length;if (u === +u) for (e = 0; u > e; e++) {
      t(n[e], e, n);
    } else {
      var i = h.keys(n);for (e = 0, u = i.length; u > e; e++) {
        t(n[i[e]], i[e], n);
      }
    }return n;
  }, h.map = h.collect = function (n, t, r) {
    if (null == n) return [];t = h.iteratee(t, r);for (var e, u = n.length !== +n.length && h.keys(n), i = (u || n).length, a = Array(i), o = 0; i > o; o++) {
      e = u ? u[o] : o, a[o] = t(n[e], e, n);
    }return a;
  };var v = "Reduce of empty array with no initial value";h.reduce = h.foldl = h.inject = function (n, t, r, e) {
    null == n && (n = []), t = g(t, e, 4);var u,
        i = n.length !== +n.length && h.keys(n),
        a = (i || n).length,
        o = 0;if (arguments.length < 3) {
      if (!a) throw new TypeError(v);r = n[i ? i[o++] : o++];
    }for (; a > o; o++) {
      u = i ? i[o] : o, r = t(r, n[u], u, n);
    }return r;
  }, h.reduceRight = h.foldr = function (n, t, r, e) {
    null == n && (n = []), t = g(t, e, 4);var u,
        i = n.length !== +n.length && h.keys(n),
        a = (i || n).length;if (arguments.length < 3) {
      if (!a) throw new TypeError(v);r = n[i ? i[--a] : --a];
    }for (; a--;) {
      u = i ? i[a] : a, r = t(r, n[u], u, n);
    }return r;
  }, h.find = h.detect = function (n, t, r) {
    var e;return t = h.iteratee(t, r), h.some(n, function (n, r, u) {
      return t(n, r, u) ? (e = n, !0) : void 0;
    }), e;
  }, h.filter = h.select = function (n, t, r) {
    var e = [];return null == n ? e : (t = h.iteratee(t, r), h.each(n, function (n, r, u) {
      t(n, r, u) && e.push(n);
    }), e);
  }, h.reject = function (n, t, r) {
    return h.filter(n, h.negate(h.iteratee(t)), r);
  }, h.every = h.all = function (n, t, r) {
    if (null == n) return !0;t = h.iteratee(t, r);var e,
        u,
        i = n.length !== +n.length && h.keys(n),
        a = (i || n).length;for (e = 0; a > e; e++) {
      if (u = i ? i[e] : e, !t(n[u], u, n)) return !1;
    }return !0;
  }, h.some = h.any = function (n, t, r) {
    if (null == n) return !1;t = h.iteratee(t, r);var e,
        u,
        i = n.length !== +n.length && h.keys(n),
        a = (i || n).length;for (e = 0; a > e; e++) {
      if (u = i ? i[e] : e, t(n[u], u, n)) return !0;
    }return !1;
  }, h.contains = h.include = function (n, t) {
    return null == n ? !1 : (n.length !== +n.length && (n = h.values(n)), h.indexOf(n, t) >= 0);
  }, h.invoke = function (n, t) {
    var r = a.call(arguments, 2),
        e = h.isFunction(t);return h.map(n, function (n) {
      return (e ? t : n[t]).apply(n, r);
    });
  }, h.pluck = function (n, t) {
    return h.map(n, h.property(t));
  }, h.where = function (n, t) {
    return h.filter(n, h.matches(t));
  }, h.findWhere = function (n, t) {
    return h.find(n, h.matches(t));
  }, h.max = function (n, t, r) {
    var e,
        u,
        i = -1 / 0,
        a = -1 / 0;if (null == t && null != n) {
      n = n.length === +n.length ? n : h.values(n);for (var o = 0, l = n.length; l > o; o++) {
        e = n[o], e > i && (i = e);
      }
    } else t = h.iteratee(t, r), h.each(n, function (n, r, e) {
      u = t(n, r, e), (u > a || u === -1 / 0 && i === -1 / 0) && (i = n, a = u);
    });return i;
  }, h.min = function (n, t, r) {
    var e,
        u,
        i = 1 / 0,
        a = 1 / 0;if (null == t && null != n) {
      n = n.length === +n.length ? n : h.values(n);for (var o = 0, l = n.length; l > o; o++) {
        e = n[o], i > e && (i = e);
      }
    } else t = h.iteratee(t, r), h.each(n, function (n, r, e) {
      u = t(n, r, e), (a > u || 1 / 0 === u && 1 / 0 === i) && (i = n, a = u);
    });return i;
  }, h.shuffle = function (n) {
    for (var t, r = n && n.length === +n.length ? n : h.values(n), e = r.length, u = Array(e), i = 0; e > i; i++) {
      t = h.random(0, i), t !== i && (u[i] = u[t]), u[t] = r[i];
    }return u;
  }, h.sample = function (n, t, r) {
    return null == t || r ? (n.length !== +n.length && (n = h.values(n)), n[h.random(n.length - 1)]) : h.shuffle(n).slice(0, Math.max(0, t));
  }, h.sortBy = function (n, t, r) {
    return t = h.iteratee(t, r), h.pluck(h.map(n, function (n, r, e) {
      return { value: n, index: r, criteria: t(n, r, e) };
    }).sort(function (n, t) {
      var r = n.criteria,
          e = t.criteria;if (r !== e) {
        if (r > e || r === void 0) return 1;if (e > r || e === void 0) return -1;
      }return n.index - t.index;
    }), "value");
  };var m = function m(n) {
    return function (t, r, e) {
      var u = {};return r = h.iteratee(r, e), h.each(t, function (e, i) {
        var a = r(e, i, t);n(u, e, a);
      }), u;
    };
  };h.groupBy = m(function (n, t, r) {
    h.has(n, r) ? n[r].push(t) : n[r] = [t];
  }), h.indexBy = m(function (n, t, r) {
    n[r] = t;
  }), h.countBy = m(function (n, t, r) {
    h.has(n, r) ? n[r]++ : n[r] = 1;
  }), h.sortedIndex = function (n, t, r, e) {
    r = h.iteratee(r, e, 1);for (var u = r(t), i = 0, a = n.length; a > i;) {
      var o = i + a >>> 1;r(n[o]) < u ? i = o + 1 : a = o;
    }return i;
  }, h.toArray = function (n) {
    return n ? h.isArray(n) ? a.call(n) : n.length === +n.length ? h.map(n, h.identity) : h.values(n) : [];
  }, h.size = function (n) {
    return null == n ? 0 : n.length === +n.length ? n.length : h.keys(n).length;
  }, h.partition = function (n, t, r) {
    t = h.iteratee(t, r);var e = [],
        u = [];return h.each(n, function (n, r, i) {
      (t(n, r, i) ? e : u).push(n);
    }), [e, u];
  }, h.first = h.head = h.take = function (n, t, r) {
    return null == n ? void 0 : null == t || r ? n[0] : 0 > t ? [] : a.call(n, 0, t);
  }, h.initial = function (n, t, r) {
    return a.call(n, 0, Math.max(0, n.length - (null == t || r ? 1 : t)));
  }, h.last = function (n, t, r) {
    return null == n ? void 0 : null == t || r ? n[n.length - 1] : a.call(n, Math.max(n.length - t, 0));
  }, h.rest = h.tail = h.drop = function (n, t, r) {
    return a.call(n, null == t || r ? 1 : t);
  }, h.compact = function (n) {
    return h.filter(n, h.identity);
  };var y = function y(n, t, r, e) {
    if (t && h.every(n, h.isArray)) return o.apply(e, n);for (var u = 0, a = n.length; a > u; u++) {
      var l = n[u];h.isArray(l) || h.isArguments(l) ? t ? i.apply(e, l) : y(l, t, r, e) : r || e.push(l);
    }return e;
  };h.flatten = function (n, t) {
    return y(n, t, !1, []);
  }, h.without = function (n) {
    return h.difference(n, a.call(arguments, 1));
  }, h.uniq = h.unique = function (n, t, r, e) {
    if (null == n) return [];h.isBoolean(t) || (e = r, r = t, t = !1), null != r && (r = h.iteratee(r, e));for (var u = [], i = [], a = 0, o = n.length; o > a; a++) {
      var l = n[a];if (t) a && i === l || u.push(l), i = l;else if (r) {
        var c = r(l, a, n);h.indexOf(i, c) < 0 && (i.push(c), u.push(l));
      } else h.indexOf(u, l) < 0 && u.push(l);
    }return u;
  }, h.union = function () {
    return h.uniq(y(arguments, !0, !0, []));
  }, h.intersection = function (n) {
    if (null == n) return [];for (var t = [], r = arguments.length, e = 0, u = n.length; u > e; e++) {
      var i = n[e];if (!h.contains(t, i)) {
        for (var a = 1; r > a && h.contains(arguments[a], i); a++) {}a === r && t.push(i);
      }
    }return t;
  }, h.difference = function (n) {
    var t = y(a.call(arguments, 1), !0, !0, []);return h.filter(n, function (n) {
      return !h.contains(t, n);
    });
  }, h.zip = function (n) {
    if (null == n) return [];for (var t = h.max(arguments, "length").length, r = Array(t), e = 0; t > e; e++) {
      r[e] = h.pluck(arguments, e);
    }return r;
  }, h.object = function (n, t) {
    if (null == n) return {};for (var r = {}, e = 0, u = n.length; u > e; e++) {
      t ? r[n[e]] = t[e] : r[n[e][0]] = n[e][1];
    }return r;
  }, h.indexOf = function (n, t, r) {
    if (null == n) return -1;var e = 0,
        u = n.length;if (r) {
      if ("number" != typeof r) return e = h.sortedIndex(n, t), n[e] === t ? e : -1;e = 0 > r ? Math.max(0, u + r) : r;
    }for (; u > e; e++) {
      if (n[e] === t) return e;
    }return -1;
  }, h.lastIndexOf = function (n, t, r) {
    if (null == n) return -1;var e = n.length;for ("number" == typeof r && (e = 0 > r ? e + r + 1 : Math.min(e, r + 1)); --e >= 0;) {
      if (n[e] === t) return e;
    }return -1;
  }, h.range = function (n, t, r) {
    arguments.length <= 1 && (t = n || 0, n = 0), r = r || 1;for (var e = Math.max(Math.ceil((t - n) / r), 0), u = Array(e), i = 0; e > i; i++, n += r) {
      u[i] = n;
    }return u;
  };var d = function d() {};h.bind = function (n, t) {
    var r, _e;if (p && n.bind === p) return p.apply(n, a.call(arguments, 1));if (!h.isFunction(n)) throw new TypeError("Bind must be called on a function");return r = a.call(arguments, 2), _e = function e() {
      if (!(this instanceof _e)) return n.apply(t, r.concat(a.call(arguments)));d.prototype = n.prototype;var u = new d();d.prototype = null;var i = n.apply(u, r.concat(a.call(arguments)));return h.isObject(i) ? i : u;
    };
  }, h.partial = function (n) {
    var t = a.call(arguments, 1);return function () {
      for (var r = 0, e = t.slice(), u = 0, i = e.length; i > u; u++) {
        e[u] === h && (e[u] = arguments[r++]);
      }for (; r < arguments.length;) {
        e.push(arguments[r++]);
      }return n.apply(this, e);
    };
  }, h.bindAll = function (n) {
    var t,
        r,
        e = arguments.length;if (1 >= e) throw new Error("bindAll must be passed function names");for (t = 1; e > t; t++) {
      r = arguments[t], n[r] = h.bind(n[r], n);
    }return n;
  }, h.memoize = function (n, t) {
    var r = function r(e) {
      var u = r.cache,
          i = t ? t.apply(this, arguments) : e;return h.has(u, i) || (u[i] = n.apply(this, arguments)), u[i];
    };return r.cache = {}, r;
  }, h.delay = function (n, t) {
    var r = a.call(arguments, 2);return setTimeout(function () {
      return n.apply(null, r);
    }, t);
  }, h.defer = function (n) {
    return h.delay.apply(h, [n, 1].concat(a.call(arguments, 1)));
  }, h.throttle = function (n, t, r) {
    var e,
        u,
        i,
        a = null,
        o = 0;r || (r = {});var l = function l() {
      o = r.leading === !1 ? 0 : h.now(), a = null, i = n.apply(e, u), a || (e = u = null);
    };return function () {
      var c = h.now();o || r.leading !== !1 || (o = c);var f = t - (c - o);return e = this, u = arguments, 0 >= f || f > t ? (clearTimeout(a), a = null, o = c, i = n.apply(e, u), a || (e = u = null)) : a || r.trailing === !1 || (a = setTimeout(l, f)), i;
    };
  }, h.debounce = function (n, t, r) {
    var e,
        u,
        i,
        a,
        o,
        l = function l() {
      var c = h.now() - a;t > c && c > 0 ? e = setTimeout(l, t - c) : (e = null, r || (o = n.apply(i, u), e || (i = u = null)));
    };return function () {
      i = this, u = arguments, a = h.now();var c = r && !e;return e || (e = setTimeout(l, t)), c && (o = n.apply(i, u), i = u = null), o;
    };
  }, h.wrap = function (n, t) {
    return h.partial(t, n);
  }, h.negate = function (n) {
    return function () {
      return !n.apply(this, arguments);
    };
  }, h.compose = function () {
    var n = arguments,
        t = n.length - 1;return function () {
      for (var r = t, e = n[t].apply(this, arguments); r--;) {
        e = n[r].call(this, e);
      }return e;
    };
  }, h.after = function (n, t) {
    return function () {
      return --n < 1 ? t.apply(this, arguments) : void 0;
    };
  }, h.before = function (n, t) {
    var r;return function () {
      return --n > 0 ? r = t.apply(this, arguments) : t = null, r;
    };
  }, h.once = h.partial(h.before, 2), h.keys = function (n) {
    if (!h.isObject(n)) return [];if (s) return s(n);var t = [];for (var r in n) {
      h.has(n, r) && t.push(r);
    }return t;
  }, h.values = function (n) {
    for (var t = h.keys(n), r = t.length, e = Array(r), u = 0; r > u; u++) {
      e[u] = n[t[u]];
    }return e;
  }, h.pairs = function (n) {
    for (var t = h.keys(n), r = t.length, e = Array(r), u = 0; r > u; u++) {
      e[u] = [t[u], n[t[u]]];
    }return e;
  }, h.invert = function (n) {
    for (var t = {}, r = h.keys(n), e = 0, u = r.length; u > e; e++) {
      t[n[r[e]]] = r[e];
    }return t;
  }, h.functions = h.methods = function (n) {
    var t = [];for (var r in n) {
      h.isFunction(n[r]) && t.push(r);
    }return t.sort();
  }, h.extend = function (n) {
    if (!h.isObject(n)) return n;for (var t, r, e = 1, u = arguments.length; u > e; e++) {
      t = arguments[e];for (r in t) {
        c.call(t, r) && (n[r] = t[r]);
      }
    }return n;
  }, h.pick = function (n, t, r) {
    var e,
        u = {};if (null == n) return u;if (h.isFunction(t)) {
      t = g(t, r);for (e in n) {
        var i = n[e];t(i, e, n) && (u[e] = i);
      }
    } else {
      var l = o.apply([], a.call(arguments, 1));n = new Object(n);for (var c = 0, f = l.length; f > c; c++) {
        e = l[c], e in n && (u[e] = n[e]);
      }
    }return u;
  }, h.omit = function (n, t, r) {
    if (h.isFunction(t)) t = h.negate(t);else {
      var e = h.map(o.apply([], a.call(arguments, 1)), String);t = function t(n, _t) {
        return !h.contains(e, _t);
      };
    }return h.pick(n, t, r);
  }, h.defaults = function (n) {
    if (!h.isObject(n)) return n;for (var t = 1, r = arguments.length; r > t; t++) {
      var e = arguments[t];for (var u in e) {
        n[u] === void 0 && (n[u] = e[u]);
      }
    }return n;
  }, h.clone = function (n) {
    return h.isObject(n) ? h.isArray(n) ? n.slice() : h.extend({}, n) : n;
  }, h.tap = function (n, t) {
    return t(n), n;
  };var b = function b(n, t, r, e) {
    if (n === t) return 0 !== n || 1 / n === 1 / t;if (null == n || null == t) return n === t;n instanceof h && (n = n._wrapped), t instanceof h && (t = t._wrapped);var u = l.call(n);if (u !== l.call(t)) return !1;switch (u) {case "[object RegExp]":case "[object String]":
        return "" + n == "" + t;case "[object Number]":
        return +n !== +n ? +t !== +t : 0 === +n ? 1 / +n === 1 / t : +n === +t;case "[object Date]":case "[object Boolean]":
        return +n === +t;}if ("object" != (typeof n === "undefined" ? "undefined" : _typeof(n)) || "object" != (typeof t === "undefined" ? "undefined" : _typeof(t))) return !1;for (var i = r.length; i--;) {
      if (r[i] === n) return e[i] === t;
    }var a = n.constructor,
        o = t.constructor;if (a !== o && "constructor" in n && "constructor" in t && !(h.isFunction(a) && a instanceof a && h.isFunction(o) && o instanceof o)) return !1;r.push(n), e.push(t);var c, f;if ("[object Array]" === u) {
      if (c = n.length, f = c === t.length) for (; c-- && (f = b(n[c], t[c], r, e));) {}
    } else {
      var s,
          p = h.keys(n);if (c = p.length, f = h.keys(t).length === c) for (; c-- && (s = p[c], f = h.has(t, s) && b(n[s], t[s], r, e));) {}
    }return r.pop(), e.pop(), f;
  };h.isEqual = function (n, t) {
    return b(n, t, [], []);
  }, h.isEmpty = function (n) {
    if (null == n) return !0;if (h.isArray(n) || h.isString(n) || h.isArguments(n)) return 0 === n.length;for (var t in n) {
      if (h.has(n, t)) return !1;
    }return !0;
  }, h.isElement = function (n) {
    return !(!n || 1 !== n.nodeType);
  }, h.isArray = f || function (n) {
    return "[object Array]" === l.call(n);
  }, h.isObject = function (n) {
    var t = typeof n === "undefined" ? "undefined" : _typeof(n);return "function" === t || "object" === t && !!n;
  }, h.each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (n) {
    h["is" + n] = function (t) {
      return l.call(t) === "[object " + n + "]";
    };
  }), h.isArguments(arguments) || (h.isArguments = function (n) {
    return h.has(n, "callee");
  }), "function" != typeof /./ && (h.isFunction = function (n) {
    return "function" == typeof n || !1;
  }), h.isFinite = function (n) {
    return isFinite(n) && !isNaN(parseFloat(n));
  }, h.isNaN = function (n) {
    return h.isNumber(n) && n !== +n;
  }, h.isBoolean = function (n) {
    return n === !0 || n === !1 || "[object Boolean]" === l.call(n);
  }, h.isNull = function (n) {
    return null === n;
  }, h.isUndefined = function (n) {
    return n === void 0;
  }, h.has = function (n, t) {
    return null != n && c.call(n, t);
  }, h.noConflict = function () {
    return n._ = t, this;
  }, h.identity = function (n) {
    return n;
  }, h.constant = function (n) {
    return function () {
      return n;
    };
  }, h.noop = function () {}, h.property = function (n) {
    return function (t) {
      return t[n];
    };
  }, h.matches = function (n) {
    var t = h.pairs(n),
        r = t.length;return function (n) {
      if (null == n) return !r;n = new Object(n);for (var e = 0; r > e; e++) {
        var u = t[e],
            i = u[0];if (u[1] !== n[i] || !(i in n)) return !1;
      }return !0;
    };
  }, h.times = function (n, t, r) {
    var e = Array(Math.max(0, n));t = g(t, r, 1);for (var u = 0; n > u; u++) {
      e[u] = t(u);
    }return e;
  }, h.random = function (n, t) {
    return null == t && (t = n, n = 0), n + Math.floor(Math.random() * (t - n + 1));
  }, h.now = Date.now || function () {
    return new Date().getTime();
  };var _ = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" },
      w = h.invert(_),
      j = function j(n) {
    var t = function t(_t2) {
      return n[_t2];
    },
        r = "(?:" + h.keys(n).join("|") + ")",
        e = RegExp(r),
        u = RegExp(r, "g");return function (n) {
      return n = null == n ? "" : "" + n, e.test(n) ? n.replace(u, t) : n;
    };
  };h.escape = j(_), h.unescape = j(w), h.result = function (n, t) {
    if (null == n) return void 0;var r = n[t];return h.isFunction(r) ? n[t]() : r;
  };var x = 0;h.uniqueId = function (n) {
    var t = ++x + "";return n ? n + t : t;
  }, h.templateSettings = { evaluate: /<%([\s\S]+?)%>/g, interpolate: /<%=([\s\S]+?)%>/g, escape: /<%-([\s\S]+?)%>/g };var A = /(.)^/,
      k = { "'": "'", "\\": "\\", "\r": "r", "\n": "n", "\u2028": "u2028", "\u2029": "u2029" },
      O = /\\|'|\r|\n|\u2028|\u2029/g,
      F = function F(n) {
    return "\\" + k[n];
  };h.template = function (n, t, r) {
    !t && r && (t = r), t = h.defaults({}, t, h.templateSettings);var e = RegExp([(t.escape || A).source, (t.interpolate || A).source, (t.evaluate || A).source].join("|") + "|$", "g"),
        u = 0,
        i = "__p+='";n.replace(e, function (t, r, e, a, o) {
      return i += n.slice(u, o).replace(O, F), u = o + t.length, r ? i += "'+\n((__t=(" + r + "))==null?'':_.escape(__t))+\n'" : e ? i += "'+\n((__t=(" + e + "))==null?'':__t)+\n'" : a && (i += "';\n" + a + "\n__p+='"), t;
    }), i += "';\n", t.variable || (i = "with(obj||{}){\n" + i + "}\n"), i = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + i + "return __p;\n";try {
      var a = new Function(t.variable || "obj", "_", i);
    } catch (o) {
      throw o.source = i, o;
    }var l = function l(n) {
      return a.call(this, n, h);
    },
        c = t.variable || "obj";return l.source = "function(" + c + "){\n" + i + "}", l;
  }, h.chain = function (n) {
    var t = h(n);return t._chain = !0, t;
  };var E = function E(n) {
    return this._chain ? h(n).chain() : n;
  };h.mixin = function (n) {
    h.each(h.functions(n), function (t) {
      var r = h[t] = n[t];h.prototype[t] = function () {
        var n = [this._wrapped];return i.apply(n, arguments), E.call(this, r.apply(h, n));
      };
    });
  }, h.mixin(h), h.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (n) {
    var t = r[n];h.prototype[n] = function () {
      var r = this._wrapped;return t.apply(r, arguments), "shift" !== n && "splice" !== n || 0 !== r.length || delete r[0], E.call(this, r);
    };
  }), h.each(["concat", "join", "slice"], function (n) {
    var t = r[n];h.prototype[n] = function () {
      return E.call(this, t.apply(this._wrapped, arguments));
    };
  }), h.prototype.value = function () {
    return this._wrapped;
  }, "function" == typeof define && define.amd && define("underscore", [], function () {
    return h;
  });
}).call(this);
//# sourceMappingURL=underscore-min.map
