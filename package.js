Package.describe({
  name: "nooitaf:spiderable",
  summary: "Makes the application crawlable to web spiders.",
  version: "1.0.2",
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nooitaf/meteor-spiderable.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "phantomjs-prebuilt": "2.1.16"
});

Package.onUse(function (api) {
  api.versionsFrom('1.6');
  api.use('webapp@1.4.0', 'server');
  api.use(['ddp@1.4.0', 'tracker@1.1.3'], 'client');
  api.use(['callback-hook@1.0.10'], 'client');
  api.use(['templating@1.3.2'], 'client');
  api.use(['underscore@1.0.10'], ['client', 'server']);

  api.export('Spiderable');

  api.addFiles('spiderable.html', 'client');
  api.addFiles('spiderable.js', ['client', 'server']);
  api.addFiles('spiderable_server.js', 'server');
  api.addFiles('spiderable_client.js', 'client');

  api.addAssets('phantom_script.js', 'server');
});

Package.onTest(function (api) {
  api.use(['spiderable', 'tinytest', 'underscore', 'ddp']);
  api.addFiles('spiderable_client_tests.js', 'client');
  api.addFiles('spiderable_server_tests.js', 'server');
});
