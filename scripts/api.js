// Apiのインタフェース
// Api = loadApi();

loadApi = function () {
  var Api = function(slack, template, settings) {
    EventListener.apply(this);
    this.slack = slack;
    this._template = template;
    this.settings = settings;
    this.result = {};
  };

  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Api.prototype, EventListener.prototype);

  // 受信したメッセージをtimesheetsに投げる
  Api.prototype.receiveMessage = function(message) {
    var username = String(message.username);
    var command = String(message.command);

    // 特定のアカウントには反応しない
    var ignore_users = (this.settings.get("無視するユーザ") || '').toLowerCase().replace(/^\s*(.*?)\s*$/, "$1").split(/\s*,\s*/);
    if(_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if(command.match(/^-/)) return;

    this.fireEvent('receiveMessage', username, this._convertCommandToText(command));

    return ContentService.createTextOutput(JSON.stringify(this.result))
      .setMimeType(ContentService.MimeType.JSON);
  };

  Api.prototype._convertCommandToText = function (command) {
    switch (command) {
      case 'signIn':
        return 'おはようございます';
      case 'signOut':
        return 'お疲れさまでした';
      default:
        return '';
    }
  };

  // メッセージ送信
  Api.prototype.send = function(message, options) {
    options = _.clone(options || {});
    options["text"] = message;

    var send_options = {
      method: "post",
      payload: {"payload": JSON.stringify(options)}
    };

    if(this.slack) {
      UrlFetchApp.fetch(this.slack, send_options);
    }

    return message;
  };

  // テンプレート付きでメッセージ送信
  Api.prototype.template = function() {
    this.slack.send(this._template.template.apply(this._template, arguments));
    this.result = {
      username: arguments[1],
      datetime: arguments[2]
    };
  };

  return Api;
};

if(typeof exports !== 'undefined') {
  exports.Api = loadApi();
}
