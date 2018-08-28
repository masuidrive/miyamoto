function setProperties() {
  var properties = {
    slack_client_id: '',
    slack_client_secret: ''
  };
  PropertiesService.getScriptService().setProperties(properties);
}