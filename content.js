let isDebugMode = false;
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
let listenersAdded = false;
let containerObserver;

// uncomment to enable debug mode
// isDebugMode = true;

const mainElements = [
  // main page
  '#dismissible.style-scope', 
  // channel pages
  // 'ytd-item-section-renderer',
  'ytd-compact-video-renderer',
  'ytd-video-renderer',

  // watch pages
  // 'ytd-compact-video-renderer',
];


const watchPageVideoElement = 'ytd-channel-video-player-renderer video';


const homepageAutoplayParentElement = 'ytd-video-masthead-ad-v3-renderer';
const homepageAutoplayElement = '#click-target';

const homepageAutoplayVideoElement = 'ytd-video-masthead-ad-primary-video-renderer#video.ytd-video-masthead-ad-v3-renderer.video-playing';

const homepageAutoplayVideoElement2 = '.ytd-video-masthead-ad-primary-video-renderer';
const waitToInitElement = '#thumbnail';
const leavingMovingThumbnailElement = '#dismissible';


function log(...args) {
  if (isDebugMode) {
    console.log(...args);
  }
}



// async verion of removeListeners
async function removeListeners() {
  console.log('remove all hover listeners');
  document.querySelectorAll(mainElements).forEach(element => {
    element.removeEventListener('mouseenter', handleMouseEnter, true);
    element.removeEventListener('mouseleave', handleMouseLeave, true);
  }
  );
  window.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('click', handleMouseClick, true);
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "installInit") {
    log("install runInit");
    init();
    sendResponse({ result: "Init function rerun" });
  }
  // return true;
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "runInit") {
    log("popup runInit");
    init();
    sendResponse({ result: "Init function rerun" });
  }
  // return true;
});

// -------------------- UTILS & SETUP --------------------

  function syncSettings() {
    log('Syncing settings...');
    return new Promise((resolve, reject) => {
      const wasEnabled = extensionEnabled;
      chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting', 'optionValue', 'extensionEnabled', 'longClickDuration'], (data) => {
        fullHoverDisable = data.fullHoverDisable ? parseInt(data.fullHoverDisable, 10) : fullHoverDisable;
        longClickSetting = data.longClickSetting ? parseInt(data.longClickSetting, 10) : longClickSetting;
        optionValue = data.optionValue ? parseInt(data.optionValue, 10) : optionValue;
        extensionEnabled = data.extensionEnabled !== undefined ? data.extensionEnabled : true;
        // longClickDuration = data.longClickDuration ? parseInt(data.longClickDuration, 10) : longClickDuration;
        longClickDuration = Math.max(50, Math.min(900, data.longClickDuration ? parseInt(data.longClickDuration, 10) : longClickDuration));
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

  function containsVideosInURL(url) {
    const channelVideosRegex = /youtube\.com\/.*videos/;
    const searchPageRegex = /youtube\.com\/.*search\?/;
    return channelVideosRegex.test(url) && !searchPageRegex.test(url);
  }


  function checkURL() {
    const url = window.location.href;
    const videosPage = containsVideosInURL(url);
    if (videosPage) {
      log('VIDEOS');
    }
    if (isYouTubeHomePage(url) || url.startsWith("https://www.youtube.com/results") || url.startsWith("https://www.youtube.com/feed/subscriptions")) {

      if (isOtherPage || isFirstRun) {
        log('from CONTENT: isYouTubeHomePage');
        observed = false;
        isOtherPage = false;
        movingThumbnailPlaying = false;
        init();
      }
    }
      
    else { // it's not one of those URLs
      if (!isOtherPage || isFirstRun) {
        log('from CONTENT: is NOT Youtube HomePage');
        observed = false;
        isOtherPage = true;
        movingThumbnailPlaying = false;
        init();
      }
    }
  }

  function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
    } else {
      setTimeout(() => waitForElement(selector, callback), 500);
    }
  }

// -------------------- END UTILS & SETUP --------------------


// -------------------- FUNCTIONS --------------------


// function te send mouseenter event to all elements below the mouse when user long click or momes mouse on thumbnail they scrolled to
function sendEnterEvent(e) {
  log('sending enter event');
  if (!extensionEnabled) { return; }
  if (longClickSetting && !longPressFlag) { return; }

  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
  if (elementsBelow.some(el => el.id === 'movie_player')){
    log("caught");
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

          // flash white to indicate the preview is starting
          if (elemBelow.tagName === 'IMG' && elemBelow.classList.contains('yt-core-image')) {
            elemBelow.style.filter = 'brightness(1.4)';
            setTimeout(() => {
              elemBelow.style.filter = '';
            }, 100);
          }

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

function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);
    // enterListeners++;
    // totalListeners = enterListeners + leaveListeners;
  });
}
function addMouseLeaveListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseleave', handleMouseLeave, true);
    // leaveListeners++;
    // totalListeners = enterListeners + leaveListeners;
  });
}


function observeDOMChanges(containerElement) {
  observed = true;
  const selectors = mainElements;

  const handleNode = (node) => {

    if (node.nodeType === 1) {
      if (selectors.some(selector => node.matches(selector))) {
        addMouseEnterListeners([node]);
        if (isOtherPage) addMouseLeaveListeners([node]);
      } 
    }
  };

  // Attach listeners to elements that currently match the selectors
  document.querySelectorAll(selectors.join(', ')).forEach(node => handleNode(node));

  // Observe the container for added nodes and handle them
  containerObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        handleNode(node)
        if (node.nodeType === 1 && node.matches(watchPageVideoElement)) {

          const channelVideo = document.querySelector(watchPageVideoElement);
          if (channelVideo.readyState >= 1) {
            log('pausing channel page video');
            log(channelVideo.duration);
            log(channelVideo)
            channelVideo.pause();
          } else {

            log('had to wait');
            channelVideo.addEventListener('loadedmetadata', () => {
              log('pausing channel page video - LOADED');
              log(channelVideo.duration);
              channelVideo.pause();
            });
          }
          
        } else if (node.nodeType === 1 && node.querySelector(watchPageVideoElement)) {

          const channelVideo = document.querySelector(watchPageVideoElement);
          if (channelVideo.readyState >= 1) {
            log('pausing channel page video');
            log(channelVideo.duration);
            log(channelVideo)
            channelVideo.pause();
          } else {

            log('had to wait');
            channelVideo.addEventListener('loadedmetadata', () => {
              log('pausing channel page video - LOADED');
              log(channelVideo.duration);
              channelVideo.pause();
            });
          }

        }
      });
    });
  }).observe(containerElement, { childList: true, subtree: true });
}

// -------------------- END FUNCTIONS --------------------


// -------------------- HANDLERS --------------------

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
    const duration = Date.now() - startTime;
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
      log('preventDefault click');
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // on mouseenter, decide whether or not to stop the preview based on the settings.
  // Special care must be taken for pages that play 'moving thumbnail' previews, as the setup is more complex
  function handleMouseEnter(e) {
    //moving thumbnails have invisible elements that can be "entered" while it plays, so we don't want those to stop the preview
    // log('mouseenter', e.target);
    if (isOtherPage && movingThumbnailPlaying) { 
      log('returning early, not stopping preview');
      return; 
    }
    
    if (isScrolling || (!longPressFlag && longClickSetting) || (optionValue == 3) || (optionValue == 2 && !longPressFlag)) {
      log('preventDefault main');
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
    }
  }

  // mouseleave is only used on channel pages, to stop the preview
  function handleMouseLeave(e) {
    // log('mouseleave', e.target);
    if (e.target.matches(leavingMovingThumbnailElement) && !longClickDebounce) {
      movingThumbnailPlaying = false;
    }
  }

// -------------------- END HANDLERS --------------------

// -------------------- INIT --------------------

  async function init() {
    log('init');
    isFirstRun = false;
    const pageManager = document.getElementById('page-manager');
    const loadedPreview = document.querySelector('#inline-player > video');

    setTimeout(() => {
      const adAutoplay = document.querySelectorAll(homepageAutoplayVideoElement2);
      adAutoplay.forEach((element) => {
        log('adAutoplay element', element);
        element.remove();
      });

      setTimeout(() => {
        const adAutoplay2 = document.querySelectorAll(homepageAutoplayVideoElement2);
        adAutoplay2.forEach((element) => {
          log('adAutoplay element', element);
          element.remove();
        });
      }, 1000);
    }, 1200);

    if (loadedPreview) {
      log('loadedPreview exists');
      log(loadedPreview);

    } else {
      log('loadedPreview does not exist');
    }
    await syncSettings();

    // remove all listeners and return if extension is disabled
    if (!extensionEnabled) { 
      log('extension is disabled, returning early');
      await removeListeners();
      if (containerObserver) {
        containerObserver.disconnect();
        containerObserver = null;
      }
      return; 
    } else {
        log('passed extensionEnabled check');

        if (!containerObserver) {
          log('observed is false, adding observer');
          observeDOMChanges(pageManager);
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
  }


  // wait for the thumbnail to load before running init (via the checkURL function), then keep checking for URL changes
  waitForElement(waitToInitElement, (element) => {
      checkURL();
      setInterval(checkURL, 600);
  });

// -------------------- END INIT --------------------






