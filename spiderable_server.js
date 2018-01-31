var fs = Npm.require('fs');
var phantom = Npm.require('phantomjs-prebuilt');
var child_process = Npm.require('child_process');
var querystring = Npm.require('querystring');
var urlParser = Npm.require('url');
var path = Npm.require('path');

// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
// checkNpmVersions({ 'phantomjs-prebuilt': '>=2.1.16' }, 'nooitaf:spiderable');

// list of bot user agents that we want to serve statically, but do
// not obey the _escaped_fragment_ protocol. The page is served
// statically to any client whos user agent matches any of these
// regexps. Users may modify this array.
//
// An original goal with the spiderable package was to avoid doing
// user-agent based tests. But the reality is not enough bots support
// the _escaped_fragment_ protocol, so we need to hardcode a list
// here. I shed a silent tear.
Spiderable.userAgentRegExps = [
  /360spider/i,
  /adsbot-google/i,
  /ahrefsbot/i,
  /applebot/i,
  /baiduspider/i,
  /bingbot/i,
  /duckduckbot/i,
  /facebookbot/i,
  /facebookexternalhit/i,
  /google-structured-data-testing-tool/i,
  /googlebot/i,
  /instagram/i,
  /kaz\.kz_bot/i,
  /linkedinbot/i,
  /mail\.ru_bot/i,
  /mediapartners-google/i,
  /mj12bot/i,
  /msnbot/i,
  /msrbot/i,
  /oovoo/i,
  /orangebot/i,
  /pinterest/i,
  /redditbot/i,
  /sitelockspider/i,
  /skypeuripreview/i,
  /slackbot/i,
  /sputnikbot/i,
  /tweetmemebot/i,
  /twitterbot/i,
  /viber/i,
  /vkshare/i,
  /whatsapp/i,
  /yahoo/i,
  /yandex/i
];

// how long to let phantomjs run before we kill it (and send down the
// regular page instead). Users may modify this number.
Spiderable.requestTimeoutMs = 15 * 1000;
// maximum size of result HTML. node's default is 200k which is too
// small for our docs.
var MAX_BUFFER = 5 * 1024 * 1024; // 5MB

// Exported for tests.
Spiderable._urlForPhantom = function(siteAbsoluteUrl, requestUrl) {
  // reassembling url without escaped fragment if exists
  var parsedUrl = urlParser.parse(requestUrl);
  var parsedQuery = querystring.parse(parsedUrl.query);
  var escapedFragment = parsedQuery['_escaped_fragment_'];
  delete parsedQuery['_escaped_fragment_'];

  var parsedAbsoluteUrl = urlParser.parse(siteAbsoluteUrl);
  // If the ROOT_URL contains a path, Meteor strips that path off of the
  // request's URL before we see it. So we concatenate the pathname from
  // the request's URL with the root URL's pathname to get the full
  // pathname.
  if (parsedUrl.pathname.charAt(0) === "/") {
    parsedUrl.pathname = parsedUrl.pathname.substring(1);
  }
  parsedAbsoluteUrl.pathname = urlParser.resolve(parsedAbsoluteUrl.pathname,
    parsedUrl.pathname);
  parsedAbsoluteUrl.query = parsedQuery;
  // `url.format` will only use `query` if `search` is absent
  parsedAbsoluteUrl.search = null;

  if (escapedFragment !== undefined && escapedFragment !== null && escapedFragment.length > 0) {
    parsedAbsoluteUrl.hash = '!' + decodeURIComponent(escapedFragment);
  }

  return urlParser.format(parsedAbsoluteUrl);
};

var PHANTOM_SCRIPT_PATH = Assets.absoluteFilePath("phantom_script.js");

WebApp.connectHandlers.use(function(req, res, next) {
  // _escaped_fragment_ comes from Google's AJAX crawling spec:
  // https://developers.google.com/webmasters/ajax-crawling/docs/specification
  if (/\?.*_escaped_fragment_=/.test(req.url) ||
    _.any(Spiderable.userAgentRegExps, function(re) {
      return re.test(req.headers['user-agent']);
    })) {

    var url = Spiderable._urlForPhantom(process.env.SPIDERABLE_URL || Meteor.absoluteUrl(), req.url);
    var program = phantom.exec(
      // "--debug=true",
      "--cookies-file=/tmp/phamtom-cookies_"+ new Date().getTime(),
      "--disk-cache=true",
      "--disk-cache-path=/tmp/phantom-cache",
      "--ignore-ssl-errors=true",
      "--load-images=no",
      "--local-storage-path=/tmp/phantom-local-starage",
      "--local-url-access=false",
      "--local-to-remote-url-access=false",
      "--max-disk-cache-size=50000",
      "--web-security=false",
      "--debug=false",
      PHANTOM_SCRIPT_PATH,
      url
      )

    var stdout = ""
    program.stdout.on('data', Meteor.bindEnvironment(function(data){
      // console.log("{std out} ",data.toString('utf8'));
      stdout += data.toString('utf8')
    }))
    program.stderr.on('data', Meteor.bindEnvironment(function(data){
      console.log("{std err} ",data.toString('utf8'));
    }))
    program.on('exit', Meteor.bindEnvironment(
      function(code){
        if (code === 0 && /<html/i.test(stdout)) {
          // TODO - make optional
          console.log("Spiderable: " + url.toString())
          // console.log("User-Agent: " + req.headers['user-agent'].toString())
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=UTF-8'
          });
          res.end(stdout);
        } else {
          Meteor._debug("spiderable: phantomjs failed at " + url + ":", code, stdout);
          next();
        }
      })
    )
  } else {
    next();
  }
});
