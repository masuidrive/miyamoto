// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGSTimesheets = function () {
  var GSTimesheets = function(spreadsheet, settings) {
    this.spreadsheet = spreadsheet;
    this.settings = settings;
    this._spreadsheets = {};
    this._sheets = {};
    this.users = JSON.parse(GASProperties.get('users'));

    this.scheme = {
      columns: [
        { name: '日付', format: 'yyyy"年"m"月"d"日（"ddd"）"', width: 150 },
        { name: '出勤（打刻）', format: 'H:mm', width: 100 },
        { name: '退勤（打刻）', format: 'H:mm', width: 100 },
        { name: '出勤', format: 'H:mm', formula: `=CEILING(RC[-2],TIME(0,${this.settings.get('丸め単位（分）')},0))`, width: 50 },
        { name: '退勤', format: 'H:mm', formula: `=FLOOR(RC[-2],TIME(0,${this.settings.get('丸め単位（分）')},0))`, width: 50 },
        { name: '休憩時間', format: '[h]:mm', width: 75 },
        { name: '勤務時間', format: '[h]:mm', formula: '=IF(OR(ISBLANK(RC[-5]),ISBLANK(RC[-4]),ISBLANK(RC[-1])),0,MAX(RC[-2]-RC[-3]-RC[-1],0))', width: 75 },
        { name: 'メモ', width: 300 },
        { name: '承認者', width: 100 },
        { name: '経由', width: 50 }
      ],
      properties: [
        { name: 'DayOff', value: '土,日', comment: '← 月,火,水みたいに入力してください。アカウント停止のためには「全部」と入れてください。'},
        { name: '入社日', value: (new Date).toLocaleDateString(), comment: 'デフォルトでシート作成日が入っているので，入社日に修正してください。' },
        { name: '勤務形態', value: '正社員', comment: 'デフォルトで「正社員」が入っているので，正しいものを選択してください。編集権限がない場合はコーポレート部門に連絡してください。' }
      ]
    };

    this.seasons = [
      { name: '夏季', duration: 3, judge: (date) => [6, 7, 8].includes(date.getMonth()) },
      { name: '年末年始', duration: 3, judge: (date) => [11, 0].includes(date.getMonth()) }
    ];
  };

  GSTimesheets.prototype._getSpreadsheet = function (username) {
    if (this._spreadsheets[username]) return this._spreadsheets[username];

    const user_ss = this._createOrOpenUserSpreadsheet(GASProperties.get('employees_folder_id'), username);
    this._spreadsheets[username] = user_ss;
    this._sheets[username] = {};

    return user_ss;
  };

  GSTimesheets.prototype._createOrOpenUserSpreadsheet = function (folder_id, username) {
    if (username in this.users.keys()) return SpreadsheetApp.openById(this.users[username]);

    const user_ss_fi = DriveApp.searchFiles(`"${folder_id}" in parents and mimeType = "${MimeType.GOOGLE_SHEETS}" and title = "${username}"`);
    if (user_ss_fi.hasNext()) {
      const user_ss = SpreadsheetApp.openById(user_ss_fi.next().getId());
      this.addUserSpreadsheet(user_ss);
      return user_ss;
    }

    const new_ss = SpreadsheetApp.create(username);
    const prop_sheet = this._createOrOpenSheet(new_ss, '_設定');
    this._fillPropertiesSheet(prop_sheet);
    this._createPaidHolidaysSheets(new_ss);
    this._createSeasonalHolidaysSheets(new_ss, DateUtils.getFiscalYear(new Date()));

    const new_ss_file = DriveApp.getFileById(new_ss.getId())
      .setOwner(this.settings.get('管理者メールアドレス'))
      .setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE)
      .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.NONE)
      .setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW)
      .setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    folder.addFile(new_ss_file);
    DriveApp.getRootFolder().removeFile(new_ss_file);

    this.addUserSpreadsheet(new_ss);

    return new_ss;
  };

  GSTimesheets.prototype._getSheet = function(username, sheetName) {
    const spreadsheet = this._getSpreadsheet(username);
    if(this._sheets[username][sheetName]) return this._sheets[username][sheetName];

    const sheet = this._createOrOpenSheet(spreadsheet, sheetName);

    this._sheets[username][sheetName] = sheet;

    return sheet;
  };

  GSTimesheets.prototype._createOrOpenSheet = function (spreadsheet, sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      return sheet;
    }

    sheet = spreadsheet.getSheetByName('シート1');
    if (sheet) {
      sheet.setName(sheetName);
      return sheet;
    }

    sheet = spreadsheet.insertSheet(sheetName, spreadsheet.getNumSheets());
    if (!sheet) {
      throw `エラー: ${sheetName}のシートが作れませんでした`;
    }
    return sheet;
  };

  GSTimesheets.prototype._fillPropertiesSheet = function (sheet) {
    const last_row = sheet.getLastRow();
    const current_props = (last_row === 0) ? [['']] : sheet.getRange(1, 1, last_row, 1).getValues();
    const new_props = (last_row === 0) ? [["Properties count", this.scheme.properties.length, null]] : [];
    this.scheme.properties.forEach(s => {
      if (!_.find(current_props, v => v[0] === s.name)) {
        new_props.push([s.name, s.value, s.comment]);
      }
    });
    if (new_props.length > 0) {
      sheet.getRange(last_row + 1, 1, new_props.length, 3).setValues(new_props);
    }

    this._setDataValidationInPropertiesSheet(sheet);
  };

  GSTimesheets.prototype._setDataValidationInPropertiesSheet = function (sheet) {
    const last_row = sheet.getLastRow();
    if (last_row < 1) return;
    const props = sheet.getRange(1, 1, last_row, 1).getValues();
    props.forEach((row, index) => {
      if (row[0] !== '勤務形態') return;
      const cell = sheet.getRange(index + 1, 2, 1, 1);
      if (cell.getDataValidation() === null) {
        cell.setDataValidation(SpreadsheetApp.newDataValidation()
          .requireValueInList(['正社員', '業務委託', 'アルバイト'], true)
          .build()
        );
      }
    })
  };

  GSTimesheets.prototype._createPaidHolidaysSheets = function (spreadsheet) {
    const entrance = this._createOrOpenSheet(spreadsheet, '_設定').getRange('B3').getValue();
    const length_of_service = DateUtils.getLengthOfService(entrance, new Date());

    for (let i = 1; i <= length_of_service + 1; i++) {
      const sheet = this._createOrOpenSheet(spreadsheet, `${i}年目有給休暇`);
      this._fillPaidHolidaysSheet(sheet);
    }
  };

  GSTimesheets.prototype._fillPaidHolidaysSheet = function (sheet) {
    if (sheet.getLastRow() > 0) return;
    const nth_of_year = sheet.getName().match(/\d+/)[0] * 1;

    const rows = [
      ['期間', '', '', ''],
      ['', '合計時間', '日', '時間'],
      ['繰越', 0, '', ''],
      ['付与', 8 * (10 + nth_of_year - 1), '', ''],
      ['取得済み', '', '', ''],
      ['残り', '', '', ''],
      ['', '', '', ''],
      ['取得日', '取得時間', '', '']
    ];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    sheet.getRange('B1:C1').setFormulas([[`=EDATE('_設定'!B3,${12 * (nth_of_year - 1)})`, '=EDATE(B1,12)-1']]);
    if (nth_of_year > 1) sheet.getRange('B3').setFormula(`='${nth_of_year - 1}年目有給休暇'!B6`);
    sheet.getRange('B5').setFormula('=SUM(B9:B88)');
    sheet.getRange('B6').setFormula('=B3+B4-B5');
    sheet.getRange('C3:C6').setFormulaR1C1('=INT(RC[-1]/8)');
    sheet.getRange('D3:D6').setFormulaR1C1('=MOD(RC[-2],8)');
  };

  GSTimesheets.prototype._createSeasonalHolidaysSheets = function (spreadsheet, year) {
    this.seasons.forEach((season) => {
      const sheet = this._createOrOpenSheet(spreadsheet, `${year}年度${season.name}休暇`);
      this._fillSeasonalHolidaysSheet(sheet, season);
    });
  };

  GSTimesheets.prototype._fillSeasonalHolidaysSheet = function (sheet, season) {
    if (sheet.getLastRow() > 0) return;

    const rows = [
      ['付与日数', season.duration],
      ['取得済み日数', ''],
      ['残り日数', ''],
      ['', ''],
      ['取得日', '']
    ];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

    sheet.getRange('B2').setFormula('=COUNT(A6:A8)');
    sheet.getRange('B3').setFormula('=B1-B2');
  };

  GSTimesheets.prototype._getMonthlySheet =  function (username, date) {
    const sheetName = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    const monthly_sheet = this._getSheet(username, sheetName);
    this._fillMonthlySheet(monthly_sheet, date);
    return monthly_sheet;
  };

  GSTimesheets.prototype._fillMonthlySheet = function (sheet, date) {
    // 中身が無い場合は新規作成
    if (sheet.getLastRow() == 0) {
      // ヘッダの書き出し
      const cols = this.scheme.columns.map(function (c) {
        return c.name;
      });
      sheet.getRange(2, 1, 1, cols.length).setValues([cols]);

      const year = date.getFullYear();
      const month = date.getMonth();
      const rows = [];

      for (const date = new Date(year, month, 1); date.getMonth() === month; date.setDate(date.getDate() + 1)) {
        const columns = [date.toLocaleDateString()];
        for (let i = 1; i < this.scheme.columns.length; i++) {
          columns.push(this.scheme.columns[i].hasOwnProperty('value') ? this.scheme.columns[i].value : '');
        }
        rows.push(columns);
      }
      sheet.getRange(3, 1, rows.length, cols.length).setValues(rows);

      for (let i = 0; i < this.scheme.columns.length; i++) {
        if (this.scheme.columns[i].hasOwnProperty('format')) {
          sheet.getRange(3, i + 1, rows.length, 1).setNumberFormat(this.scheme.columns[i].format);
        }
        if (this.scheme.columns[i].hasOwnProperty('formula')) {
          sheet.getRange(3, i + 1, rows.length, 1).setFormulaR1C1(this.scheme.columns[i].formula);
        }
        if (this.scheme.columns[i].hasOwnProperty('width')) {
          sheet.setColumnWidth(i + 1, this.scheme.columns[i].width);
        }
      }

      // 合計勤務時間
      sheet.getRange('G1')
        .setFormulaR1C1(`=SUM(R[2]C:R[${2 + rows.length - 1}]C)`)
        .setNumberFormat('[h]:mm');
    }
  };

  GSTimesheets.prototype._getRowNo = function(date) {
    return date.getDate() + (date.getHours() < 6 ? 1 : 2);
  };

  GSTimesheets.prototype.get = function(username, date) {
    var sheet = this._getMonthlySheet(username, date);
    var rowNo = this._getRowNo(date);
    var row = sheet.getRange(rowNo, 1, 1, this.scheme.columns.length).getValues()[0].map(function(v) {
      return v === '' ? undefined : v;
    });

    return { user: username, date: row[0], signIn: row[1], signOut: row[2], rest: row[5], note: row[7], supervisor: row[8], via: row[9] };
  };

  GSTimesheets.prototype.set = function(username, date, params) {
    var row = this.get(username, date);
    _.extend(row, _.pick(params, 'signIn', 'signOut', 'rest', 'note', 'supervisor', 'via'));

    var sheet = this._getMonthlySheet(username, date);
    var rowNo = this._getRowNo(date);

    this._setValues(sheet.getRange(rowNo, 2, 1, 2), [row.signIn, row.signOut]);
    this._setValues(sheet.getRange(rowNo, 6, 1, 1), [row.rest]);
    this._setValues(sheet.getRange(rowNo, 8, 1, 3), [row.note, row.supervisor, row.via]);

    return row;
  };

  GSTimesheets.prototype._setValues = function (range, data) {
    range.setValues([
      data.map(function(v) {
        return v == null ? '' : v;
      })
    ]);
  };

  GSTimesheets.prototype.getUsers = function() {
    return this.users.keys();
  };

  GSTimesheets.prototype.addUserSpreadsheet = function (spreadsheet) {
    this.users[spreadsheet.getName()] = spreadsheet.getId();
    this.updateUsers();
  };

  GSTimesheets.prototype.updateUsers = function () {
    GASProperties.set('users', JSON.stringify(this.users));
  };

  GSTimesheets.prototype.getByDate = function(date) {
    var self = this;
    return _.map(this.getUsers(), function(username) {
      return self.get(username, date);
    });
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function(username) {
    var sheet = this._getSheet(username, '_設定');
    return DateUtils.parseWday(sheet.getRange("B2").getValue());
  };

  return GSTimesheets;
};

if(typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
