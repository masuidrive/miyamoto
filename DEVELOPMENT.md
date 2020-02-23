# How to build a development enviromnent

## Install requirements

```
npm install
```

## Setup gas-config

```
% ./node_modules/gas-manager/bin/gas init
===================
Start gas-manager init
===================

This utility is will walk you through creating a gas-manager's config file.
Press ^C at any time to quit.

Do you have client_id & client_secret for Google OAuth2? [yes/no] 
```

Please follow the instructions. It will create a file named `gas-config.json`

## Create Google Apps Script

Run below command

```
% make upload
```

It will deploy new Google Apps Script.

## Create timesheet

Previous process will create new Google Apps Script.
Please open it and copy `Current web app URL`. You can get the info from the menu > Publish > Deploy as Web App.

After that, you will need to run 'setUp' function once. It will create a Google Spreadsheed called `Slack Timesheet`

![gas](https://i.gyazo.com/a6cc4378ca047d95053589d983773b96.png)

## Set up Slack

Go to Slack and add new integrations. (If you don't have a parmission, please ask.)

### Outgoing WebHooks

1. Select your test channel 
2. Paste `Current web app URL` into URL(s).

### Incoming WebHooks

1. Select your test channel
2. Copy `Webhook URL`
3. Change your bot name
4. Paste the URL to `Slack Incoming URL` cell on the `Slack Timesheet`.
5. Add your bot name to the `無視するユーザ`.

![spread](https://i.gyazo.com/8115e524e1e682db1923f1498d5572c6.png)


### Test

Please say `hi` on your test channel. The bot will create new record on the timesheet and reploy something.

That's All! Pull Requests are very welcome!

You can find additional inormation from [Original Repos](https://github.com/masuidrive/miyamoto)