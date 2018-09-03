function setProperties() {
  var properties = {
    slack_client_id: '',
    slack_client_secret: ''
  };
  PropertiesService.getScriptProperties().setProperties(properties);
}

function viewProperties() {
  Logger.log(PropertiesService.getScriptProperties().getProperties());
}

function viewPropertyKeys() {
  Logger.log(PropertiesService.getScriptProperties().getKeys());
}

function migrateUsersSpreadsheet() {
  var Prop = PropertiesService.getScriptProperties();
  var users = JSON.parse(Prop.getProperty('users'));
  var new_properties= {};
  Object.keys(users).forEach(function (user) {
    new_properties['users::' + user + '::spreadsheet_id'] = users[user];
  });
  new_properties.users = JSON.stringify(Object.keys(users));
  Prop.setProperties(new_properties);
}

function migrateAccessTokens() {
  var Prop = PropertiesService.getScriptProperties();
  var access_tokens = JSON.parse(Prop.getProperty('access_tokens'));
  var new_properties = {};
  Object.keys(access_tokens).forEach(function (access_token) {
    new_properties['access_tokens::' + access_token] = JSON.stringify(access_tokens[access_token]);
  });
  Prop.setProperties(new_properties);

  Prop.deleteProperty('access_tokens');
}
