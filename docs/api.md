# Kintai API

## Specification

|Item|Description|
|---|---|
|Base URL|https://script.google.com/macros/s/.../exec <br> Ask API developer.|
|Method|POST|
|Request|QueryString|
|Response|JSON|

## Commands

### getStatus

Check whether user has not signed in, already signed in, or signed out.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`getStatus`|
|username|string|User's name of Slack|

#### Response

|Name|Type|Description|
|---|---|---|
|status|string|User's status.<br>`notSignedIn` (未出勤), `signedIn` (出勤済み), `signedOut` (退勤済み).|
|username|string|Same as the query.|
|datetime|DateTime|Datetime of query. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample response:
```json
{
  "status": "signedIn",
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```

### signIn

Make user sign in.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`signIn`|
|username|string|User's name of Slack|

#### Response

|Name|Type|Description|
|---|---|---|
|username|string|Same as the query.|
|datetime|DateTime|Datetime of signing in. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample response:
```json
{
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```

### signOut

Make user sign out.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`signOut`|
|username|string|User's name of Slack|

#### Response

|Name|Type|Description|
|---|---|---|
|username|string|Same as the query.|
|datetime|DateTime|Datetime of signing in. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample response:
```json
{
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
