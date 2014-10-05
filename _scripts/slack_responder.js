function testSlackResponder(spreadsheetId) {
  var SlackResponder = createSlackResponder(spreadsheetId);
  // SlackResponder.send("Test");
  SlackResponder.template("出勤変更",'a','b');
};

function createSlackResponder(spreadsheetId) {
  loadSlackResponder();
  return(new SlackResponder(spreadsheetId));
}

function SlackResponder(spreadsheetId) {
  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  this.settings = new Settings(spreadsheetId);

  // メッセージテンプレート設定
  this.sheet = this.spreadsheet.getSheetByName('_メッセージ');
  if(!this.sheet) {
    this.sheet = this.spreadsheet.insertSheet('_メッセージ');
    if(!this.sheet) {
      this.send("エラー: メッセージシートを作れませんでした");
    }
    else {
      var now = new Date();
      this.sheet.getRange("A1:K2").setValues([
        [
          "出勤", "出勤更新", "退勤", "退勤更新", "休暇", "休暇取消",
          "出勤中", "出勤なし", "休暇中", "休暇なし", "使い方"
        ],
        [
          "<@#1> おはようございます (#2)", "<@#1> 出勤時間を#2へ変更しました",
          "<@#1> お疲れ様でした (#2)", "<@#1> 退勤時間を#2へ変更しました",
          "<@#1> #2を休暇として登録しました", "<@#1> #2の休暇を取り消しました",
          "#1が出勤しています", "全員退勤しています",
          "#1は#2が休暇です", "#1に休暇の人はいません",
          "<@#1> 使い方は管理者へお問い合わせ下さい"]
        ]
      );
    }
  }
}

loadSlackResponder = function() {
  loadSlackResponder = function(){};

  // テンプレートでメッセージを送信
  SlackResponder.prototype.template = function(label) {
    var labels = this.sheet.getRange("A1:Z1").getValues()[0];
    for(var i = 0; i < labels.length; ++i) {
      if(labels[i] == label) {
        var template = _.sample(
          _.filter(
            _.map(this.sheet.getRange(String.fromCharCode(i+65)+'2:'+(String.fromCharCode(i+65))).getValues(), function(v) {
            return v[0];
          }),
            function(v) {
              return !!v;
            }
        )
        );

        var message = template;
        for (var i = 1; i < arguments.length; i++) {
          message = message.replace("#"+i, arguments[i]);
        }

        return this.send(message);
      }
    }
    return this.send(label);
  }

  // メッセージを送信
  SlackResponder.prototype.send = function(message, options) {
    options = JSON.parse(JSON.stringify(options || {}));
    options["text"] = message;

    var send_options = {
      method: "post",
      payload: {"payload": JSON.stringify(options)}
    };

    var url = this.settings.get('Slack Incoming URL');
    if(url) {
      UrlFetchApp.fetch(url, send_options);
    }
    return message;
  };
};
