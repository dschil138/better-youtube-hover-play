let lastKnownMousePosition = { x: 0, y: 0 };
let isScrolling
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







function checkURL() {
    const url = window.location.href;
    if (url === "https://www.youtube.com/" || url === "https://www.youtube.com") {
      if (isOtherPage) {
        console.log("PAGE CHANGE: ----- URL is main page -----")
        isOtherPage = false;
        movingThumbnailPlaying = false;
        init();
      }
    } else {
      if (!isOtherPage) {
      console.log("PAGE CHANGE: ----- URL is not main page -----")
        isOtherPage = true;
        movingThumbnailPlaying = false;
        init();
      }
    }
}

// Perform the initial URL check
checkURL();

// // Optional: Set up a MutationObserver or use setInterval for SPAs
// // This is helpful if the page content changes without a full page reload
// const observer = new MutationObserver(mutations => {
//     checkURL(); // Re-check URL when DOM changes
// });

// // Start observing the document
// observer.observe(document, { childList: true, subtree: true });

// Alternatively, you can use setInterval to periodically check the URL
setInterval(checkURL, 1200); // Check every second, adjust interval as needed
























// function checkURL() {
//   const url = window.location.href;
//   if (url === "https://www.youtube.com/" || url === "https://www.youtube.com") {
//     console.log("----- URL is main page -----")
//       isOtherPage = false;
//       movingThumbnailPlaying = false;
//       init();
//   } else {
//     console.log("----- URL is not main page -----")
//       isOtherPage = true;
//       movingThumbnailPlaying = false;
//       init();
//   }
// }

// // Initial check
// checkURL();

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "checkURL") {
//       checkURL();
//       sendResponse({ status: "Done" });
//   }
// });

// // Rest of your script...





const mainElements = [
// main page
  '#dismissible.style-scope', 
// channel pages
  'ytd-rich-grid-media.style-scope', 
// watch pages (not working yet)
  'ytd-compact-video-renderer',
];

// yt-history-manager #historyManager
// ytd-miniplayer
// ytd-mini-guide-renderer
//  ytd-browse
// primary

const channelPageIdentifier = '#subscriber-count';
const watchPageIdentifier = '.ytd-comments';
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


// waitForElement(channelPageIdentifier, (element) => {
//   console.log("channel page found")
//   isOtherPage = true;
//   init();
// });

// waitForElement(watchPageIdentifier, (element) => {
//   console.log("watch page found")
//   isOtherPage = true;
//   init();
// });




chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "runInit") {
    init();
    sendResponse({ result: "Init function rerun" });
  }
  return true;
});


function syncSettings() {
  console.log("syncing settings");
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
    // extensionEnabled = data.extensionEnabled;
        console.log("was data", data.extensionEnabled);
        resolve(); // Resolve the promise after all settings are synced
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


// function te send mouseenter event to all elements below the mouse when user long click or momes mouse on thumbnail they scrolled to
function sendEnterEvent(e) {
  if (!extensionEnabled) { return; }
  let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);

  for (let elemBelow of elementsBelow) {
    if (elemBelow) {

      if (isOtherPage) {
        console.log("sending mouseleave")
        elemBelow.dispatchEvent(new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }

      if ((!movingThumbnailPlaying) || longPressFlag) { //trying to make preview not restart when hitting mute, etc
        console.log("sending mouseenter")

        elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));

    }

    }
    if (isOtherPage && fullHoverDisable) {
      movingThumbnailPlaying = true;
      console.log("set movingThumbnailPlaying true:", movingThumbnailPlaying);
    }
  }
}


async function init() {
  console.log("init -- isOtherPage", isOtherPage);
  
  await syncSettings();
  console.log("init -- extensionEnabled: ", extensionEnabled);

  if (!extensionEnabled) { 

    // remove all listeners
    document.querySelectorAll(mainElements).forEach(element => {
      element.removeEventListener('mouseenter', handleMouseEnter, true);
      element.removeEventListener('mouseleave', handleMouseLeave, true);
      console.log("removed listener");
    });
    console.log("done removing listeners")
    
    return; 
  }
  console.log('passed extensionEnabled check');

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
    

    if (longPressFlag && isOtherPage && extensionEnabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      // longPressFlag = false;
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
    console.log("added listener", totalListeners)
  });
}
function addMouseLeaveListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseleave', handleMouseLeave, true);
    leaveListeners++;
    totalListeners = enterListeners + leaveListeners;
    console.log("added listener", totalListeners)

  });
}


// on mouseenter, we decide whether or not to stop the preview based on the settings
// special care must be taken for the channel pages, as the setup is more complex
function handleMouseEnter(e) {
  console.log("handleMouseEnter", e.target)
  if (isOtherPage && movingThumbnailPlaying) { 
    console.log("returning")
    return; 
  }
  
  if (isScrolling || (!longPressFlag && longClickSetting) || (fullHoverDisable && !longClickSetting)) {
    console.log("preventDefault")
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  } else {
    console.log("did not preventDefault")
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
// function observeDOMChanges() {
//   const selectors = mainElements;

//   for (const selector of selectors) {

//     const handleNode = (node, isDirectChild) => {
//       if (node.nodeType === 1) {
//         if (isDirectChild && node.matches(selector)) {
//           addMouseEnterListeners([node]);
//           if (isOtherPage) addMouseLeaveListeners([node]);
//         }
//         if (!isDirectChild) {
//           Array.from(node.children).forEach(child => handleNode(child, true));
//         }
//       }
//     };

//     document.querySelectorAll(selector).forEach(node => handleNode(node, true));

//     new MutationObserver(mutations => {
//       mutations.forEach(mutation => {
//         mutation.addedNodes.forEach(node => handleNode(node, false));
//       });
//     }).observe(document.body, { childList: true, subtree: true });
//   }
// }


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


// function checkForOtherElements() {
//   const isChannelPagePresent = document.querySelector(channelPageIdentifier) !== null;
//   const isWatchPagePresent = document.querySelector(watchPageIdentifier) !== null;

//   // Update isOtherPage based on the presence of the elements
//   if (isChannelPagePresent || isWatchPagePresent) {
//     if (!isOtherPage) init();
//     isOtherPage = true;
//     console.log("isOtherPage", isOtherPage);
//   } else {
//     isOtherPage = false;
//   }
// }

// // Create a MutationObserver to monitor DOM changes
// const otherObserver = new MutationObserver(mutations => {
//   checkForOtherElements();
// });

// // Observer configuration: watching for changes in child elements and subtree
// const config = { childList: true, subtree: true };

// // Start observing the body element (or a more specific parent element if appropriate)
// otherObserver.observe(document.body, config);

// // Initial check in case the elements are already present when the script starts
// checkForOtherElements();



// wait for the thumbnail to load before running init
waitForElement(waitToInitElement, (element) => {
  console.log("waited for init, thumbnail found")
  init();
});







