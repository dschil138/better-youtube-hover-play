let isScrolling = false;
let enterListeners = 0;
let lastKnownMousePosition = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  // Calculate the distance the mouse has moved
  const distance = Math.sqrt(
    Math.pow(e.clientX - lastKnownMousePosition.x, 2) +
    Math.pow(e.clientY - lastKnownMousePosition.y, 2)
  );

  // Only proceed if the mouse has moved more than a threshold (e.g., 2 pixels)
  if (isScrolling && distance > 2) {
    isScrolling = false;
    console.log('Mouse moved more than 2 pixels, checking for element below');

    let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    if (elemBelow) {
      // Dispatch the mouseenter event manually
      elemBelow.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      console.log('Dispatched mouseenter to', elemBelow);
    }
  }

  // Update the last known position
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
