var init = function() {
  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  if(typeof DateUtils === 'undefined') DateUtils = loadDateUtils();
  if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  if(typeof GSTemplate === 'undefined') GSTemplate = loadGSTemplate();
  if(typeof GSTimesheets === 'undefined') GSTimesheets = loadGSTimesheets();
  if(typeof Timesheets === 'undefined') Timesheets = loadTimesheets();
  if(typeof Slack === 'undefined') Slack = loadSlack();
}


// SlackのOutgoingから来るメッセージ
function doPost(e) {
}


function test1() {
  init();

  var incomingURL = 'https://toreta.slack.com/services/hooks/incoming-webhook?token=lXfhZCSiZQNZZvt2hsAq0ej2';
  var spreadsheet = SpreadsheetApp.openById("1GNNpwiOx3xmuGPvJnzsx0G-oDxQtxxryyPOCZ1CaduY");
  var settings = new GASProperties();
  var template = new GSTemplate(spreadsheet);
  var slack = new Slack(incomingURL, template);
  var storage = new GSTimesheets(spreadsheet, settings);
  var timesheets = new Timesheets(storage, slack);

  slack.receiveMessage({parameters:{user_name:'foo',text:'おはよう 10:00'}});

};
