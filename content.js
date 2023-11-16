let lastKnownMousePosition = { x: 0, y: 0 };
let isScrolling
let longPressFlag = false;
let longClickDebounce = false;
let movingThumbnailPlaying = false;
let isChannelPage = false;
let fullHoverDisable = 0;
let longClickSetting = 1;
let mouseSensitivity = 2;
let optionValue = 2;
let enterListeners = 0;
let leaveListeners = 0;
let totalListeners = 0;

const mainElements = ['#dismissible.style-scope','ytd-rich-grid-media.style-scope'];
const channelIdentifier = '#subscriber-count';
const waitToInitElement = '#thumbnail';
const leavingMovingThumbnailElement = '#dismissible';


function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 500);
  }
}

waitForElement(channelIdentifier, (element) => {
  isChannelPage = true;
  init();
});

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

function fullDebug() {
  console.log('isScrolling: ', isScrolling);
  console.log('longPressFlag: ', longPressFlag);
  console.log('longClickSetting: ', longClickSetting);
  console.log('fullHoverDisable: ', fullHoverDisable);
  console.log('longClickDebounce: ', longClickDebounce);
  console.log('movingThumbnailPlaying: ', movingThumbnailPlaying);
  console.log('isChannelPage: ', isChannelPage);
}


// function te send mouseenter event to all elements below the mouse when user long click or momes mouse on thumbnail they scrolled to
function sendEnterEvent(e) {
  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);

  for (let elemBelow of elementsBelow) {
    if (elemBelow) {

      if (isChannelPage) {
        elemBelow.dispatchEvent(new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
      }

      elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      }));

    }
    if (isChannelPage) {
      movingThumbnailPlaying = true;
    }
  }
}


function init() {
  syncSettings();
  observeDOMChanges();

  // Monitor mouse movement to detect if the user is trying to trigger a preview that they scrolled to
  window.addEventListener('mousemove', (e) => {

    const distance = Math.sqrt(
      Math.pow(e.clientX - lastKnownMousePosition.x, 2) +
      Math.pow(e.clientY - lastKnownMousePosition.y, 2)
    );
    
    if (isScrolling && distance > mouseSensitivity && !fullHoverDisable) {
      isScrolling = false;
      sendEnterEvent(e);
    }
    lastKnownMousePosition = { x: e.clientX, y: e.clientY };
  });


  window.addEventListener('wheel', () => {
    isScrolling = true;
  }, { passive: true });


  // stopping opening of links on long click, and reset some flags
  window.addEventListener('click', function (e) {
    setTimeout(function () {
      longPressFlag = false;
      longClickDebounce = false;
    }, 150);

    if (longPressFlag && isChannelPage) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      longPressFlag = false;
    }
  }, true);


  // Listening For long press, sending mouseenter if so, to trigger preview
  window.addEventListener('mousedown', function (e) {

    longPressTimer = setTimeout(function () {
      longPressFlag = true;
      if (longClickSetting) {

        isScrolling = false;
        longClickDebounce = true;
        sendEnterEvent(e);

        setTimeout(function () {
          longPressFlag = false;
          longClickDebounce = false;
        }, 700);
      }
    }, 250);
  });

}


// Adding mouseenter & mouseleave listeners
function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);
    enterListeners++;
    totalListeners = enterListeners + leaveListeners;
  });
}
function addMouseLeaveListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseleave', handleMouseLeave, true);
    leaveListeners++;
    totalListeners = enterListeners + leaveListeners;
  });
}function observeDOMChanges() {
  const selectors = mainElements;

  const handleNode = (node, isDirectChild) => {
    if (node.nodeType === 1) {
      if (selectors.some(selector => node.matches(selector))) {
        addMouseEnterListeners([node]);
        if (isChannelPage) addMouseLeaveListeners([node]);
      } else if (isDirectChild) {
        Array.from(node.children).forEach(child => {
          if (selectors.some(selector => child.matches(selector))) {
            addMouseEnterListeners([child]);
            if (isChannelPage) addMouseLeaveListeners([child]);
          }
        });
      }
    }
  };

  document.querySelectorAll(selectors).forEach(node => handleNode(node, true));

  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => handleNode(node, false));
    });
  }).observe(document.body, { childList: true, subtree: true });
}

// on mouseenter, we decide whether or not to stop the preview based on the settings
// special care must be taken for the channel pages, as the setup is more complex
function handleMouseEnter(e) {
  if (isChannelPage && movingThumbnailPlaying) { return; }
  
  if (isScrolling || (!longPressFlag && longClickSetting) || (fullHoverDisable && !longClickSetting)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
}

// mouseleave is only used on channel pages, to stop the preview
function handleMouseLeave(e) {
  if (e.target.matches(leavingMovingThumbnailElement) && !longClickDebounce) {
    movingThumbnailPlaying = false;
    return;
  }
}

// Observe DOM changes to add mouseenter & mouseleave listeners to new elements, as Youtube dynamic loads content
// We only need to attach to the direct children of the main elements, and only channel pages need mouseleave
function observeDOMChanges() {
  const selectors = mainElements;

  for (const selector of selectors) {
    const handleNode = (node, isDirectChild) => {
      if (node.nodeType === 1) {
        if (isDirectChild && node.matches(selector)) {
          addMouseEnterListeners([node]);
          if (isChannelPage) addMouseLeaveListeners([node]);
        }
        if (!isDirectChild) {
          Array.from(node.children).forEach(child => handleNode(child, true));
        }
      }
    };

    document.querySelectorAll(selector).forEach(node => handleNode(node, true));

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => handleNode(node, false));
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
}



// wait for the thumbnail to load before running init
waitForElement(waitToInitElement, (element) => {
  init();
});

