let isScrolling = false;
let enterListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };
let mouseSensitivity = 2;
let fullHoverDisable = 0;
let longPressFlag = false;
let wasfullHoverDisable = false;
let longClickSetting = 1;
let optionValue = 2; 

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
    console.log('scrolling', isScrolling);
  }, { passive: true });


  // Listening For long press, sending mouseenter if so
  window.addEventListener('mousedown', function (e) {


    // console.log('MOUSE DOWN');
    // console.log('longPressFlag', longPressFlag);
    // console.log('longClickSetting', longClickSetting);
    // console.log('fullHoverDisable', fullHoverDisable);

    longPressTimer = setTimeout(function () {
      longPressFlag = true;
      console.log('LONG PRESS');
      console.log('longPressFlag', longPressFlag);
      console.log('longClickSetting', longClickSetting);
      console.log('fullHoverDisable', fullHoverDisable);
      if (longPressFlag && longClickSetting) {
        isScrolling = false;

    
        // let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        // if (elemBelow ) {

        //   elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
        //     bubbles: true,
        //     cancelable: true,
        //     view: window
        //   }));

        //   elemBelow.dispatchEvent(new MouseEvent('mouseover', {
        //     bubbles: true,
        //     cancelable: true,
        //     view: window
        //   }));
        //   longPressFlag = false;
        // }



          let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
          // for (let elemBelow of elementsBelow) {
            if (elemBelow) {
              elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
                bubbles: true,
                cancelable: true,
                view: window
              }));
            }
          // }
          longPressFlag = false;
      }

    }, 250);
  });

}



// The reason this isn't working is bc the resource has already been loaded once, I just removed it from the DOM. So when I trigger the mouseenter event, it doesn't load the resource again. I need to find a way stop the initial mouseenter event.

function handleMouseEnter(e) {
  console.log('mouse enter', e.target);

  if (((!fullHoverDisable && !longClickSetting) && isScrolling) || ((fullHoverDisable && longClickSetting) && !longPressFlag) || (fullHoverDisable && !longClickSetting)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }


// reference code from popup.js
  // switch(optionValue) {
  //   case '1': // only for scrolling
  //     settings.fullHoverDisable = '0';
  //     settings.longClickSetting = '0';
  //     break;
  //   case '2': only on long click
  //     settings.longClickSetting = '1';
  //     settings.fullHoverDisable = '1';
  //     break;
  //   case '3': complete disable
  //     settings.fullHoverDisable = '1';
  //     settings.longClickSetting = '0';
  //     break;
  // }

//  ORIGINAL
  // if (isScrolling) {
  //   // console.log('scrolling, prevent default');
  //   e.preventDefault();
  //   e.stopImmediatePropagation();
  //   e.stopPropagation();
  // } else if (fullHoverDisable) {
  //   if (!longPressFlag) {
  //   // console.log('full hover disabled, prevent default');
  //   e.preventDefault();
  //   e.stopImmediatePropagation();
  //   e.stopPropagation();
  //   } 
  // }



  const elements = document.querySelectorAll('ytd-moving-thumbnail-renderer');
// log the number of elements
  console.log(elements.length);
  
  // for each element, if isScrolling is true, remove the element
  for (const element of elements) {
    if (isScrolling) {
      console.log('scrolling, prevent default');
      element.remove();
    } 
    else if (fullHoverDisable) {
      if (!longPressFlag) {
      console.log('full hover disabled, prevent default');
      element.remove();
      } 
    } else {
      console.log('allowing');
    }
  }


}




// Override addEventListener to log events
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
  // console.log(`Event listener added: Type: ${type}, Target:`, this);
  return originalAddEventListener.call(this, type, listener, options);
};

// Observe changes to the DOM
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName.toLowerCase() === 'ytd-moving-thumbnail-renderer') {
          console.log('<renderer> element modified or added:', node);
          // console.trace(); 
        }
      });
    }
  });
});




// Start observing the document body
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Remember to disconnect the observer when your extension is deactivated







function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);

    enterListeners++;
    // console.log('added mouseenter listeners', enterListeners);
  });
}


function observeDOMChanges() {
  // const selector = '#dismissible.style-scope';
  const selectors = ['#dismissible.style-scope', '#thumbnail', 'ytd-video-preview', '.ytd-thumbnail-overlay-loading-preview-renderer', '.ytd-moving-thumbnail-renderer'];

  for (const selector of selectors) {

    const initialElements = document.querySelectorAll(selector);
    addMouseEnterListeners(initialElements);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches(selector)) {
              // console.log('added node', node);
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


  
}

function observeMovingThumbnail() {

function removeYtdMovingThumbnail() {
  // nothing, dummy function
}

// Create an observer instance
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
          removeYtdMovingThumbnail(); // dummy function
      }
  });
});

// Configuration of the observer
const config = { childList: true, subtree: true };

// Start observing the body for DOM changes
observer.observe(document.body, config);

}

observeDOMChanges();
observeMovingThumbnail();

waitForElement('#thumbnail', (element) => {
  init();
});