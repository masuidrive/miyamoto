// 各モジュールの読み込み
var initLibraries = function() {
  if(typeof EventListener === 'undefined') EventListener = loadEventListener();
  if(typeof DateUtils === 'undefined') DateUtils = loadDateUtils();
  if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  if(typeof GSProperties === 'undefined') GSProperties = loadGSProperties();
  if(typeof GSTemplate === 'undefined') GSTemplate = loadGSTemplate();
  if(typeof GSTimesheets === 'undefined') GSTimesheets = loadGSTimesheets();
  if(typeof Timesheets === 'undefined') Timesheets = loadTimesheets();
  if(typeof Slack === 'undefined') Slack = loadSlack();
}

var init = function() {
  initLibraries();

  var global_settings = new GASProperties();
  var spreadsheetId = global_settings.get('spreadsheet');
  if(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var settings = new GASProperties();
    var template = new GSTemplate(spreadsheet);
    var slack = new Slack(settings.get('Slack Incoming URL'), template);
    var storage = new GSTimesheets(spreadsheet, settings);
    var timesheets = new Timesheets(storage, settings, slack);
    return slack;
  }
  return null;
}

// SlackのOutgoingから来るメッセージ
function doPost(e) {
  var receiver = init();
  if(receiver) receiver.receiveMessage(e);
}

// 初期化する
function setUp() {
  initLibraries();

  // spreadsheetが無かったら初期化
  var global_settings = new GASProperties();
  if(!global_settings.get('spreadsheet')) {

    // タイムシートを作る
    var spreadsheet = SpreadsheetApp.create("Slack Timesheets test");
    var sheets = spreadsheet.getSheets();
    if(sheets.length == 1 && sheets[0].getLastRow() == 0) {
      sheets[0].setName('_設定');
    }
    global_settings.set('spreadsheet', spreadsheet.getId());

    var settings = new GSProperties(spreadsheet);
    settings.set('Slack Incoming', '');
    settings.setNote('Slack Incoming URL', 'Slackのincoming URLを入力してください');
    settings.set('開始日', DateUtils.format("Y-m-d", DateUtils.now()));
    settings.setNote('開始日', '変更はしないでください');

    // 休日を設定
    var url = 'http://www.google.com/calendar/feeds/japanese@holiday.calendar.google.com/public/full-noattendees?alt=json&max-results=1000&start-min='+DateUtils.format("Y-m-d", DateUtils.now());
    var data = JSON.parse(UrlFetchApp.fetch(url).getContentText());
    var holidays = _.map(data.feed.entry, function(e) {
      return e['gd$when'][0]['startTime'];
    });
    settings.set('休日', holidays.join(', '));
    settings.setNote('休日', '日付を,区切りで。来年までは自動設定されているので、以後は適当に更新してください');

    // メッセージ用のシートを作成
    new GSTemplate(spreadsheet);

    // 毎日11時頃に出勤してるかチェックする
    ScriptApp.newTrigger('confirmSignIn')
      .timeBased()
      .everyDays(1)
      .atHour(11)
      .create();

    // 毎日22時頃に退勤してるかチェックする
    ScriptApp.newTrigger('confirmSignOut')
      .timeBased()
      .everyDays(1)
      .atHour(22)
      .create();
  }
};
