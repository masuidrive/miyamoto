# Timesheet bot - Miyamoto-san

- [Japanese README](README.md)

This is a timesheet app integrated with Slack, written by Google Apps Script.

We forked [Original version](https://github.com/masuidrive/miyamoto) to use it for Georepublic.

You can say like below for tracking your working times in Slack.

![demo1](https://raw.githubusercontent.com/masuidrive/miyamoto/master/docs/images/demo1.png)


## Chatting Examples

- morning ← Start working from the current time
- hi 12:00 12:00 ← Start working with the specified time
- morning 10/2 12:00 ← You can set start working time with past date and time
- see you ← Stop working with current time
- bye 20:00 ← Stop working with the specified time 
- 明日はお休みです ← Decrare a day off
- 10/1はお休みです ← Decrare a day off
- 明日のお休みを取り消します ← Cancel a day off
- 明日はやっぱり出勤します ← Cancel a day off
- whois ← List of working people
- who is 休み ← List of people who is having a day off
- 9/21は誰がお休み？ ← 指定日の休暇リスト

# How to use

If you say commands in the #_timesheet channel on the Slack, the record will be logged on your handle name's sheet in `Slack Timesheet` spreadsheet.

You can specify which day is holidays on the sheet.

## Change messages

If you want to change messages from the bot, please change text in `_メッセージ` sheet in the `Slack Timesheet`  
If you create multiple rows, the bot will pick one randomly.
Feel free to add/modify it!

## 仕様/Limitation

- Slack user name should not contain `.`(dot). Mentioning will be failed.

# 開発/Development

If you push your code to the master branch, the script will automatically deployed to the Google App Script.

Please don't modify main.gs directory. it will be created by `make upload` command during the deployment process.

Please see [DEVELOPMENT.md](DEVELOPMENT.md) for the development details.

## Todo

See issues

## Test

```
npm install
make test
```

## Files

- main.js
  - HTTP handler

- timesheets.js
  - Read inputs and call methods

- slack.js
  - Input/Output from/to Slack

- gs_template.js
  - Message template handler using Google Spreadsheet

- gs_properties.js
  - Key/Value store of settings using Google Spreadsheet

- gs_timesheets.js
  - Save timesheet data on the Google Spreadsheet

- gas_properties.js
  - Key/Value store of settings using Google Apps Script

- gas_utils.js
  - Utilities for Google Apps Script

- utils.js
  - Utilities of global

- date_utils.js
  - Date time utilities

- underscore.js
  - Utilities starting from _.
  - http://underscorejs.org


# License

- [MIT License](http://opensource.org/licenses/MIT)
- Copyright 2014- Yuichiro MASUI <masui@masuidrive.jp>
- https://github.com/masuidrive/miyamoto
