var page = require('webpage').create();
var args = require('system').args;
var url = args[1].toString('utf8') || "http://localhost:3000"

var tries = 0

var isReady = function () {
  tries++
  if (tries > 10) phantom.exit()
  return page.evaluate(function () {
    if (typeof Meteor === 'undefined'
        || Meteor.status === undefined
        || !Meteor.status().connected) {
      return false;
    }
    if (typeof Tracker === 'undefined'
        || Tracker.flush === undefined) {
      return false;
    }
    if (typeof DDP === 'undefined'
        || DDP._allSubscriptionsReady === undefined) {
      return false;
    }
    return function(){
      Tracker.flush()
      return DDP._allSubscriptionsReady()
    }
  });
};

var dumpPageContent = function () {
  var out = page.content;
  out = out.replace(/<script[^>]+>(.|\n|\r)*?<\/script\s*>/ig, '');
  out = out.replace('<meta name="fragment" content="!">', '');
  console.log(out);
};


page.open(url, function(status) {
  if (status === 'fail') {
    phantom.exit();
  } else {
    if (isReady()) {
      dumpPageContent();
      phantom.exit();
    }
    var interval = setInterval(function() {
      if (isReady()) {
        dumpPageContent();
        clearInterval(interval)
        phantom.exit();
      }
    }, 100);
  }
});


page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }
    // uncomment to log into the console
    // console.error(msgStack.join('\n'));
};
