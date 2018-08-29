# Kintai API

## Specification

|Item|Description|
|---|---|
|Base URL|https://script.google.com/macros/s/.../exec <br> Ask API developer.|
|Method|POST|
|Request|QueryString|
|Response|JSON|

## Commands

### generateAccessToken

Generate an access token for API authentication.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`generateAccessToken`|

#### Response

|Name|Type|Description|
|---|---|---|
|code|integer|Status code. <br> `202`: created, `4xx`: failure.|
|message|string|Optional. Error message.|
|access_token|string|Generated access token. <br> Version 4 UUID (`RRRRRRRR-RRRR-4RRR-rRRR-RRRRRRRRRRRR`) format.|
|auth_url|string|Authentication URL to redirect user for.|
|datetime|DateTime|Datetime of query. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample query:
```
command=generateAccessToken
```

Sample response:
```json
{
  "code": 202,
  "access_token": "58d12bc1-08d0-4e94-9440-75562f22027a",
  "auth_url": "https://slack.com/oauth/authorize?scope=users.profile:read&client_id=1048553852.9553671552&state=58d12bc1-08d0-4e94-9440-75562f22027a",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```

### getUserInformation

Obtain user's information.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`getUserInformation`|
|access_token|string|User's access token|

#### Response

|Name|Type|Description|
|---|---|---|
|code|integer|Status code. <br> `200`: OK, `4xx`: failure.|
|message|string|Optional. Error message.|
|display_name|string|User's display name of Slack.|
|real_name|string|User's real name of Slack.|
|slack_access_token|string|User's access token of Slack.|
|datetime|DateTime|Datetime of query. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample query:
```
command=getUserInformation&access_token=58d12bc1-08d0-4e94-9440-75562f22027a
```

Sample response:
```json
{
  "code": 200,
  "display_name": "toshikish",
  "real_name": "Toshiki Shimomura",
  "slack_access_token": "xoxp-1111827399-16111519414-20367011469-5f89a31i07",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
```json
{
  "code": 404,
  "message": "User not found.",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```

### getStatus

Check whether user has not signed in, already signed in, or signed out.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`getStatus`|
|access_token|string|User's access token.|
|username|string|[WILL BE DEPRECATED] User's name of Slack.|

- Either `access_token` or `username` is required.
- **It is recommended to use `access_token`.**

#### Response

|Name|Type|Description|
|---|---|---|
|code|integer|Status code. <br> `200`: OK, `4xx`: failure.|
|message|string|Optional. Error message.|
|status|string|User's status.<br>`notSignedIn` (未出勤), `signedIn` (出勤済み), `signedOut` (退勤済み).|
|username|string|User's display name of Slack.|
|datetime|DateTime|Datetime of query. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample query:
```
command=getStatus&access_token=58d12bc1-08d0-4e94-9440-75562f22027a
```

Sample response:
```json
{
  "code": 200,
  "status": "signedIn",
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
```json
{
  "code": 404,
  "message": "User not found.",
  "username": "NonExistingUser",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```

### signIn

Make user sign in.

#### Query

|Name|Type|Description|
|---|---|---|
|command|string|`signIn`|
|access_token|string|User's access token.|
|username|string|[WILL BE DEPRECATED] User's name of Slack.|

- Either `access_token` or `username` is required.
- **It is recommended to use `access_token`.**

#### Response

|Name|Type|Description|
|---|---|---|
|code|integer|Status code. <br> `200`: OK, `4xx`: failure.|
|message|string|Optional. Error message.|
|status|string|User's status.<br>`notSignedIn` (未出勤), `signedIn` (出勤済み), `signedOut` (退勤済み).|
|username|string|User's display name of Slack.|
|datetime|DateTime|Datetime of signing in. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample query:
```
command=signIn&access_token=58d12bc1-08d0-4e94-9440-75562f22027a
```

Sample response:
```json
{
  "code": 200,
  "status": "signedIn",
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
```json
{
  "code": 400,
  "message": "Already signed in.",
  "status": "signedIn",
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
|access_token|string|User's access token.|
|username|string|[WILL BE DEPRECATED] User's name of Slack.|

- Either `access_token` or `username` is required.
- **It is recommended to use `access_token`.**

#### Response

|Name|Type|Description|
|---|---|---|
|code|integer|Status code. <br> `200`: OK, `4xx`: failure.|
|message|string|Optional. Error message.|
|status|string|User's status.<br>`notSignedIn` (未出勤), `signedIn` (出勤済み), `signedOut` (退勤済み).|
|username|string|User's display name of Slack.|
|datetime|DateTime|Datetime of signing in. <br> ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) format.|

Sample query:
```
command=signOut&access_token=58d12bc1-08d0-4e94-9440-75562f22027a
```

Sample response:
```json
{
  "code": 200,
  "status": "signedOut",
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
```json
{
  "code": 400,
  "message": "Already signed out.",
  "status": "signedOut",
  "username": "toshikish",
  "datetime": "2018-08-16T05:44:00.000Z"
}
```
