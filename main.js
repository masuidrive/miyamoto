
// Script-as-app template.
function doGet() {
  var app = UiApp.createApplication();

  var button = app.createButton('Click Me');
  app.add(button);

  var label = app.createLabel('The button was clicked.')
                 .setId('statusLabel')
                 .setVisible(false);
  app.add(label);

  var handler = app.createServerHandler('myClickHandler');
  handler.addCallbackElement(label);
  button.addClickHandler(handler);

  return app;
}

function myClickHandler(e) {
  var app = UiApp.getActiveApplication();

  var label = app.getElementById('statusLabel');
  label.setVisible(true);

  app.close();
  return app;
}
/*
ToDo
24時を越えた扱い

*/