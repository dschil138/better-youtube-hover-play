let longPress = false;


// function logElementDetails(element) {
//   console.log('Element details for:', element);

//   // Log all attributes
//   console.log('Attributes:');
//   for (let attr of element.attributes) {
//     console.log(` ${attr.name}="${attr.value}"`);
//   }

//   // Log all classes
//   console.log('Classes:');
//   console.log(' ' + element.className); // className returns all classes as a single string
// }




function freezeAttributes(element) {
  console.log('Freezing attributes for:', element);

  // Create a mutation observer to watch for changes to the attributes
  const attributeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // If a long press is detected, do not remove the attributes
      if (longPress) {
        return;
      }

      // Check if the 'active' attribute was added or modified
      if (mutation.type === 'attributes' && mutation.attributeName === 'active') {
        console.log('Active attribute changed for:', mutation.target);
        // Remove the 'active' attribute to prevent playback
        mutation.target.removeAttribute('active');
        console.log('Active attribute removed:', mutation.target);
      }

      // Check if the 'playing' attribute was added or modified
      if (mutation.type === 'attributes' && mutation.attributeName === 'playing') {
        console.log('Playing attribute changed for:', mutation.target);
        // Remove the 'playing' attribute to prevent playback
        mutation.target.removeAttribute('playing');
        console.log('Playing attribute removed:', mutation.target);
      }

    });
  });

  // Start observing the element for attribute changes
  attributeObserver.observe(element, { attributes: true });
  console.log('Attribute observer set for:', element);
}


freezeAttributes(document.querySelector('ytd-video-preview'));




// Function to handle the long press logic
function handleLongPress(thumbnail, previewElement, linkElement) {
  let longPressTimer;
  const longPressDuration = 250; // Duration in milliseconds to detect long press

  // Attach event listeners to the thumbnail
  thumbnail.addEventListener('mousedown', function (e) {
    // Prevent the default hover behavior
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    // Start a timer to detect long press
    longPressTimer = setTimeout(function () {
      longPress = true;
      // Set the href attribute of the link element
      const videoUrl = thumbnail.getAttribute('href');
      linkElement.setAttribute('href', videoUrl);

      // Add attributes to the preview element to start playback
      previewElement.setAttribute('active', '');
      previewElement.setAttribute('playing', '');
      console.log('Playback started due to long press.');
    }, longPressDuration);
  });

  thumbnail.addEventListener('mouseup', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    clearTimeout(longPressTimer);
    longPress = false;

    // Remove attributes to stop playback if it started
    if (previewElement.hasAttribute('active') || previewElement.hasAttribute('playing')) {
      previewElement.removeAttribute('active');
      previewElement.removeAttribute('playing');
      previewElement.setAttribute('hide-volume-controls', '');
      previewElement.setAttribute('hidden', '');
      console.log('Playback stopped due to mouse release.');
    }
  });

  thumbnail.addEventListener('mouseleave', function (e) {
    clearTimeout(longPressTimer);
    longPress = false;
  });
}

function initLongPressForThumbnails() {
  const previewElement = document.querySelector('ytd-video-preview');
  const linkElement = document.querySelector('a.ytp-title-link.yt-uix-sessionlink');

  // Find all the thumbnail elements and initialize long press handling
  const thumbnails = document.querySelectorAll('a.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail');
  thumbnails.forEach(thumbnail => {
    handleLongPress(thumbnail, previewElement, linkElement);
  });
}

setTimeout(initLongPressForThumbnails, 1500);

// This function is called when new nodes are added to the DOM
function onDomChange(mutations, observer) {
  for (let mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      mutation.addedNodes.forEach(node => {
        // Check if the added node is a thumbnail or contains thumbnails
        if (node.matches && node.matches('a.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail')) {
          handleLongPress(node, document.querySelector('ytd-video-preview'), document.querySelector('a.ytp-title-link.yt-uix-sessionlink'));
        } else if (node.querySelectorAll) {
          const thumbnails = node.querySelectorAll('a.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail');
          thumbnails.forEach(thumbnail => {
            handleLongPress(thumbnail, document.querySelector('ytd-video-preview'), document.querySelector('a.ytp-title-link.yt-uix-sessionlink'));
          });
        }
      });
    }
  }
}

// Initialize the MutationObserver
function initMutationObserver() {
  const observer = new MutationObserver(onDomChange);
  
  // Observe the body or another large container that will contain the thumbnails
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('MutationObserver set up to watch for DOM changes.');
}

// Call this function when the page has initially loaded
initMutationObserver();
