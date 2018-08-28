// Apiのインタフェース
// Api = loadApi();

loadApi = function () {
  var Api = function(slack, storage, template, settings, properties) {
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

  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  _.extend(Api.prototype, EventListener.prototype);

  Api.prototype.extractUsername = function (parameter) {
    if (parameter.access_token != null) {
      const access_token = JSON.parse(this.properties.get('access_tokens'));
      return access_token[parameter.access_token] ? access_token[parameter.access_token].display_name : '';
    } else {
      return parameter.username | '';
    }
  };

  // 受信したメッセージをtimesheetsに投げる
  Api.prototype.receiveMessage = function(message) {
    var username = this.extractUsername(message);
    var command = message.command;

    // 特定のアカウントには反応しない
    var ignore_users = (this.settings.get("無視するユーザ") || '').toLowerCase().replace(/^\s*(.*?)\s*$/, "$1").split(/\s*,\s*/);
    if(_.contains(ignore_users, username.toLowerCase())) return;

    // -で始まるメッセージも無視
    if(command.match(/^-/)) return;

    if (this.storage.getUsers().indexOf(username) >= 0) {
      this.command = command;
      this.fireEvent('receiveMessage', username, this._convertCommandToText(command));
    } else {
      this.result = {
        code: 404,
        message: 'User not found.',
        username,
        datetime: new Date()
      }
    }

    return ContentService.createTextOutput(JSON.stringify(this.result))
      .setMimeType(ContentService.MimeType.JSON);
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
  Api.prototype.template = function() {
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

if(typeof exports !== 'undefined') {
  exports.Api = loadApi();
}
