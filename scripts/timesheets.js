// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadTimesheets = function (exports) {
  var Timesheets = function(storage, settings, responder) {
    this.storage = storage;
    this.responder = responder;
    this.settings = settings;

    var self = this;
    this.responder.on('receiveMessage', function(username, message) {
      self.receiveMessage(username, message);
    });
  };

  // メッセージを受信する
  Timesheets.prototype.receiveMessage = function(username, message) {
    // 日付は先に処理しておく
    // this.date = DateUtils.parseDate(message);
    // this.time = DateUtils.parseTime(message);
    this.date = DateUtils.parseDate('');
    this.time = DateUtils.parseTime('');
    this.datetime = DateUtils.normalizeDateTime(this.date, this.time);
    if(this.datetime !== null) {
      this.dateStr = DateUtils.format("Y/m/d", this.datetime);
      this.datetimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
    }

    // コマンド集
    var commands = [
      ['actionSignOut', /(バ[ー〜ァ]*イ|ば[ー〜ぁ]*い|おやすみ|お[つっ]ー|おつ|さらば|お先|お疲|帰|乙|bye|night|(c|see)\s*(u|you)|退勤|ごきげんよ|グ[ッ]?バイ)/i],
      ['actionWhoIsOff', /(だれ|誰|who\s*is).*(休|やす(ま|み|む))/i],
      ['actionWhoIsIn', /(だれ|誰|who\s*is)/i],
      ['actionCancelOff', /(休|やす(ま|み|む)|休暇).*(キャンセル|消|止|やめ|ません)/i],
      ['actionOff', /(休|やす(ま|み|む)|休暇)/i],
      ['actionSignIn', /(モ[ー〜]+ニン|も[ー〜]+にん|おっは|おは|お早|へろ|はろ|ヘロ|ハロ|hi|hello|morning|出勤)/i],
      ['getStatus', /__getStatus__/],
      ['confirmSignIn', /__confirmSignIn__/],
      ['confirmSignOut', /__confirmSignOut__/],
    ];

    // メッセージを元にメソッドを探す
    var command = _.find(commands, function(ary) {
      return(ary && message.match(ary[1]));
    });

    // メッセージを実行
    if(command && this[command[0]]) {
      return this[command[0]](username, message);
    }
    this.responder.result = {
      code: 400,
      message: 'Command not found.',
      username,
      datetime: this.datetime
    };
  };

  // 出勤
  Timesheets.prototype.actionSignIn = function(username, message) {
    if(this.datetime) {
      const signInTimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
      var data = this.storage.get(username, this.datetime);
      if(!data.signIn || data.signIn === '-') {
        this.storage.set(username, this.datetime, { signIn: this.datetime, via: this.responder.via });
        this.responder.template("出勤", username, signInTimeStr);
      }
      else {
        // 更新の場合は時間を明示する必要がある
        if(!!this.time) {
          // this.storage.set(username, this.datetime, { signIn: this.datetime, via: this.responder.via });
          // this.responder.template("出勤更新", username, signInTimeStr);
        } else {
          this.responder.result = {
            code: 400,
            message: 'Already signed in.',
            status: 'signedIn',
            username,
            datetime: this.datetime
          };
        }
      }
    }
  };

  // 退勤
  Timesheets.prototype.actionSignOut = function(username, message) {
    if(this.datetime) {
      const signOutTimeStr = DateUtils.format("Y/m/d H:M", this.datetime);
      var data = this.storage.get(username, this.datetime);
      const rest = DateUtils.parseTime(this.settings.get('休憩時間'));
      const rest_string = `${rest[0]}:${rest[1]}:00`;
      if(!data.signOut || data.signOut === '-') {
        this.storage.set(username, this.datetime, { signOut: this.datetime, rest: rest_string, via: this.responder.via });
        this.responder.template("退勤", username, signOutTimeStr);
      }
      else {
        // 更新の場合は時間を明示する必要がある
        if(!!this.time) {
          // this.storage.set(username, this.datetime, { signOut: this.datetime, rest: rest_string, via: this.responder.via });
          // this.responder.template("退勤更新", username, signOutTimeStr);
        } else {
          this.responder.result = {
            code: 400,
            message: 'Already signed out.',
            status: 'signedOut',
            username,
            datetime: this.datetime
          };
        }
      }
    }
  };

  // 休暇申請
  Timesheets.prototype.actionOff = function(username, message) {
    if(this.date) {
      var dateObj = new Date(this.date[0], this.date[1]-1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if(!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, {signIn: '-', signOut: '-', note: message, via: this.responder.via});
        this.responder.template("休暇", username, DateUtils.format("Y/m/d", dateObj));
      }
    }
  };

  // 休暇取消
  Timesheets.prototype.actionCancelOff = function(username, message) {
    if(this.date) {
      var dateObj = new Date(this.date[0], this.date[1]-1, this.date[2]);
      var data = this.storage.get(username, dateObj);
      if(!data.signOut || data.signOut === '-') {
        this.storage.set(username, dateObj, {signIn: null, signOut: null, note: message, via: this.responder.via});
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
      if(_.contains(self.storage.getDayOff(username), wday)) {
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

  Timesheets.prototype.getStatus = function (username, message) {
    const datetime = DateUtils.now();
    const user_row = this.storage.get(username, datetime);

    let status = '';
    if (user_row.signIn == null) {
      status = 'notSignedIn';
    } else if (user_row.signOut == null) {
      status = 'signedIn';
    } else {
      status = 'signedOut';
    }

    this.responder.result = { code: 200, status, username, datetime };
    return status;
  };

  // 出勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignIn = function(username, message) {
    var self = this;
    var holidays = _.compact(_.map((this.settings.get("休日") || "").split(','), function(s) {
      var date = DateUtils.parseDateTime(s);
      return date ? DateUtils.format("Y/m/d", date) : undefined;
    }));
    var today = DateUtils.toDate(DateUtils.now());

    // 休日ならチェックしない
    if(_.contains(holidays, DateUtils.format("Y/m/d",today))) return;

    var wday = DateUtils.now().getDay();
    var signedInUsers = _.compact(_.map(this.storage.getByDate(today), function(row) {
      var signedIn = _.isDate(row.signIn);
      var off = (row.signIn === '-') || _.contains(self.storage.getDayOff(row.user), wday);
      return (signedIn || off) ? row.user : undefined;
    }));
    var users = _.difference(this.storage.getUsers(), signedInUsers);

    if(!_.isEmpty(users)) {
      this.responder.template("出勤確認", users.sort());
    }

    // バージョンチェックを行う
    // どのみち更新止まっているのでバージョンチェックは削除
    // if(typeof checkUpdate == 'function') checkUpdate(this.responder);
  };

  // 退勤していない人にメッセージを送る
  Timesheets.prototype.confirmSignOut = function(username, message) {
    var dateObj = DateUtils.toDate(DateUtils.now());
    var users = _.compact(_.map(this.storage.getByDate(dateObj), function(row) {
      return _.isDate(row.signIn) && !_.isDate(row.signOut) ? row.user : undefined;
    }));

    if(!_.isEmpty(users)) {
      this.responder.template("退勤確認", users.sort());
    }
  };

  return Timesheets;
};

if(typeof exports !== 'undefined') {
  exports.Timesheets = loadTimesheets();
}
