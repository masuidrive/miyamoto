# 勤怠管理bot - 宮本さん

Google Apps Scriptで書かれた、Slack上で動く勤怠管理Bot。

Slackで下記の様につぶやくと、宮本さんがGoogle Spreadsheetに勤怠を記録してくれます。

[demo1.png]


## 会話例

- おはようございます ← 現在時刻で出勤
- おはようございます 12:00 ← 指定時刻で出勤
- 12:00に出勤しました ← 指定時刻で出勤
- お疲れ様でした ← 現在時刻で退勤
- お疲れ様でした 20:00 ← 指定時刻で退勤
- 20時に退勤しました ← 指定時刻で退勤
- 明日はお休みです ← 休暇申請
- 10/1はお休みです ← 休暇申請
- 明日のお休みを取り消します ← 休暇申請取り消し
- 明日はやっぱり出勤します ← 休暇申請取り消し

- 誰がいる？ ← 出勤中のリスト
- 誰がお休み？ ← 休暇中のリスト
- 9/21は誰がお休み？ ← 指定日の休暇リスト


# 設置方法

宮本さんは、プログラム本体をGoogle Driveに保存して実行します。データはGoogle Spreadsheetに保存されます。

インストールは下記の手順に従ってください。


## Google Apps Scriptに設置

### ソースコードの設置

- https://drive.google.com/ を開いて画面右にある、赤い「作成」ボタンを押します。　[drive1.png]
- 最下部の「アプリを追加」を押してダイアログを開きます。
- ダイアログの検索ボックスに「script」と入力してリストに出てきた「Google Apps Script」の「＋接続」ボタンを押します。 [drive2.png]
- もう一度「作成」ボタンを押して「スクリプト」選択します。
- 「スクリプトを作成」の下にある「空のプロジェクト」を選択します。[gas1.png]
- 新しいスクリプトを作る画面へ遷移するので、左上の「無題のプロジェクト」をクリックして、「Miyamoto-san」に変更します。[gas2.png]
- [main.gs](https://raw.githubusercontent.com/masuidrive/miyamoto/master/main.gs)をコピーして、ブラウザ内のエディタ部に貼り付けます。
- メニューから「ファイル」→「保存」を選択して保存します。

### 初期化
- ツールバーの「関数を選択」から「setUp」を選び、左の再生ボタンを押します。
- 権限の承認画面が出たら「承認する」を押してください。
- Google Drive上に「Slack Timesheets」というSpreadsheetが生成されます。

### APIの公開
- メニューから「公開」→「ウェブアプリケーションとして導入...」を選びます。[gas21.png]
- 先に「新しいバージョンを保存」ボタンを押した後、「アプリケーションにアクセスできるユーザ」から「全員（匿名ユーザを含む）」を選択します。[gas22.png]
- 「全員（匿名ユーザを含む）」が見つからない場合は、https://admin.google.com/ から「Google Apps」→「ドライブ」を選択して、「共有設定」の「ユーザは組織外のユーザとファイルを共有できる」を選択します。[admin1.png][admin2.png]
- 登録完了後に出るウインドーの「現在のウェブアプリケーションのURL」をどこかにコピーしておいてください。


## Slackへの設定


# 開発

## Todo

- 出勤日数の管理
- 時間外労働の扱い


## テストの実行

宮本さんはロジックの検証をNodeを使って行う事ができます。Nodeの実行環境を整えたら下記のコマンドを実行してください。

```
npm install
make test
```

## ソースコード

- main.js
 - HTTPを受け取る

- 入力内容を解析して、メソッドを呼び出す
 - Slackへの入出力

- gs_template.js
 - Google Spreadsheetを使ったメッセージテンプレート

- gs_properties.js
 - Google Spreadsheetを使った設定key-value store

- gs_timesheets.js
 - timesheetsをGoogle Spreadsheetに保存する処理

- gas_properties.js
 - Google Apps Scriptを使った設定key-value store

- gas_utils.js
 - Google Apps Script用のユーティリティ

- utils.js
 - globalで使うユーティリティ

- date_utils.js
 - 日付関係のユーティリティ

- underscore.js
 - _.で始まるユーティリティ集
 - http://underscorejs.org


# License

- [MIT License](http://opensource.org/licenses/MIT)
- Copyright 2014- Yuichiro MASUI <masui@masuidrive.jp>
- https://github.com/masuidrive/miyamoto
