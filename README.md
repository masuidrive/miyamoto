# 勤怠管理bot - みやもとさん

Google Apps Scriptで書かれた、Slack上で動く勤怠管理Bot。
Georepublic Japan 内での利用用にカスタマイズしています。

Slackで下記の様につぶやくと、みやもとさんがGoogle Spreadsheetに勤怠を記録してくれます。

![demo1](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/demo1.png)


## 会話例/Examples

- おはようございます ← 現在時刻で出勤
- おはようございます 12:00 ← 指定時刻で出勤
- おはようございます 10/2 12:00 ← 過去に遡って出勤を記録する
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

# 動かす/How to use

Slackの#_timesheetチャンネルで「おはよう」と発言すると、先の「Slack Timesheets」にユーザ名のタブが作られて、時間が記録されます。

週の休日は「Day Off」の欄に,(カンマ)区切りで入力します。

![gs2](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gs2.png)

## メッセージの変更/Change messages

Spreadsheetの「_メッセージ」シートに各メッセージのテンプレートが書かれています。縦に複数設定すると、ランダムで選択されます。

ココを変更するとみやもとさんのキャラが変わります。ぜひ面白い設定をしてください。


## 仕様/Limitation

- ユーザ名に.(ドット)が入っている場合に、mentionにならないのはSlack Webhookの仕様です。
- Private Groupに設置することはできません
- ユーザは一部屋90人ぐらいまでです。それ以上でお使いの場合は部単位などで部屋を分けて下さい。

# 開発/Development

If you puwh your code to the master branch, the script will automatically deployed to the Google App Script

## Todo

- 出勤日数の管理
- 時間外労働の扱い
- 休憩時間

## テストの実行

みやもとさんはロジックの検証をNodeを使って行う事ができます。Nodeの実行環境を整えたら下記のコマンドを実行してください。

```
npm install
make test
```

## ソースコード/Source codes

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
