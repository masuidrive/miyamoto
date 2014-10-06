function createSpreadsheetStorage(spreadsheetId, properties) {
  loadSpreadsheetStorage();
  return(new SpreadsheetStorage(spreadsheetId, properties));
}

function testSpreadsheetStorage() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheet');
  var name = 'test_storage';
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(name);
  if(sheet) ss.deleteSheet(sheet);

  var schema = {
    columns: [
      { name: '日付' },
      { name: '出勤' },
      { name: '退勤' },
      { name: '時間数' },
      { name: 'ノート' },
    ],
    properties: [
      { name: 'アカウント', value: '有効', comment: '← 有効, Activeじゃない文字を入れると、アカウントを停止'},
      { name: '休み', value: '土,日', comment: '← 月,火,水みたいに入力してください'},
    ]
  }

  var storage = new SpreadsheetStorage(spreadsheetId, name, schema);
  console.log(storage.getProperty('休み'));
  console.log(storage.setProperty('休み', '火,水'));
  console.log(storage.getProperty('休み'));

  storage.setRow(0, [1,2,3]);
  console.log(storage.getRow(0));
  console.log(storage.getRow(1));
}

function SpreadsheetStorage(spreadsheetId, name, schema) {
  StorageInterface.call(this);
  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  this.sheetName = name;
  this.sheetSchema = schema;
  if(!this.sheetSchema.properties) this.sheetSchema.properties = [];
  this.sheet = this._getSheet(this.sheetName);
}

// シートを取得
SpreadsheetStorage.prototype._getSheet = function(sheetName) {
  var sheet = this.spreadsheet.getSheetByName(sheetName);
  if(!sheet) {
    sheet = this.spreadsheet.insertSheet(sheetName);
    if(!sheet) {
      this.fireEvent("error", "エラー: "+sheetName+"のシートが作れませんでした");
    }
    else {
      // 中身が無い場合は新規作成
      if(sheet.getLastRow() == 0) {
        // 設定部の書き出し
        var properties = [["Properties count", this.sheetSchema.properties.length, null]];
        this.sheetSchema.properties.forEach(function(s) {
          properties.push([s.name, s.value, s.comment]);
        });
        sheet.getRange("A1:C"+(properties.length)).setValues(properties);

        // ヘッダの書き出し
        var rowNo = properties.length + 2;
        var cols = this.sheetSchema.columns.map(function(c) { return c.name; });
        sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + cols.length - 1)+rowNo).setValues([cols]);
      }
      //this.on("newUser", username);
    }
  }
  return sheet;
}


// プロパティーを全部取得
SpreadsheetStorage.prototype._loadProperties = function(name) {
  if(!this._properties) {
    this._properties = this.sheet.getRange("A2:B"+(this.sheetSchema.properties.length+1)).getValues();
  }
  return this._properties;
};

// プロパティーを全部取得
SpreadsheetStorage.prototype.getProperty = function(name) {
  this._loadProperties();
  var kv = _.find(this._properties, function(prop) { return(prop[0] == name); })
  return kv ? kv[1] : null;
};

// プロパティーを取得
SpreadsheetStorage.prototype.setProperty = function(name, value) {
  this._loadProperties();
  var sheet = this.sheet;
  _.each(this._properties, function(prop, idx) {
    if(prop[0] == name) {
      prop[1] = value;
      sheet.getRange("B"+(idx+2)).setValue(value);
    }
  });
  return value;
};

SpreadsheetStorage.prototype.getRow = function(idx) {
  var rowNo = this.sheetSchema.properties.length + 4 + idx;
  return this.sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + this.sheetSchema.columns.length - 1)+rowNo).getValues()[0];
};

SpreadsheetStorage.prototype.setRow = function(idx, data) {
  if(data.length > 0) {
     var rowNo = this.sheetSchema.properties.length + 4 + idx;
     this.sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + data.length - 1)+rowNo).setValues([data]);
  }
  return data;
};
