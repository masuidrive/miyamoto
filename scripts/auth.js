class Auth {
  constructor(properties) {
    this.properties = properties;
    this.datetime = new Date();
    this.access_tokens = JSON.parse(this.properties.get('access_tokens'));
  }

  updateAccessTokens() {
    this.properties.set('access_tokens', JSON.stringify(this.access_tokens));
  }

  receiveMessage(parameters) {
    if (parameters.command != null) {
      const result = (typeof this[parameters.command] === 'function')
        ? this[parameters.command]()
        : this.commandNotFound();

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      const message = (() => {
        if (!this.validateAccessToken(parameters.state)) {
          return HtmlService.createHtmlOutput('<b>不正なパラメータです</b>');
        } else if (parameters.error === 'access_denied') {
          return this.handleAccessDenied(parameters.state);
        } else {
          return this.handleAccessAllowed(parameters.state, parameters.code);
        }
      })();

      return HtmlService.createHtmlOutput(`<b>${message}</b>`);
    }
  }

  commandNotFound() {
    return {
      code: 400,
      message: 'Command not found.',
      datetime: this.datetime
    };
  }

  generateAccessToken() {
    const access_token = Utilities.getUuid();
    this.access_tokens[access_token] = {
      display_name: '',
      real_name: '',
      slack_access_token: '',
      created_at: this.datetime
    };
    this.updateAccessTokens();

    return {
      code: 201,
      access_token,
      auth_url: `https://slack.com/oauth/authorize?scope=users.profile:read&client_id=${this.properties.get('slack_client_id')}&state=${access_token}`,
      datetime: this.datetime
    };
  }

  validateAccessToken(access_token) {
    return access_token in this.access_tokens;
  }

  handleAccessDenied(access_token) {
    this.access_tokens[access_token].denied_at = this.datetime;
    this.updateAccessTokens();

    return '認証に失敗しました';
  }

  handleAccessAllowed(access_token, code) {
    const slack_access_token_response = this.obtainSlackAccessToken(code);
    if (!slack_access_token_response.ok) return 'Slack ログインに失敗しました';
    const slack_access_token = slack_access_token_response.access_token;

    const user_response = this.retrieveUserProfile(slack_access_token);
    if (!user_response.ok) return 'ユーザ情報の取得に失敗しました';

    this.access_tokens[access_token].display_name = user_response.profile.display_name;
    this.access_tokens[access_token].slack_access_token = slack_access_token;
    this.access_tokens[access_token].allowed_at = this.datetime;
    this.updateAccessTokens();

    return 'Slack ログインが完了しました';
  }

  obtainSlackAccessToken(code) {
    const response = UrlFetchApp.fetch(`https://slack.com/api/oauth.access?client_id=${this.properties.get('slack_client_id')}&client_secret=${this.properties.get('slack_client_secret')}&code=${code}`);
    return JSON.parse(response.getContentText());
  }

  retrieveUserProfile(slack_access_token) {
    const response = UrlFetchApp.fetch(`https://slack.com/api/users.profile.get?token=${slack_access_token}`);
    return JSON.parse(response.getContentText());
  }
}
