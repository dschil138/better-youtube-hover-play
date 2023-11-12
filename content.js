
let lastKnownMousePosition = { x: 0, y: 0 };
let isScrolling, longPressFlag, longClickDebounce, movingThumbnailPlaying, isChannelPage = false;
let fullHoverDisable = 0;
let longClickSetting = 1;
let mouseSensitivity, optionValue = 2;


const movingThumbnailElement = 'ytd-moving-thumbnail-renderer';
const leavingMovingThumbnailElements = ['#dismissible.style-scope'];
const channelIdentifier = '#subscriber-count';
const waitToInitElement = '#thumbnail';


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
        movingThumbnailPlaying = true;
      }

      elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
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


  // stopping opening of links on long click
  window.addEventListener('mouseup', function (e) {
    if (longPressFlag && isChannelPage) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
    }
  }, true);


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
  });
}
function addMouseLeaveListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseleave', handleMouseLeave, true);
  });
}

// on mouseenter, we decide whether or not to stop the preview, based on the settings
// Special care must be taken on channel pages, as the setup is more complex
function handleMouseEnter(e) {
  if (isChannelPage && movingThumbnailPlaying) { return; }
  
  if (isScrolling || (!longPressFlag && longClickSetting) || (fullHoverDisable && !longClickSetting)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    
    const elements = document.querySelectorAll(movingThumbnailElement);
    for (const element of elements) {
      element.remove();
    }
  }
}

// mouseleave is only used on channel pages, to stop the preview
function handleMouseLeave(e) {
  if (e.target.matches('#dismissible') && !longClickDebounce) {
    movingThumbnailPlaying = false;
    return;
  }
}

// Observe DOM changes to add mouseenter & mouseleave listeners to new elements, as Youtube dynamic loads content
function observeDOMChanges() {
  const selectors = leavingMovingThumbnailElements;
  // #dismissible.style-scope, #metadata-line.style-scope, 
  // #metadata-line.style-scope, #dismissible.style-scope,.style-scope

  for (const selector of selectors) {
    const handleNode = node => {
      if (node.nodeType === 1) {
        if (node.matches(selector)) {
          addMouseEnterListeners([node]);
          if (isChannelPage) addMouseLeaveListeners([node]);
        }
        node.querySelectorAll(selector).forEach(handleNode);
      }
    };

    document.querySelectorAll(selector).forEach(handleNode);

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(handleNode);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
}


// wait for the thumbnail to load before running init
waitForElement(waitToInitElement, (element) => {
  init();
});

