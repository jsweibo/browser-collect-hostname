let config = null;
let tabId = -1;
let hostnames = [];

// contextMenus id
let startId = -1;
let stopId = -1;

function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      // sync
      config = res.config;

      // remove old context menus
      chrome.contextMenus.removeAll(function () {
        initContextMenus();
      });
    } else {
      // writing settings will invoke chrome.storage.onChanged
      chrome.storage.local.set({
        config: DEFAULT_SETTINGS,
      });
    }
  });
}

function getStatus() {
  console.log({
    config: config,
    tabId: tabId,
    hostnames: hostnames,
  });
}

function initContextMenus() {
  startId = chrome.contextMenus.create({
    title: 'Start',
    onclick(info, tab) {
      const protocol = new URL(tab.url).protocol;
      if (protocol === 'http:' || protocol === 'https:') {
        // prevent duplicate clicks
        chrome.contextMenus.update(startId, {
          enabled: false,
        });

        tabId = tab.id;
        chrome.webRequest[DEFAULT_SETTINGS.rules[config.index]].addListener(
          callback,
          {
            tabId: tabId,
            urls: ['<all_urls>'],
          }
        );
        updateContextMenus();
      }
    },
  });

  stopId = chrome.contextMenus.create({
    title: 'Stop',
    enabled: false,
    onclick() {
      // prevent duplicate clicks
      chrome.contextMenus.update(stopId, {
        enabled: false,
      });

      chrome.tabs.sendMessage(
        tabId,
        {
          hostnames: hostnames,
        },
        function () {
          onStop();
        }
      );
    },
  });

  chrome.contextMenus.create({
    title: 'GetStatus',
    onclick() {
      getStatus();
    },
  });

  updateContextMenus();
}

function updateContextMenus() {
  chrome.contextMenus.update(startId, {
    enabled: !!config && tabId === -1,
  });
  chrome.contextMenus.update(stopId, {
    enabled: tabId !== -1,
  });
}

function onStop() {
  chrome.webRequest[DEFAULT_SETTINGS.rules[config.index]].removeListener(
    callback
  );
  tabId = -1;
  hostnames = [];
  updateContextMenus();
}

function callback(requestDetails) {
  const hostname = new URL(requestDetails.url).hostname;
  if (hostnames.indexOf(hostname) === -1) {
    hostnames.push(hostname);
  }
}

chrome.browserAction.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

chrome.tabs.onRemoved.addListener(function (id) {
  if (id === tabId) {
    onStop();
  }
});

chrome.storage.onChanged.addListener(function () {
  // clear
  if (tabId !== -1) {
    onStop();
  }

  // restart
  start();
});

// start
start();
