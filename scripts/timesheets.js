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
