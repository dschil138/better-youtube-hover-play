let isScrolling = false;
let enterListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };
let mouseSensitivity = 2;
let fullHoverDisable = 0;
let longPressPlay = false;
let wasfullHoverDisable = false;
let longClickSetting = 1;

function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 500);
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "runInit") {
    init();
    sendResponse({ result: "Init function rerun" });
  }
  return true;
});


function syncSettings() {
  chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting'], function(data) {
    if (data.fullHoverDisable) {
      fullHoverDisable = parseInt(data.fullHoverDisable, 10);
    }
    if (data.longClickSetting) {
      longClickSetting = parseInt(data.longClickSetting, 10);
    }
  });
}


function init() {
  syncSettings();

  window.addEventListener('mousemove', (e) => {
    // trigger the preview if the mouse has moved enough
    const distance = Math.sqrt(
      Math.pow(e.clientX - lastKnownMousePosition.x, 2) +
      Math.pow(e.clientY - lastKnownMousePosition.y, 2)
    );

    if (isScrolling && distance > mouseSensitivity && !fullHoverDisable) {
      isScrolling = false;

      let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elemBelow ) {
        elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }
    }
    lastKnownMousePosition = { x: e.clientX, y: e.clientY };
  });


  window.addEventListener('wheel', () => {
    isScrolling = true;
  }, { passive: true });


  // Listening For long press, sending mouseenter if so
  window.addEventListener('mousedown', function (e) {

    longPressTimer = setTimeout(function () {
      longPressPlay = true;
      if (longPressPlay && longClickSetting) {
        isScrolling = false;
    
        let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        if (elemBelow ) {

          elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          longPressPlay = false;
        }
      }
    }, 250);
  });

}

function handleMouseEnter(e) {

  if (isScrolling) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  } else if (fullHoverDisable) {
    if (!longPressPlay) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    }

  }
}

function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);
    enterListeners++;
  });
}


function observeDOMChanges() {
  const selector = '#dismissible.style-scope';

  const initialElements = document.querySelectorAll(selector);
  addMouseEnterListeners(initialElements);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches(selector)) {
            addMouseEnterListeners([node]);
          }
          if (node.nodeType === 1 && node.querySelectorAll) {
            const children = node.querySelectorAll(selector);
            addMouseEnterListeners(children);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}


observeDOMChanges();

waitForElement('#thumbnail', (element) => {
  init();
});