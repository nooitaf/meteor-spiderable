Package.describe({
  name: "nooitaf:spiderable",
  summary: "Makes app crawlable to web spiders using googles puppeteer.",
  version: "2.0.8",
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nooitaf/meteor-spiderable.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'puppeteer':'5.2.1',
  "ps-node-promise-es6": "0.0.1",
  "child-process-promise":"2.2.1"
})

Package.onUse(function (api) {
  api.versionsFrom('1.6');
  api.use('ecmascript');
  api.use('webapp@1.4.0', 'server');
  api.use(['ddp@1.4.0', 'tracker@1.1.3'], 'client');
  api.use(['callback-hook@1.0.10'], 'client');

  api.use(['templating@1.3.2'], 'client');
  api.use(['underscore@1.0.10'], ['client', 'server']);
  api.use('tmeasday:check-npm-versions@0.3.1');

  api.export('Spiderable');

  api.addFiles('spiderable.html', 'client');
  api.addFiles('spiderable.js', ['client', 'server']);
  api.addFiles('spiderable_server.js', 'server');
  api.addFiles('spiderable_client.js', 'client');

});

