// Google Apps Script専用ユーティリティ


// GASのログ出力をブラウザ互換にする
if(typeof(console) == 'undefined' && typeof(Logger) != 'undefined') {
  console = Logger;
}

// デバッグ用メッセージ出力
function debug(msg) {
  // Google SpreadsheetにDebugシートがあればそれに出力
  if(SpreadsheetApp && ScriptProperties) {
    var spreadsheet = SpreadsheetApp.openById(ScriptProperties.getProperty('spreadsheet'));
    if(spreadsheet) {
      var sheet = spreadsheet.getSheetByName("Debug");
      if(sheet) {
        sheet.getRange('a'+(sheet.getLastRow()+1)).setValue(msg);
      }
    }
  }

  // コンソールに出力
  if(console) {
    console.log(msg);
  }

  return msg;
}
