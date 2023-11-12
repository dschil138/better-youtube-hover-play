let isScrolling = false;
let enterListeners = 0;
let leaveListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };
let mouseSensitivity = 2;
let fullHoverDisable = 0;
let longPressFlag = false;
let wasfullHoverDisable = false;
let longClickSetting = 1;
let longClickDebounce = false;
let optionValue = 2; 
let movingThumbnailPlaying = false;
let _movingThumbnailPlaying = false;
let isChannelPage = false;

const movingThumbnailElement = 'ytd-moving-thumbnail-renderer';
const leavingPreviewElements = ['#dismissible.style-scope'];



Object.defineProperty(window, 'movingThumbnailPlaying', {
  get() {
    return _movingThumbnailPlaying;
  },
  set(value) {
    console.log(`movingThumbnailPlaying changed from ${_movingThumbnailPlaying} to ${value}`);
    _movingThumbnailPlaying = value;
  }
});


function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 500);
  }
}

waitForElement('#subscriber-count', (element) => {
  isChannelPage = true;
  console.log('FOUND CHANNEL - isChannelPage: ', isChannelPage);
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


function init() {
  syncSettings();
  observeDOMChanges();
  observeMovingThumbnailElement();

  window.addEventListener('mousemove', (e) => {
    
    // trigger the preview if the mouse has moved enough
    const distance = Math.sqrt(
      Math.pow(e.clientX - lastKnownMousePosition.x, 2) +
      Math.pow(e.clientY - lastKnownMousePosition.y, 2)
    );

    if (isScrolling && distance > mouseSensitivity && !fullHoverDisable) {
      isScrolling = false;
      // longPressFlag = false;


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




    window.addEventListener('mouseup', function (e) {
      if (longPressFlag && isChannelPage) {
        console.log('longPressFlag', longPressFlag);
        console.log('MOUSEUP');
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    }, true);

    window.addEventListener('click', function (e) {
      setTimeout(function () {
        longPressFlag = false;
        longClickDebounce = false;
      }, 150);
      if (longPressFlag && isChannelPage) {
        console.log('longPressFlag', longPressFlag);
        console.log('CLICK');
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        longPressFlag = false;
      }
    }, true);


  // Listening For long press, sending mouseenter if so
  window.addEventListener('mousedown', function (e) {

  

    longPressTimer = setTimeout(function () {
      
      longPressFlag = true;
      // console.log('LONG PRESS');
      // console.log('longPressFlag', longPressFlag);
      // console.log('longClickSetting', longClickSetting);
      // console.log('fullHoverDisable', fullHoverDisable);

      if (longClickSetting) {

        isScrolling = false;
        longClickDebounce = true;
        console.log('LONG CLICKED');

          let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
          
          // elementsBelow = elementsBelow.reverse();
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
          setTimeout(function () {
            longPressFlag = false;
            longClickDebounce = false;
          }, 700);
          
          
      }
      
    }, 250);

    // setTimeout(function () {
    //   longPressFlag = false;
    // }, 400);
  
  });




}







function handleMouseEnter(e) {
  console.log('mouse enter', e.target);
  console.log('movingThumbnailPlaying', movingThumbnailPlaying);
  console.log('longPressFlag', longPressFlag);
  console.log('longClickSetting', longClickSetting);
  console.log('fullHoverDisable', fullHoverDisable);
  console.log('isScrolling', isScrolling);
  console.log('longClickDebounce', longClickDebounce);
  console.log('isChannelPage', isChannelPage);

  if (movingThumbnailPlaying && isChannelPage) {
    console.log('left mouseenter early')
      return;
  }

  if (((!fullHoverDisable && !longClickSetting) && isScrolling) || isScrolling || (longClickSetting && !longPressFlag) || ((fullHoverDisable && longClickSetting) && !longPressFlag) || (fullHoverDisable && !longClickSetting)) {
    console.log("prevented mouseenter for homepage preview")
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }

  const elements = document.querySelectorAll(movingThumbnailElement);
  // log the number of elements
  console.log(elements.length);
  
  // for each element, if isScrolling is true, remove the element
  for (const element of elements) {
    if (isScrolling) {
      console.log('scrolling, removing');
      element.remove();
    } 
    else if (fullHoverDisable) {
      if (!longPressFlag) {
      console.log('full hover disabled, removing');
      element.remove();
      } 
    } else {
      console.log('allowing');
    }
  }

}



function handleMouseLeave(e) {
  console.log('mouse LEAVE', e.target);
  console.log('movingThumbnailPlaying', movingThumbnailPlaying);
  console.log('longClickDebounce', longClickDebounce);
  if (e.target.matches('#dismissible') && !longClickDebounce) {
    console.log('LEAVING DISMISSABLE setting preview playing to false');
    movingThumbnailPlaying = false;
    return;
  }
}




// // Override addEventListener to log events
// const originalAddEventListener = EventTarget.prototype.addEventListener;
// EventTarget.prototype.addEventListener = function(type, listener, options) {
//   // console.log(`Event listener added: Type: ${type}, Target:`, this);
//   return originalAddEventListener.call(this, type, listener, options);
// };

// Adding listeners to the thumbnail preview element so I can know when to remove it. Currently 'ytd-moving-thumbnail-renderer'
function observeMovingThumbnailElement() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName.toLowerCase() === movingThumbnailElement) {
            console.log('<renderer> element modified or added:', node);
            // console.trace(); 
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




function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);
    enterListeners++;
    console.log('added mouseenter listeners', enterListeners);
  });
}

function addMouseLeaveListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseleave', handleMouseLeave, true);
    leaveListeners++;
    console.log('added mouseleave listeners', leaveListeners);
  });
}

function preventPreviewStop(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handlePreviewStop, true);
    enterListeners++;
    console.log('added mouseenter listeners', enterListeners);
  });
}

function handlePreviewStop(e) {
  if (!movingThumbnailPlaying) {
    handleMouseEnter(e);
  }
}


// Adding mouseenter and mouseleave listeners to all elements with the selector, currently '#dismissible.style-scope'
function observeDOMChanges() {
  const selectors = leavingPreviewElements;
  // const selectors = ['#dismissible.style-scope'];
  // const selector = '#metadata-line.style-scope';
  // const selectors = ['#metadata-line.style-scope', '#dismissible.style-scope'];
  // const selector = '.style-scope';

  for (const selector of selectors) {

    const initialElements = document.querySelectorAll(selector);
    addMouseEnterListeners(initialElements);
    if (isChannelPage) {
      addMouseLeaveListeners(initialElements);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches(selector)) {
              // console.log('added node', node);
              addMouseEnterListeners([node]);
              if (isChannelPage) {
                addMouseLeaveListeners([node]);
              }
            }
            if (node.nodeType === 1 && node.querySelectorAll) {
              const children = node.querySelectorAll(selector);
              addMouseEnterListeners(children);
              if (isChannelPage) {
                addMouseLeaveListeners(children);
              }
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









init();



waitForElement('#thumbnail', (element) => {
  init();
});

