// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadTimesheets = function (exports) {
  if(typeof exports === 'undefined') exports = {};

  exports.Timesheets = function(storage, settings, responder) {
    this.storage = storage;
    this.settings = settings;
    this.responder = responder;
/*
    this.storage.on('newUser', function(username) {
      responder.template('使い方', username);
    });
*/
  }

  // メッセージを受信する
  exports.Timesheets.prototype.receiveMessage = function(username, message) {
    // -で始まると反応しない
    if(message.match(/^\s*-/)) return;

    // 特定のアカウントには反応しない
    var ignore_users = String(this.settings.get('無視するユーザ')).toLowerCase().trim().split(/\s*,\s*/);
    if(_.contains(ignore_users, username.toLowerCase())) return;

    // コマンド集
    var commands = [
      ['actionOut', /(バ[ー〜ァ]*イ|ば[ー〜ぁ]*い|おやすみ|お[つっ]|お先|お疲|帰|乙|bye|night|(c|see)\s*(u|you)|退勤|ごきげんよう|グッバイ|ばい)/],
      ['actionWhoIsOff', /(だれ|誰|who\s*is).*(休|やす(ま|み|む))/],
      ['actionWhoIsIn', /(だれ|誰|who\s*is)/],
      ['actionCancelOff', /(休|やす(ま|み|む)).*(キャンセル|消|止|やめ|ません)/],
      ['actionOff', /(休|やす(ま|み|む))/],
      ['actionIn', /(モ[ー〜]+ニン|も[ー〜]+にん|おっは|おは|へろ|はろ|ヘロ|ハロ|hi|hello|morning|出勤)/],
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
  exports.Timesheets.prototype.actionIn = function(username, message) {
    var date = DateUtils.parseDate(message, now());
    var time = DateUtils.parseTime(message, now());
console.log("!!!");
console.log(now);
console.log(now());
    var datetime = DateUtils.normalizeDateTime(date, time, now());
    if(datetime) {
//      var result = this.storage.doIn(username, datetime, !!time, message);
      var result = 'ok';
      if(result == 'ok') {
        this.responder.template("出勤", username, Utilities.formatDate(datetime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm"));
      }
      else if(result == 'updated') {
        this.responder.template("出勤更新", username, Utilities.formatDate(datetime, Session.getScriptTimeZone(), "HH:mm"));
      }
    }
    else if(date) {
      this.responder.template("休暇取消", username, Utilities.formatString("%02d/%02d", date[1], date[2]));
    }
  };

  // 退勤
  exports.Timesheets.prototype.actionOut = function(username, message) {
    var date = parseDate(message);
    var time = parseTime(message);
    var datetime = normalizeDateTime(date, time);
    if(datetime) {
      var result = this.storage.doOut(username, datetime, !!time, message);
      if(result == 'ok') {
        this.responder.template("退勤", username, Utilities.formatDate(datetime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm"));
      }
      else if(result == 'updated') {
        this.responder.template("退勤更新", username, Utilities.formatDate(datetime, Session.getScriptTimeZone(), "HH:mm"));
      }
    }
  };

  // 休暇申請
  exports.Timesheets.prototype.actionOff = function(username, message) {
    var date = parseDate(message);
    if(date) {
      var result = this.storage.doOff(username, normalizeDateTime(date, [0,0]), message);
      if(result) {
        this.responder.template("休暇", username, Utilities.formatString("%02d/%02d", date[1], date[2]));
      }
    }
  };

  // 休暇取消
  exports.Timesheets.prototype.actionCancelOff = function(username, message) {
    var date = parseDate(message);
    if(date) {
      var result = this.storage.doCancelOff(username, normalizeDateTime(date, [0,0]), message);
      if(result) {
        this.responder.template("休暇取消", username, Utilities.formatString("%02d/%02d", date[1], date[2]));
      }
    }
  };

  // 出勤中
  exports.Timesheets.prototype.actionWhoIsIn = function(username, message) {
    var result = this.storage.whoIsIn(new Date());
    if(result) {
      this.responder.template("出勤中", result.join(', '));
    }
    else {
      this.responder.template("出勤なし");
    }
  };

  // 休暇中
  exports.Timesheets.prototype.actionWhoIsOff = function(username, message) {
    var date = parseDate(message);
    var datetime = normalizeDateTime(date, [0,0]) || new Date();
    var result = this.storage.whoIsOff(datetime);
    if(result) {
      this.responder.template("休暇中", result.join(', '), Utilities.formatString("%02d/%02d", datetime.getMonth()+1, datetime.getDate()));
    }
    else {
      this.responder.template("休暇なし", Utilities.formatString("%02d/%02d", datetime.getMonth()+1, datetime.getDate()));
    }
  };

  return exports.Timesheets;
};

if(typeof exports !== 'undefined') {
  loadTimesheets(exports);
}
