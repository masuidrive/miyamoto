function createTimesheets(spreadsheetId, responder) {
  loadTimesheets();
  return(new Timesheets(spreadsheetId, responder));
};

function Timesheets(spreadsheetId, responder) {
  loadTimesheets();
  this.spreadsheetId = spreadsheetId;
  this.responder = responder;

  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  this.settings = createSettings(this.spreadsheetId);
  this.storage = createSpreadsheetStorage(this.spreadsheetId, this.settings);
  this.storage.on('newUser', function(username) {
    responder.template('使い方', username);
  });
}

loadTimesheets = function() {
  loadTimesheets = function(){};

  // メッセージを受信する
  Timesheets.prototype.receiveMessage = function(username, message) {
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
  Timesheets.prototype.actionIn = function(username, message) {
    var date = parseDate(message);
    var time = parseTime(message);
    var datetime = normalizeDateTime(date, time);
    if(datetime) {
      var result = this.storage.doIn(username, datetime, !!time, message);
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
  Timesheets.prototype.actionOut = function(username, message) {
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
  Timesheets.prototype.actionOff = function(username, message) {
    var date = parseDate(message);
    if(date) {
      var result = this.storage.doOff(username, normalizeDateTime(date, [0,0]), message);
      if(result) {
        this.responder.template("休暇", username, Utilities.formatString("%02d/%02d", date[1], date[2]));
      }
    }
  };

  // 休暇取消
  Timesheets.prototype.actionCancelOff = function(username, message) {
    var date = parseDate(message);
    if(date) {
      var result = this.storage.doCancelOff(username, normalizeDateTime(date, [0,0]), message);
      if(result) {
        this.responder.template("休暇取消", username, Utilities.formatString("%02d/%02d", date[1], date[2]));
      }
    }
  };

  // 出勤中
  Timesheets.prototype.actionWhoIsIn = function(username, message) {
    var result = this.storage.whoIsIn(new Date());
    if(result) {
      this.responder.template("出勤中", result.join(', '));
    }
    else {
      this.responder.template("出勤なし");
    }
  };

  // 休暇中
  Timesheets.prototype.actionWhoIsOff = function(username, message) {
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
};

function testReceiveMessage() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheet');
  var responder = createSlackResponder(spreadsheetId);
  var timesheets = createTimesheets(spreadsheetId, responder);

  timesheets.receiveMessage('test1', 'おはよう');
  timesheets.receiveMessage('test1', 'おはよう 12:00');
  timesheets.receiveMessage('test1', 'おつ');
  timesheets.receiveMessage('test1', 'おつ 14:00');
  timesheets.receiveMessage('test1', '明日はお休みです');
  timesheets.receiveMessage('test1', '明日のお休みを取り消します');
  timesheets.receiveMessage('test1', '明日はやっぱり出勤します');
  timesheets.receiveMessage('test1', '10/1はお休みです');

  timesheets.receiveMessage('test1', '誰がいる？');
  timesheets.receiveMessage('test1', '誰がお休み？');
  timesheets.receiveMessage('test1', '9/21 誰がお休み？');
  timesheets.receiveMessage('test1', '9/22 誰がお休み？');
  timesheets.receiveMessage('test1', '9/23 誰がお休み？');


  timesheets.receiveMessage('test1', 'おはよう 10/2 10:00');
  timesheets.receiveMessage('test1', 'おつ 10/3 4:00');

  // 無視される
  timesheets.receiveMessage('Slackbot', 'おはよう 10/1 10:00');
}
