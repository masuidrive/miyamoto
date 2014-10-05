// node-qunitを使ったtestrunner
//

var runner = require("./node_modules/qunit");
runner.setup({
  log: {
    assertions: true,
    summary: true
  }
});

runner.run([
  //
  {
    code: "./scripts/date_utils.js",
    tests: "./tests/date_utils_test.js",
    deps: "./scripts/underscorejs.js"
  },

  //
  {
    code: "./scripts/event_listener.js",
    tests: "./tests/event_listener_test.js",
    deps: "./scripts/underscorejs.js"
  },

  //
  {
    code: "./scripts/timesheets.js",
    tests: "./tests/timesheets_test.js",
    deps: [
      "./scripts/underscorejs.js",
      "./scripts/event_listener.js",
      "./scripts/date_utils.js",
    ]
  }
]);
