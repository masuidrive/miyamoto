// Google Apps Script専用ユーティリティ

// GASのログ出力をブラウザ互換にする
if(typeof(console) == 'undefined' && typeof(Logger) != 'undefined') {
  console = {};
  console.log = function() {
    Logger.log(Array.prototype.slice.call(arguments).join(', '));
  }
}

// サーバに新しいバージョンが無いかチェックする
checkUpdate = function(responder) {
  if(typeof GASProperties === 'undefined') GASProperties = loadGASProperties();
  var current_version = parseFloat(new GASProperties().get('version')) || 0;

  var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/VERSION", {muteHttpExceptions: true});

  if(response.getResponseCode() == 200) {
    var latest_version = parseFloat(response.getContentText());
    if(latest_version > 0 && latest_version > current_version) {
      responder.send("最新のみやもとさんの準備ができました！\nhttps://github.com/masuidrive/miyamoto/blob/master/UPDATE.md を読んでください。");

      var response = UrlFetchApp.fetch("https://raw.githubusercontent.com/masuidrive/miyamoto/master/HISTORY.md", {muteHttpExceptions: true});
      if(response.getResponseCode() == 200) {
        var text = String(response.getContentText()).replace(new RegExp("## "+current_version+"[\\s\\S]*", "m"), '');
        responder.send(text);
      }
    }
  }
};
