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
let isFirstRun = true;
let startTime;
let observed = false;
let longClickDuration = 500;

const isDebugMode = true;

function log(...args) {
  if (isDebugMode) {
    console.log(...args);
  }
}

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
  log('syncSettings');
  return new Promise((resolve, reject) => {
    const wasEnabled = extensionEnabled;
    chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting', 'extensionEnabled', 'longClickDuration'], (data) => {
      fullHoverDisable = data.fullHoverDisable ? parseInt(data.fullHoverDisable, 10) : fullHoverDisable;
      longClickSetting = data.longClickSetting ? parseInt(data.longClickSetting, 10) : longClickSetting;
      extensionEnabled = data.extensionEnabled !== undefined ? data.extensionEnabled : true;
      // longClickDuration = data.longClickDuration ? parseInt(data.longClickDuration, 10) : longClickDuration;
      longClickDuration = Math.max(50, Math.min(3000, data.longClickDuration ? parseInt(data.longClickDuration, 10) : longClickDuration));
      if (wasEnabled !== extensionEnabled && extensionEnabled) {
        init();
      }
      resolve();
    });
  });
}





function fullDebug() {
  log('isScrolling: ', isScrolling);
  log('longPressFlag: ', longPressFlag);
  log('longClickSetting: ', longClickSetting);
  log('fullHoverDisable: ', fullHoverDisable);
  log('longClickDebounce: ', longClickDebounce);
  log('movingThumbnailPlaying: ', movingThumbnailPlaying);
  log('isOtherPage: ', isOtherPage);
  log('isExtensionEnabled: ', extensionEnabled);
  log("longClickDuration: ", longClickDuration);
}

function isYouTubeHomePage(url) {
  const homePageRegex = /^https:\/\/www\.youtube\.com\/(?:\?.*)?$/;
  return homePageRegex.test(url);
}


function checkURL() {
  const url = window.location.href;
  if (isYouTubeHomePage(url) || url.startsWith("https://www.youtube.com/results") || url.startsWith("https://www.youtube.com/feed/subscriptions")) {

    if (isOtherPage || isFirstRun) {
      log('isYouTubeHomePage');
      observed = false;
      isOtherPage = false;
      movingThumbnailPlaying = false;
      init();
    }
  }
    
  else { // it's not one of those URLs
    if (!isOtherPage || isFirstRun) {
      log('isOtherPage');
      observed = false;
      isOtherPage = true;
      movingThumbnailPlaying = false;
      init();
    }
  }
}



// function te send mouseenter event to all elements below the mouse when user long click or momes mouse on thumbnail they scrolled to
function sendEnterEvent(e) {
  log('sending enter event');
  if (!extensionEnabled) { return; }
  if (longClickSetting && !longPressFlag) { return; }

  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
  if (elementsBelow.some(el => el.id === 'movie_player')){
    console.log("caught");
    return;
  } else {

  for (let elemBelow of elementsBelow) {
    if (elemBelow) {

      if (elemBelow.id === 'movie_player' || elemBelow.id === 'container') {
        return;
      }
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
}



async function init() {
  log('init');
  isFirstRun = false;
  await syncSettings();
  log('syncSettings done');
  fullDebug();


  if (!extensionEnabled) { 
    // remove all listeners if extension is disabled
    log('remove all listeners & returning early bc extension is disabled');
    document.querySelectorAll(mainElements).forEach(element => {
      element.removeEventListener('mouseenter', handleMouseEnter, true);
      element.removeEventListener('mouseleave', handleMouseLeave, true);
    });
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('click', handleMouseClick, true);
    observed = false;
    return; 
  }
  log('passed extensionEnabled check');

  if (!observed) {
    log('observed is false, adding observer');
    observeDOMChanges();
  }

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


  window.addEventListener('mousedown', handleMouseDown);

  window.addEventListener('mouseup', handleMouseUp);

  window.addEventListener('click', handleMouseClick, true);

}




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


// Listening For long press, sending mouseenter if so, to trigger preview
function handleMouseDown(e) {
  log('mousedown');
  startTime = Date.now();

  longPressTimer = setTimeout(function () {
    log('long press');
    longPressFlag = true;
    if (longClickSetting) {
      isScrolling = false;
      longClickDebounce = true;
      sendEnterEvent(e);
    }
  }, longClickDuration);
}

// stop the long press timer, and reset some flags
function handleMouseUp(e) {
  clearTimeout(longPressTimer);
  const duration = Date.now() - startTime; // Calculate the duration
  log('Click duration: ' + duration + ' ms');
  setTimeout(function () {
    longPressFlag = false;
    longClickDebounce = false;
  }, 250);
}


// stop the opening of links on long click
function handleMouseClick(e) {
  // get elements below the mouse, if any of the elements below has the id '#movie_player', return early, bc this is the main video player on "watch" pages
  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
  for (let elemBelow of elementsBelow) {
    if (elemBelow.id === 'movie_player') {
      return;
    }
  }

  // Otherwise, if it's a long click, don't open the link
  if (longPressFlag && extensionEnabled) {
    log('preventDefault 2');
    e.preventDefault();
    e.stopPropagation();
  }
}

// on mouseenter, we decide whether or not to stop the preview based on the settings.
// Special care must be taken for pages that play 'moving thumbnail' previews, as the setup is more complex
function handleMouseEnter(e) {
  // log('mouseenter');
  //moving thumbnails have invisible elements that can be "entered" while it plays, so we don't want those to stop the preview
  if (isOtherPage && movingThumbnailPlaying) { 
    // log('returning early');
    return; 
  }
  
  if (isScrolling || (!longPressFlag && longClickSetting) || (fullHoverDisable && !longClickSetting)) {
    // log('preventDefault main');
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
}

// mouseleave is only used on channel pages, to stop the preview
function handleMouseLeave(e) {
  if (e.target.matches(leavingMovingThumbnailElement) && !longClickDebounce) {
    movingThumbnailPlaying = false;
  }
}


function observeDOMChanges() {
  observed = true;
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





// wait for the thumbnail to load before running init (via the checkURL function)
waitForElement(waitToInitElement, (element) => {
    checkURL();
    setInterval(checkURL, 800);
});








