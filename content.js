let lastKnownMousePosition = { x: 0, y: 0 };
let isScrolling = true;
let longPressFlag = false;
let longClickDebounce = false;
let movingThumbnailPlaying = false;
let isOtherPage = false;
let fullHoverDisable = 0;
let longClickSetting = 1;
let mouseSensitivity = 2;
let optionValue = 2;
let enterListeners = 0;
let leaveListeners = 0;
let totalListeners = 0;
let extensionEnabled = true;



const mainElements = [
// main page
  '#dismissible.style-scope', 
// channel pages
  'ytd-rich-grid-media.style-scope', 
// watch pages
  'ytd-compact-video-renderer',
];

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


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "runInit") {
    init();
    sendResponse({ result: "Init function rerun" });
  }
  return true;
});


function syncSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting'], function(data) {
      if (data.fullHoverDisable) {
        fullHoverDisable = parseInt(data.fullHoverDisable, 10);
      }
      if (data.longClickSetting) {
        longClickSetting = parseInt(data.longClickSetting, 10);
      }
      
      chrome.storage.sync.get('extensionEnabled', function(data) {
        extensionEnabled = data.extensionEnabled !== undefined ? data.extensionEnabled : true;
        resolve();
      });
    });
  });
}


function fullDebug() {
  console.log('isScrolling: ', isScrolling);
  console.log('longPressFlag: ', longPressFlag);
  console.log('longClickSetting: ', longClickSetting);
  console.log('fullHoverDisable: ', fullHoverDisable);
  console.log('longClickDebounce: ', longClickDebounce);
  console.log('movingThumbnailPlaying: ', movingThumbnailPlaying);
  console.log('isOtherPage: ', isOtherPage);
}

function isYouTubeHomePage(url) {
  const homePageRegex = /^https:\/\/www\.youtube\.com\/(?:\?.*)?$/;
  return homePageRegex.test(url);
}


function checkURL() {
  const url = window.location.href;
    if (isYouTubeHomePage(url) || url.startsWith("https://www.youtube.com/results") || url.startsWith("https://www.youtube.com/feed/subscriptions")) {

    if (isOtherPage) {
      isOtherPage = false;
      movingThumbnailPlaying = false;
      init();
    }
  } else {
    if (!isOtherPage) {
      isOtherPage = true;
      movingThumbnailPlaying = false;
      init();
    }
  }
}



// function te send mouseenter event to all elements below the mouse when user long click or momes mouse on thumbnail they scrolled to
function sendEnterEvent(e) {
  if (!extensionEnabled) { return; }
  if (longClickSetting && !longPressFlag) { return; }

  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);

  for (let elemBelow of elementsBelow) {
    if (elemBelow) {

      if (isOtherPage) {
        elemBelow.dispatchEvent(new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }

      if ((!movingThumbnailPlaying) || longPressFlag) { // making preview not restart when hitting mute, etc

        elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }
    }
  }
}



async function init() {
  await syncSettings();
  if (!extensionEnabled) { 

    // remove listeners if extension is disabled
    document.querySelectorAll(mainElements).forEach(element => {
      element.removeEventListener('mouseenter', handleMouseEnter, true);
      element.removeEventListener('mouseleave', handleMouseLeave, true);
    });
    return; 
  }

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
    // get elements below the mouse, if any of the elements below has the id '#movie_player', return early
    let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
    for (let elemBelow of elementsBelow) {
      if (elemBelow.id === 'movie_player') {
        return;
      }
    }


    if (longPressFlag && extensionEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }

    setTimeout(function () {
      longPressFlag = false;
      longClickDebounce = false;
    }, 250);
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
          // longPressFlag = false;
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
}



// on mouseenter, we decide whether or not to stop the preview based on the settings
// special care must be taken for the channel pages, as the setup is more complex
function handleMouseEnter(e) {
  if (isOtherPage && movingThumbnailPlaying) { 
    return; 
  }
  
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


function observeDOMChanges() {
  const selectors = mainElements;

  const handleNode = (node, isDirectChild) => {
    if (node.nodeType === 1) {
      if (selectors.some(selector => node.matches(selector))) {
        addMouseEnterListeners([node]);
        if (isOtherPage) addMouseLeaveListeners([node]);
      } else if (isDirectChild) {
        Array.from(node.children).forEach(child => {
          if (selectors.some(selector => child.matches(selector))) {
            addMouseEnterListeners([child]);
            if (isOtherPage) addMouseLeaveListeners([child]);
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



checkURL();
setInterval(checkURL, 800);

// wait for the thumbnail to load before running init
waitForElement(waitToInitElement, async (element) => {
  try {
    await syncSettings();
    init();
  } catch (error) {
    console.error('Error syncing settings:', error);
  }
});








