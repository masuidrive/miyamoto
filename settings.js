/*
_設定シートの操作
*/
function createSettings(spreadsheetId, errorMessage) {
  loadSettings();
  return(new Settings(spreadsheetId, errorMessage));
};

function Settings(spreadsheetId, errorMessage) {
  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  // 初期設定
  this.sheet = this.spreadsheet.getSheetByName('_設定');
  if(!this.sheet) {
    this.sheet = this.spreadsheet.insertSheet('_設定');
    if(!this.sheet) {
      if(errorMessage) errorMessage("エラー: 設定シートを作れませんでした");
    }
    else {
      var now = new Date();
      this.sheet.getRange("A1:C2").setValues([
        ["開始日", new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), "変更しないでください"],
        ["Slack Incoming URL", null, "SlackのIntegrationにIncoming WebhookからURLを転記して下さい"],
        ["無視するユーザ", "hubot,slackbot","無視するユーザ名を,区切りで入力してください"]
      ]);
    }
  }
}

loadSettings = function() {
  loadSettings = function(){};

  Settings.prototype.get = function(name, defaultValue) {
    var vals = _.find(this.sheet.getRange("A1:B"+this.sheet.getLastRow()).getValues(), function(v) {
      return(v[0] == name);
    });
    return vals ? vals[1] : defaultValue;
  };

  Settings.prototype.set = function(name, val) {
    var vals = this.sheet.getRange("A1:A"+this.sheet.getLastRow()).getValues();
    for(var i = 0; i < this.sheet.getLastRow(); ++i) {
      if(vals[i][0] == name) {
        this.sheet.getRange("B"+(i+1)).setValue(val);
        return val;
      }
    }
    this.sheet.getRange("A"+(this.sheet.getLastRow()+1)+":B"+(this.sheet.getLastRow()+1)).setValues([[name, val]]);
    return val;
  };
};

function testSettings() {
  var settings = new Settings(ScriptProperties.getProperty('spreadsheet'));
  console.log(1231 == settings.set('Test1', 1231));
  console.log(1231 == settings.get('Test1'));
  console.log(1 == settings.get('unknow', 1) );
}
