chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  sendResponse({});
  const newtab = open();
  if (newtab) {
    // viewport
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0';

    // css
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = chrome.runtime.getURL('newtab/css/index.css');

    // url
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.value = location.href;
    urlInput.readOnly = true;

    // hostnames
    const hostnamesInput = document.createElement('textarea');
    hostnamesInput.value = JSON.stringify(message.hostnames, null, 2);
    hostnamesInput.readOnly = true;

    // inject
    const fragment = document.createDocumentFragment();
    fragment.appendChild(viewport);
    fragment.appendChild(cssLink);
    fragment.appendChild(urlInput);
    fragment.appendChild(hostnamesInput);
    newtab.document.body.appendChild(fragment);
  }
});
