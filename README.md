# 勤怠管理bot - みやもとさん

Google Apps Scriptで書かれた、Slack上で動く勤怠管理Bot。

Slackで下記の様につぶやくと、みやもとさんがGoogle Spreadsheetに勤怠を記録してくれます。

![demo1](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/demo1.png)


## 会話例

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


# 設置方法

みやもとさんは、プログラム本体をGoogle Driveに保存して実行します。データはGoogle Spreadsheetに保存されます。

インストールは下記の手順に従ってください。


## Google Apps Scriptへ設置

### プログラム本体を設置

- https://drive.google.com/ を開いて画面左にある、赤い「作成」ボタンを押します。
- 最下部の「アプリを追加」を押してダイアログを開きます。
- ダイアログの検索ボックスに「script」と入力してリストに出てきた「Google Apps Script」の「＋接続」ボタンを押します。

![drive0](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/drive0.png)


- もう一度「作成」ボタンを押して「スクリプト」選択します。
- 「スクリプトを作成」の下にある「空のプロジェクト」を選択します。
- 新しいスクリプトを作る画面へ遷移するので、左上の「無題のプロジェクト」をクリックして、「Miyamoto-san」に変更します。

![gas03](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gas03.png)


- [main.gs](https://raw.githubusercontent.com/masuidrive/miyamoto/master/main.gs)をコピーして、ブラウザ内のエディタ部に貼り付けます。
- メニューから「ファイル」→「保存」を選択して保存します。
- メニューの「ファイル」→「プロジェクトのプロパティ」を開いて「Time zone」を「東京」に合わせてください。

#### 祝日

手動で祝日を入力する場合にはこの項目は必要ないので「初期化」に進んでください。

- [Google Developers Console](https://console.developers.google.com)でCalendar APIを有効にしたプロジェクトを作ります。
- 「認証情報」→「公開 API へのアクセス」を開いて「新しいキーを作成」を押し、「サーバー キー」を選び作成します。
- 「API キー」が表示されるので覚えておきます。
- （このキーがGoogle Apps Scriptから使えるようになるまで3分程かかるので待ちます。）
- Google Apps Scriptに戻り「ファイル」→「プロジェクトのプロパティ」を開き「スクリプトのプロパティ」に「apiKey」という名前で先ほどの「API キー」を入力してください。


### 初期化

- ツールバーの「関数を選択」から「setUp」を選び、左の再生ボタンを押します。

![gas11](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gas11.png)

- 権限の承認画面が出たら「承認する」を押してください。
- Google Drive上に「Slack Timesheets」というSpreadsheetが生成されます。


### APIの公開

- メニューから「公開」→「ウェブアプリケーションとして導入...」を選びます。
- 先に「新しいバージョンを保存」ボタンを押した後、「アプリケーションにアクセスできるユーザ」から「全員（匿名ユーザを含む）」を選択します。
- 同時に「次のユーザーとしてアプリケーションを実行」を「自分」に変更します。
- 登録完了後に出るウインドーの「現在のウェブアプリケーションのURL」をどこかにメモしておいてください。

![gas20](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gas20.png)


- 「全員（匿名ユーザを含む）」が見つからない場合は、https://admin.google.com/ から「Google Apps」→「ドライブ」を選択して、「共有設定」の「ユーザは組織外のユーザとファイルを共有できる」を選択します。

![admin2](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/admin2.png)



## Slackへの設定

- SlackのWebサイトへログインし、「timesheets」チャンネルを追加します。

### Slack Outgoingの設定

- 左上のメニューから「Configure Integration」を選びます。

![slack11](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/slack11.png)

- ページ下部の「DIY Integrations & Customizations」から「Outgoing WebHooks」を選びます。
- 緑の「Add Outgoing Webhook」を押します。
- 「Integration Settings」の「Channel」を「#timesheets」を選択し、「URL(s)」には「APIの公開」でメモをした「現在のウェブアプリケーションのURL」を入力し、「Save Integration」を押します。

![slack13](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/slack13.png)


### Slack Imcomingの設定

- 左のサイドバーの「Add New Integration」から「Incoming WebHooks」を選びます。
- ページ最下部の「Choose a channel...」から「#timesheets」を選択して、「Add Incoming WebHook」を選択します。
- 遷移したページの「Your Unique Webhook URL」の下に書かれているURLをどこかにメモしておきます。

![slack21](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/slack21.png)

- 「Integration Settings」右の「Expand」を押して、「change the name of your bot」をクリックし「miyamoto」を指定します。

![slack22](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/slack22.png)

- 「miyamoto」以外の名前を指定する場合は、Spreadsheetの「_設定」の「無視するユーザ」にその名前を加えてください。

## みやもとさんの設定

- https://drive.google.com/ から「Slack Timesheets」を選びます。
- メニューの「ファイル」→「スプレッドシートの設定」を開いて「タイムゾーン」を「東京」に合わせてください。
- 下のタブから「_設定」を開き、「Slack Imcoming URL」がある「B1」に「Slackへの設定」でメモした「Your Unique Webhook URL」を入力します。
- このbotの名前を変更した場合は、「無視するユーザ」にその名前を加えてください。

![gs3](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gs3.png)


# 動かす

Slackの#timesheetsチャンネルで「おはよう」と発言すると、先の「Slack Timesheets」にユーザ名のタブが作られて、時間が記録されます。

当日の日付が二つ並んでいますが、B〜C列を時間表示に切り替える必要があります。範囲指定をしてメニューの「表示形式」→「数字」→「時間」を選択してください。

週の休日は「Day Off」の欄に,(カンマ)区切りで入力します。

![gs2](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/gs2.png)

これで設置が終わりました。どんなメッセージに反応するかは、[timesheets.js](https://github.com/masuidrive/miyamoto/blob/master/scripts/timesheets.js#L29)の正規表現を読み解いてください。

また、このシートを編集不可で共有することで、勤務時間の確認などが簡単に行えるようになります。

## ご協力ください

みやもとさんを使ってる方は、ぜひ[みやもとさん調査](https://docs.google.com/forms/d/1Rnis14t2OImkwvfOc2L0B3GmvByxu6jVRoAcxJLY1tc/viewform?usp=send_form)にご協力ください。

開発の参考にさせていただきます。


## メッセージの変更

Spreadsheetの「_メッセージ」シートに各メッセージのテンプレートが書かれています。縦に複数設定すると、ランダムで選択されます。

ココを変更するとみやもとさんのキャラが変わります。ぜひ面白い設定をしてください。


## 仕様

- ユーザ名に.(ドット)が入っている場合に、mentionにならないのはSlack Webhookの仕様です。
- Private Groupに設置することはできません
- ユーザは一部屋90人ぐらいまでです。それ以上でお使いの場合は部単位などで部屋を分けて下さい。

# 開発

- コードを変更したときには、メニューの「ファイル」→「版の管理...」で「新しいバージョンを保存」してから、「公開」→「ウェブアプリケーションとして導入...」の「プロジェクトバージョン」を最新にする必要があります。


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
