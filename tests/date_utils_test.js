QUnit.test( "DateUtils.parseTime", function(assert) {
  assert.ok(_.isEqual([13,1], DateUtils.parseTime("13:01")), "13:01");
  assert.ok(_.isEqual([14,2], DateUtils.parseTime("2:02pm")), "2:02pm");
  assert.ok(_.isEqual([16,3], DateUtils.parseTime("午後4:3")), "午後4:3");
  assert.ok(_.isEqual([17,0], DateUtils.parseTime("5pm")), "5pm");
  assert.ok(_.isEqual([17,1], DateUtils.parseTime("5:1pm")), "5:1pm");
  assert.ok(_.isEqual([18,0], DateUtils.parseTime("18時")), "18時");
  assert.ok(_.isEqual([19,20], DateUtils.parseTime("19 : 20")), "19 : 20");
  assert.ok(_.isEqual([20,0], DateUtils.parseTime("午後８")), "午後８");

  // 下記の様な書き方はサポートしない
  assert.ok(_.isEqual(null, DateUtils.parseTime("お昼")), "お昼");
});

QUnit.test( "DateUtils.parseDate", function(assert) {
  DateUtils.now(new Date(2016, 1-1, 1, 0, 0, 0));
  assert.ok(_.isEqual([2015,12,1], DateUtils.parseDate("12/1")), "12/1");
  assert.ok(_.isEqual([2016,1,1], DateUtils.parseDate("1/1")), "1/1");
  assert.ok(_.isEqual([2016,2,3], DateUtils.parseDate("2月3日")), "2月3日");
  assert.ok(_.isEqual([2020,1,1], DateUtils.parseDate("2020/1/1")), "2020/1/1");
  assert.ok(_.isEqual([1976,2,8], DateUtils.parseDate("1976年2月8日")), "1976年2月8日");
  assert.ok(_.isEqual([2015,12,31], DateUtils.parseDate("昨日")), "昨日");
  assert.ok(_.isEqual([2016,1,1], DateUtils.parseDate("今日")), "今日");
  assert.ok(_.isEqual([2016,1,2], DateUtils.parseDate("明日")), "明日");

  DateUtils.now(new Date(2016, 12-1, 1, 0, 0, 0));
  assert.ok(_.isEqual([2017,1,1], DateUtils.parseDate("1/1")), "1/1");
  assert.ok(_.isEqual([2016,11,30], DateUtils.parseDate("昨日")), "昨日");
  assert.ok(_.isEqual([2016,12,1], DateUtils.parseDate("今日")), "今日");
  assert.ok(_.isEqual([2016,12,2], DateUtils.parseDate("明日")), "明日");

  // 下記の様な書き方はサポートしない
  assert.ok(_.isEqual(null, DateUtils.parseDate("3日後")), "3日後");
});

QUnit.test( "DateUtils.parseWday", function(assert) {
  assert.ok(_.isEqual([3], DateUtils.parseWday("水曜日")), "水曜日");
  assert.ok(_.isEqual([3], DateUtils.parseWday("Wed")), "Wed");
  assert.ok(_.isEqual([], DateUtils.parseWday("あ")), "あ");
  assert.ok(_.isEqual([0,1], DateUtils.parseWday("月日")), "月日");
});
