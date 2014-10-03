QUnit.test( "EventListener", function(assert) {
  var results = [];

  var obj = new EventListener();
  obj.on('test1', function(e) {
    results.push('TEST1:'+e);
  });

  obj.on('test2', function(e) {
    results.push('TEST2:'+e);
  });

  obj.fireEvent('test1', 'A');
  assert.ok(results.length == 1 && results[0] == 'TEST1:A');

  obj.fireEvent('test2', 'B');
  assert.ok(results.length == 2 && results[0] == 'TEST1:A' && results[1] == 'TEST2:B');

  obj.fireEvent('test1', 'C');
  assert.ok(results.length == 3 && results[0] == 'TEST1:A' && results[1] == 'TEST2:B' && results[2] == 'TEST1:C');
});
