// メッセージテンプレート
// GSTemplate = loadGSTemplate();

loadGSTemplate = function() {
  var GSTemplate = function(spreadsheet) {
    this.spreadsheet = spreadsheet;

    // メッセージテンプレート設定
    this.sheet = this.spreadsheet.getSheetByName('_メッセージ');
    if(!this.sheet) {
      this.sheet = this.spreadsheet.insertSheet('_メッセージ');
      if(!this.sheet) {
        throw "エラー: メッセージシートを作れませんでした";
      }
      else {
        var now = DateUtils.now();
        this.sheet.getRange("A1:L2").setValues([
          [
            "出勤", "出勤更新", "退勤", "退勤更新", "休暇", "休暇取消",
            "出勤中", "出勤なし", "休暇中", "休暇なし", "出勤確認", "退勤確認"
          ],
          [
            "<@#1> おはようございます (#2)", "<@#1> 出勤時間を#2へ変更しました",
            "<@#1> お疲れ様でした (#2)", "<@#1> 退勤時間を#2へ変更しました",
            "<@#1> #2を休暇として登録しました", "<@#1> #2の休暇を取り消しました",
            "#1が出勤しています", "全員退勤しています",
            "#1は#2が休暇です", "#1に休暇の人はいません",
            "今日は休暇ですか？ #1", "退勤しましたか？ #1"
          ]
        ]);
      }
    }
  };

  // テンプレートからメッセージを生成
  GSTemplate.prototype.template = function(label) {
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
          var arg = arguments[i]
          if(_.isArray(arg)) {
            arg = _.map(arg, function(u) {
              return "<@"+u+">";
            }).join(', ');
          }

          message = message.replace("#"+i, arg);
        }

        return message;
      }
    }
    return arguments.join(', ');
  }

  return GSTemplate;
};

if(typeof exports !== 'undefined') {
  exports.GSTemplate = loadGSTemplate();
}
