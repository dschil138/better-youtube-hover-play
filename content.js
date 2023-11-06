let isScrolling = false;
let enterListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };
let mouseSensitivity = 2;
let fullDisable = 0;
let longPressPlay = true;
let wasFullDisable = false;


function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
  } else {
    setTimeout(() => waitForElement(selector, callback), 500);
  }
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received');
  if (request.action === "runInit") {
    syncSpeeds();
    init();
    sendResponse({ result: "Init function rerun" });
  }
  return true;
});


function syncSpeeds() {
  console.log('message received');

  chrome.storage.sync.get(['mouseSensitivity', 'fullDisable'], function(data) {
    if (data.mouseSensitivity) {
      mouseSensitivity = parseInt(data.mouseSensitivity, 10);
    }
    if (data.fullDisable) {
      fullDisable = parseInt(data.fullDisable, 10);
    }
    console.log('sync mouseSensitivity', mouseSensitivity);
    console.log('sync fullDisable', fullDisable);

    init();
  });

}



// init
function init() {
  console.log('init');
  console.log('init mouseSensitivity', mouseSensitivity);
  console.log('init fullDisable', fullDisable);


  window.addEventListener('mousemove', (e) => {
    // Calculate the distance the mouse has moved
    const distance = Math.sqrt(
      Math.pow(e.clientX - lastKnownMousePosition.x, 2) +
      Math.pow(e.clientY - lastKnownMousePosition.y, 2)
    );

    if (isScrolling && distance > mouseSensitivity && !fullDisable) {
      isScrolling = false;
      console.log(`Mouse moved more than ${mouseSensitivity} pixels, checking for element below`);

      let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elemBelow ) {
        // Dispatch the mouseenter event manually
        elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        console.log('Dispatched mouseenter to', elemBelow);
      }
    }

    lastKnownMousePosition = { x: e.clientX, y: e.clientY };
  });


  window.addEventListener('wheel', () => {
    isScrolling = true;
  }, { passive: true });

}


function handleMouseEnter(e) {
  if (isScrolling || (fullDisable && !longPressPlay)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
}

function addMouseEnterListeners(elements) {
  elements.forEach(element => {
    element.addEventListener('mouseenter', handleMouseEnter, true);
    enterListeners++;
  });
}



// Listen For long presses
window.addEventListener('mousedown', function (e) {

  longPressTimer = setTimeout(function () {
    longPressPlay = true;
    if (longPressPlay) {
      isScrolling = false;
      console.log('Playback started due to long press.');
  
      let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elemBelow ) {

        // Dispatch the mouseenter event manually
        elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        console.log('Dispatched mouseenter to', elemBelow);
        longPressPlay = false;
      }
    }
  }, 250);
});




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

  console.log('MutationObserver set up, added', enterListeners, 'mouseenter listeners');
}


init();
observeDOMChanges();
