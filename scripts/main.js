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
    var settings = new GSProperties(spreadsheet);
    var template = new GSTemplate(spreadsheet);
    var slack = new Slack(settings.get('Slack Incoming URL'), template, settings);
    var storage = new GSTimesheets(spreadsheet, settings);
    var timesheets = new Timesheets(storage, settings, slack);
    return({
      receiver: slack,
      timesheets: timesheets,
      storage: storage
    });
  }
  return null;
}

// SlackのOutgoingから来るメッセージ
function doPost(e) {
  var miyamoto = init();
  miyamoto.receiver.receiveMessage(e.parameters);
}

// Time-based triggerで実行
function confirmSignIn() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignIn();
}

// Time-based triggerで実行
function confirmSignOut() {
  var miyamoto = init();
  miyamoto.timesheets.confirmSignOut();
}


// 初期化する
function setUp() {
  initLibraries();

  // spreadsheetが無かったら初期化
  var global_settings = new GASProperties();
  if(!global_settings.get('spreadsheet')) {

    // タイムシートを作る
    var spreadsheet = SpreadsheetApp.create("Slack Timesheets");
    var sheets = spreadsheet.getSheets();
    if(sheets.length == 1 && sheets[0].getLastRow() == 0) {
      sheets[0].setName('_設定');
    }
    global_settings.set('spreadsheet', spreadsheet.getId());

    var settings = new GSProperties(spreadsheet);
    settings.set('Slack Incoming URL', '');
    settings.setNote('Slack Incoming URL', 'Slackのincoming URLを入力してください');
    settings.set('開始日', DateUtils.format("Y-m-d", DateUtils.now()));
    settings.setNote('開始日', '変更はしないでください');
    settings.set('無視するユーザ', 'miyamoto,hubot,slackbot,incoming-webhook');
    settings.setNote('無視するユーザ', '反応をしないユーザを,区切りで設定する。botは必ず指定してください。');

    // 休日を設定
    // apiKey が設定されている場合のみ自動追加
    var holidays = [];
    if (global_settings.get('apiKey')) {
      var url = 'https://www.googleapis.com/calendar/v3/calendars/japanese@holiday.calendar.google.com/events?maxResults=1000&orderBy=startTime&singleEvents=true&timeMin='+DateUtils.format("Y-m-dT00:00:00Z", DateUtils.now())+'&key='+global_settings.get('apiKey');

      var data = JSON.parse(UrlFetchApp.fetch(url).getContentText());
      holidays = _.map(data.items, function(e) {
        return e.start.date;
      });
    }
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

/* バージョンアップ処理を行う */
function migrate() {
  if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();

  var global_settings = new GASProperties();
  global_settings.set('version', "::VERSION::");
  console.log("バージョンアップが完了しました。");
}



/*
function test1(e) {
  var miyamoto = init();
  miyamoto.receiver.receiveMessage({user_name:"masuidrive", text:"hello 8:00"});
}
*/
