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
            "<@#1> Good morning (#2)!", "<@#1> I changed starting time to #2",
            "<@#1> Great work! (#2)", "<@#1> I changed leaving time to #2",
            "<@#1> I registered a holiday for #2", "<@#1> I canceled holiday #2",
            "#1 is working", "All staffs are working",
            "#2 is having a holiday at #1", "No one is having a holiday at #1",
            "Is today holiday? #1", "Did you finish working today? #1"
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
