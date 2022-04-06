const DEFAULT_RULES = [
  'onBeforeRequest',
  'onBeforeSendHeaders',
  'onSendHeaders',
  'onHeadersReceived',
  'onAuthRequired',
  'onResponseStarted',
  'onBeforeRedirect',
  'onCompleted',
  'onErrorOccurred',
];

let config = null;
let tabId = -1;
let workStatus = false;
let hostnames = [];

// contextMenus id
let startId = -1;
let stopId = -1;

function reset() {
  if (workStatus) {
    chrome.webRequest[DEFAULT_RULES[config.index]].removeListener(callback);
  }
  config = null;
  tabId = -1;
  workStatus = false;
  hostnames = [];
  chrome.storage.local.clear();
}

function getStatus() {
  console.log({
    config: config,
    tabId: tabId,
    workStatus: workStatus,
    hostnames: hostnames,
  });
}

function updateContextMenus() {
  chrome.contextMenus.update(startId, {
    enabled: !!config && !workStatus,
  });
  chrome.contextMenus.update(stopId, {
    enabled: workStatus,
  });
}

function onStop() {
  chrome.webRequest[DEFAULT_RULES[config.index]].removeListener(callback);
  tabId = -1;
  workStatus = false;
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

chrome.storage.onChanged.addListener(function (changes) {
  if (workStatus) {
    onStop();
  }

  if (changes.config) {
    // sync
    if ('newValue' in changes.config) {
      config = changes.config.newValue;
    }
  }

  updateContextMenus();
});

chrome.tabs.onRemoved.addListener(function (id) {
  if (id === tabId) {
    onStop();
  }
});

// start
chrome.storage.local.get('config', function (res) {
  if ('config' in res) {
    config = res.config;
  }

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
        workStatus = true;
        chrome.webRequest[DEFAULT_RULES[config.index]].addListener(callback, {
          tabId: tabId,
          urls: ['<all_urls>'],
        });
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
});
