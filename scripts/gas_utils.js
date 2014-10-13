// Google Apps Script専用ユーティリティ


// GASのログ出力をブラウザ互換にする
if(typeof(console) == 'undefined' && typeof(Logger) != 'undefined') {
  console = {};
  console.log = function() {
    Logger.log(Array.prototype.slice.call(arguments).join(', '));
  }
}
