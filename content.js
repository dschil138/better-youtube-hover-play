let isScrolling = false;
let enterListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  // If the mouse moved and scrolling was in progress, we reset the scrolling flag
  // and manually trigger mouseenter on the element below the cursor
  if (isScrolling) {
    isScrolling = false;
    console.log('mouse moved, checking for element below');

    let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    if (elemBelow) {
      // Dispatch a new mouseenter event
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




function handleMouseEnter(e) {
  if (isScrolling) {
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

observeDOMChanges();
