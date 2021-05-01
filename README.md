# spiderable WIP
Meteor v1.6+  
Uses google's [puppeteer](https://pptr.dev/)
  
It works great, but code is messy :P

Latest changes:
- Using puppeteer 9.0.0 with chrome `r869685`
- Added caching (using `spidercache` mongo collection)
- Added sitemap.xml special rule (hacky)
- Added iron router's 404 page actually returning `404 - page not found`
- If too many requests are made it will return `409 - try again later`

TODO:
- Try using `puppeteer-core` to keep package size down (200MB is ridiculous!)
- Clean up everything!

## Install
Add the meteor package
```js
meteor add nooitaf:spiderable
```

## Evironment vars
You can optionaly use the URL to point to a different port, ip or domain.  
Default URL is `http://localhost:3000/`.  

```bash
# examples
export SPIDERABLE_URL="http://localhost:3000/"                  # default
export SPIDERABLE_TIMEOUT=2000                                  # default
export SPIDERABLE_HEADLESS=1                                    # 0=headfull; 1=headless (default)
export SPIDERABLE_ARGS='["--disable-dev-shm-usage","--headless","--no-sandbox","--disable-gpu","--single-process","--no-zygote"]'  # docker
export SPIDERABLE_SHOW_HEADERS=0                                # 0=only url (default); 1=full spider request header
export SPIDERABLE_CACHETIME=86400000                            # refresh cache after 1 day (milliseconds)
export SPIDERABLE_SITEMAP="http://localhost:3000/sitemap.xml"   # sitemap url hack (because crawlers use escaped fragment)
```

## Howto see if it's working
Open your page with `http://localhost:3000/?_escaped_fragment_=` should return full html.

## Docker
To use in docker you need to add this to your Dockerfile
```Dockerfile
# puppeteer deps:
RUN apt-get update \
    && apt-get install -y wget gnupg procps curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
    
# puppeteer deps (even more)
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    libxcb-dri3-dev
```

## Quirks
If you get following error try to increase your `TIMEOUT` to `10000` or more.
```text
MAIN ERROR TimeoutError: Timed out after 2000 ms while trying to connect to the browser! Only Chrome at revision r782078 is guaranteed to work.
``` 

## About
`spiderable` is part of [Webapp](https://github.com/meteor/meteor/tree/master/packages/webapp). It's one possible way to allow web search engines to index a Meteor application. It uses the [AJAX Crawling specification](https://developers.google.com/webmasters/ajax-crawling/) published by Google to serve HTML to compatible spiders (Google, Bing, Yandex, and more).

When a spider requests an HTML snapshot of a page the Meteor server runs the client half of the application inside [puppeteer](https://pptr.dev/), a headless chromium browser, and returns the full HTML generated by the client code.

In order to have links between multiple pages on a site visible to spiders, apps must use real links (eg `<a href="/about">`) rather than simply re-rendering portions of the page when an element is clicked. Apps should render their content based on the URL of the page and can use [HTML5 pushState](https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history) to alter the URL on the client without triggering a page reload. See the [Todos example](http://meteor.com/examples/todos) for a demonstration.

When running your page, `spiderable` will wait for all publications to be ready. Make sure that all of your [`publish functions`](#meteor_publish) either return a cursor (or an array of cursors), or eventually call [`this.ready()`](#publish_ready). Otherwise, the `puppeteer` executions will timeout.
