QUnit.test( "EventListener", function(assert) {

  var responder = {
    messages: [],
    template: function(label) {
      message = [label];
      for (var i = 1; i < arguments.length; i++) {
        message.push(arguments[i]);
      }
      this.messages.push(message);
    },
    clearMessages: function() {
      this.messages = [];
    }
  };

  var storage = {
    data: {},

    init: function(initData) {
      this.data = _.clone(initData || {});
    },

    get: function(username, date) {
      if(!this.data[username]) this.data[username] = {};
      return this.data[username][String(DateUtils.toDate(date))] || {};
    },

    set: function(username, date, params) {
      var row = this.get(username, date);

      if(typeof params.signIn != 'undefined') {
        row.signIn = params.signIn;
      }

      if(typeof params.signOut != 'undefined') {
        row.signOut = params.signOut;
      }

      if(typeof params.note != 'undefined') {
        row.note = params.note;
      }

      this.data[username][String(DateUtils.toDate(date))] = row;

      return row;
    }
  };

  var settings = {
    values: {},
    get: function(key) {
      return this.values[key];
    },
    set: function(key, val) {
      return this.values[key] = val;
    }
  };


  var msgTest = function(user, msg, result) {
    responder.clearMessages();
    timesheets.receiveMessage(user, msg);
    assert.ok(_.isEqual(result, responder.messages), user+":"+msg);
  };

  var storageTest = function(initData, callback) {
    callback(function(user, msg, result) {
      storage.init(initData);
      msgTest(user, msg, result);
    });
  };


  var timesheets = new Timesheets(storage, settings, responder);

  DateUtils.now(new Date(2014,0,2,12,34,0));
  var nowDateStr = String(new Date(2014,0,2));

  // 出勤
  storageTest({}, function(msgTest) {
    msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
    msgTest('test1', 'おはよう 4:56', [['出勤', 'test1', "2014/01/02 04:56"]]);
    msgTest('test1', 'おはよう 4:56 2/3', [['出勤', 'test1', "2014/02/03 04:56"]]);
  });

  // 出勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { signIn: new Date(2014,0,2,0,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おはよう', []);
    msgTest('test1', 'おはよう 4:56', [['出勤更新', 'test1', "2014/01/02 04:56"]]);
  });

  // 退勤
  storageTest({}, function(msgTest) {
    msgTest('test1', 'おつ', [['退勤', 'test1', "2014/01/02 12:34"]]);
    msgTest('test1', 'お疲れさま 14:56', [['退勤', 'test1', "2014/01/02 14:56"]]);
    msgTest('test1', 'お疲れさま 16:23 12/3', [['退勤', 'test1', "2013/12/03 16:23"]]);
  });

  // 退勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { signIn: new Date(2014,0,2,0,0,0), signOut: new Date(2014,0,2,12,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おつ', []);
    msgTest('test1', 'お疲れさま 14:56', [['退勤更新', 'test1', "2014/01/02 14:56"]]);
  });

  // 退勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { signIn: new Date(2014,0,2,0,0,0), signOut: new Date(2014,0,2,12,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おつ', []);
    msgTest('test1', 'お疲れさま 14:56', [['退勤更新', 'test1', "2014/01/02 14:56"]]);
  });

  // 休暇申請
  storageTest({}, function(msgTest) {
    msgTest('test1', 'お休み', []);
    msgTest('test1', '今日はお休み', [['休暇', 'test1', "2014/01/02"]]);
    msgTest('test1', '明日はお休み', [['休暇', 'test1', "2014/01/03"]]);
    msgTest('test1', '12/3はお休みでした', [['休暇', 'test1', "2013/12/03"]]);
  });

  // 休暇取消
  var test1 = {};
  test1[nowDateStr] = { signIn: '-', singOut: '-' };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'お休みしません', []);
    msgTest('test1', '今日はお休みしません', [['休暇取消', 'test1', "2014/01/02"]]);
    msgTest('test1', '明日はお休みしません', [['休暇取消', 'test1', "2014/01/03"]]);
  });


/*
  timesheets.receiveMessage('test1', '誰がいる？');
  timesheets.receiveMessage('test1', '誰がお休み？');
  timesheets.receiveMessage('test1', '9/21 誰がお休み？');
  timesheets.receiveMessage('test1', '9/22 誰がお休み？');
  timesheets.receiveMessage('test1', '9/23 誰がお休み？');

  // 無視される
  timesheets.receiveMessage('Slackbot', 'おはよう 10/1 10:00');
*/
});
