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
    doIn: function() {
      /* noop */
      return 'ok';
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

  var timesheets = new Timesheets(storage, settings, responder);

  DateUtils.now(new Date(2014,0,2,12,34,0));

  responder.clearMessages();
  timesheets.receiveMessage('test1', 'おはよう');
  assert.ok(_.isEqual([['出勤', 'test1', "2014/01/02 12:34"]], responder.messages), 'おはよう');
/*
  timesheets.receiveMessage('test1', 'おはよう');
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
*/
});
