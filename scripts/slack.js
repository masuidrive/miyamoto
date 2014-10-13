// Slackのインタフェース
// Slack = loadSlack();

loadSlack = function () {
  var Slack = function(incomingURL, template, settings) {
    EventListener.apply(this);
    this.incomingURL = incomingURL;
    this._template = template;
    this.settings = settings;
  };

  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Slack.prototype, EventListener.prototype);

  // 受信したメッセージをtimesheetsに投げる
  Slack.prototype.receiveMessage = function(message) {
    var username = String(message.user_name);
    var body = String(message['text']);

    // 特定のアカウントには反応しない
    var ignore_users = (this.settings.get("無視するユーザ") || '').toLowerCase().replace(/^\s*(.*?)\s*$/, "$1").split(/\s*,\s*/);
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
