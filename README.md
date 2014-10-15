# 勤怠管理bot - 宮本さん

Google Apps Scriptで書かれた、Slack用勤怠管理Bot。

Slackで下記の様につぶやくと、宮本さんがGoogle Spreadsheetに記録してくれます。


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


## 設置方法

### Google Apps Scriptに設置

- https://drive.google.com/ を開いて

- 左上の「無題のプロジェクト」をクリックして、「Miyamoto-san」に変更します。
- [main.gs](https://raw.githubusercontent.com/masuidrive/miyamoto/master/main.gs)をコピーして、ブラウザ内のエディタに貼り付けます。
- メニューから「ファイル」→「保存」を選択して保存します
- メニューから「公開」→「ウェブアプリケーションとして導入...」を選びます。



## ソースコード

### main.js

- HTTPを受け取る


### timesheets.js

- 入力内容を解析して、メソッドを呼び出す


### slack.js

- Slackへの入出力


### gs_template.js

- Google Spreadsheetを使ったメッセージテンプレート


### gs_properties.js

- Google Spreadsheetを使った設定key-value store


### gs_timesheets.js

- timesheetsをGoogle Spreadsheetに保存する処理


### utils.js

- globalで使うユーティリティ


### date_utils.js

- 日付関係のユーティリティ


### gas_utils.js

- Google Apps Script用のユーティリティ


### underscore.js

- _.で始まるユーティリティ集
- http://underscorejs.org


## テストの実行

### nodeで実行

```
npm install
make test
```
