var fs = Npm.require('fs');
var puppeteer = Npm.require('puppeteer');
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


WebApp.connectHandlers.use(async function(req, res, next) {
  const promises = []
  // _escaped_fragment_ comes from Google's AJAX crawling spec:
  // https://developers.google.com/webmasters/ajax-crawling/docs/specification
  if (/\?.*_escaped_fragment_=/.test(req.url) ||
    _.any(Spiderable.userAgentRegExps, function(re) {
      return re.test(req.headers['user-agent']);
    })) {
    
    var url = process.env.SPIDERABLE_URL || Meteor.absoluteUrl()
    url = url + req.url.substr(1)
    url = url.replace('?_escaped_fragment_=', '')
    
    console.log("Spiderable:", url)
    const browser = await puppeteer.launch({
      // headless: false
    })


    const page = await browser.newPage()
    await page.goto(url)
    
    try {
      await page.waitFor(function(){
        if (typeof Meteor === 'undefined'
          || Meteor.status === undefined
          || !Meteor.status().connected) {
          return false;
        }
        // return true
        if (typeof Tracker === 'undefined'
            || Tracker.flush === undefined) {
          return false;
        }
        if (typeof DDP === 'undefined'
            || DDP._allSubscriptionsReady === undefined) {
          return false;
        }
        Tracker.flush()
        return DDP._allSubscriptionsReady()
      },{
        timeout: process.env.SPIDERABLE_TIMEOUT || 2000
      })

      const html = await page.content()
      await browser.close()
      
      if (/<!DOC/i.test(html)) {
        // TODO - make optional
        console.log("Spiderable [finished]: " + url.toString())
        
        // replace nonsense
        var out = html;
        out = out.replace(/<script[^>]+>(.|\n|\r)*?<\/script\s*>/ig, '');
        out = out.replace('<meta name="fragment" content="!">', '');
        
        // console.log("User-Agent: " + req.headers['user-agent'].toString())
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=UTF-8'
        });
        res.end(out);
      } else {
        console.log('no html')
        Meteor._debug("spiderable: puppeteer failed at " + url + ":");
        next();
      }

    } catch (e) {
      console.log('puppeteer failed:', url, e)
      await browser.close()
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8'
      });
      res.end('...')
    } 
  } else {
    next();
  }
});
