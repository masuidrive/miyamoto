class Auth {
  constructor(properties) {
    this.properties = properties;
    this.datetime = new Date();
  }

  receiveMessage(parameters) {
    const result = (typeof this[parameters.command] === 'function')
      ? this[parameters.command]()
      : this.commandNotFound();

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
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
    const access_tokens = this.properties.get('access_tokens');
    access_tokens[access_token] = {
      username: '',
      created_at: this.datetime
    };
    this.properties.set('access_tokens', JSON.stringify(access_tokens));

    return {
      code: 201,
      access_token,
      datetime: this.datetime
    };
  }
}

