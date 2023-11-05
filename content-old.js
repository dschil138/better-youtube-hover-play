let longPress = false;


function logElementDetails(element) {
  console.log('Element details for:', element);

  // Log all attributes
  console.log('Attributes:');
  for (let attr of element.attributes) {
    console.log(` ${attr.name}="${attr.value}"`);
  }

  // Log all classes
  console.log('Classes:');
  console.log(' ' + element.className); // className returns all classes as a single string
}

// Inside your existing code, call this function to log the details of videoPreview
// const videoPreview = thumbnailElement.querySelector('ytd-video-preview');
// if (videoPreview) {
//   logElementDetails(videoPreview); // Call this where you need to log the details
// }



function freezeAttributes(element) {
  console.log('Freezing attributes for:', element);

  // Create a mutation observer to watch for changes to the attributes
  const attributeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if the 'active' attribute was added or modified
      if (mutation.type === 'attributes' && mutation.attributeName === 'active') {
        console.log('Active attribute changed for:', mutation.target);
        // Remove the 'active' attribute to prevent playback
        mutation.target.removeAttribute('active');
        console.log('Active attribute removed:', mutation.target);
      }
    });
  });

  // Start observing the element for attribute changes
  attributeObserver.observe(element, { attributes: true });
  console.log('Attribute observer set for:', element);
}

freezeAttributes(document.querySelector('ytd-video-preview'));

// // Function to apply the freeze to all current and future ytd-video-preview elements
// function applyFreeze() {
//   const previews = document.querySelectorAll('ytd-video-preview');
//   console.log('Found', previews.length, 'ytd-video-preview elements to freeze');
//   previews.forEach(freezeAttributes);

//   // Use a mutation observer to apply the freeze to any new ytd-video-preview elements that are added later
//   const bodyObserver = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//       mutation.addedNodes.forEach((newNode) => {
//         if (newNode.nodeType === Node.ELEMENT_NODE && newNode.matches('ytd-video-preview')) {
//           console.log('New ytd-video-preview element added:', newNode);
//           freezeAttributes(newNode);
//         }
//       });
//     });
//   });

//   // Start observing the body for added nodes
//   bodyObserver.observe(document.body, { childList: true, subtree: true });
//   console.log('Body observer set for new ytd-video-preview elements');
// }

// // Run the function to apply the freeze
// applyFreeze();




// const LONG_PRESS_DURATION = 500; // Duration to determine a long press, in milliseconds



// // Function to check if an element is in the main document or within a shadow DOM
// function isInMainDocument(element) {
//   while (element.parentNode) {
//     element = element.parentNode;
//     if (element instanceof ShadowRoot) {
//       console.log('Element is inside a Shadow DOM');
//       return false;
//     }
//   }
//   console.log('Element is in the main document');
//   return true;
// }


// // function addPreviewOnLongPress(thumbnailElement) {
// //   let timerId;

// //   thumbnailElement.addEventListener('mousedown', function(event) {
// //     event.preventDefault(); // Prevent the mousedown event from triggering the link
// //     event.stopImmediatePropagation(); // Stop other event handlers from executing

// //     console.log('Mouse down on thumbnail:', thumbnailElement);

// //     // Start the timer on mousedown
// //     timerId = setTimeout(() => {
// //       // Look for the ytd-video-preview element within the thumbnail
// //       const videoPreview = thumbnailElement.querySelector('ytd-video-preview');
// //       console.log(`videoPreview: ${videoPreview}`)

// //       if (videoPreview) {
// //         // Set the active and playing attributes/classes
// //         videoPreview.setAttribute('active', 'true');
// //         videoPreview.setAttribute('playing', 'true');
// //         videoPreview.classList.add('playing');
// //         console.log('Preview should start for:', videoPreview);
// //         if (videoPreview) {
// //           logElementDetails(videoPreview); // Call this where you need to log the details
// //         }
// //       }
// //     }, LONG_PRESS_DURATION);
// //   });

// //   thumbnailElement.addEventListener('mouseup', function(event) {
// //     console.log('Mouse up on thumbnail:', thumbnailElement);
// //     event.stopImmediatePropagation(); // Stop other event handlers from executing
// //     event.preventDefault(); // Prevent the mouseup event from triggering the link

// //     // If the mouse is released before the timer completes, clear the timer
// //     clearTimeout(timerId);

// //     const videoPreview = thumbnailElement.querySelector('ytd-video-preview');
// //     console.log(`videoPreview: ${videoPreview}`)
// //     if (videoPreview && videoPreview.hasAttribute('active')) {
// //       // Remove the active and playing attributes/classes
// //       videoPreview.removeAttribute('active');
// //       videoPreview.removeAttribute('playing');
// //       videoPreview.classList.remove('playing');
// //       console.log('Preview should stop for:', videoPreview);
// //       if (videoPreview) {
// //         logElementDetails(videoPreview); // Call this where you need to log the details
// //       }

// //     }
// //   });

// //   // Consider the mouse leaving the element as a mouseup event
// //   thumbnailElement.addEventListener('mouseleave', function(event) {
// //     console.log('Mouse leave on thumbnail:', thumbnailElement);

// //     clearTimeout(timerId);

// //     const videoPreview = thumbnailElement.querySelector('ytd-video-preview');
// //     if (videoPreview && videoPreview.hasAttribute('active')) {
// //       // Remove the active and playing attributes/classes
// //       videoPreview.removeAttribute('active');
// //       videoPreview.classList.remove('playing');
// //       console.log('Preview should stop for:', videoPreview);
// //     }
// //   });
// // }

// // // Apply the long press listener to all current and future ytd-video-preview elements
// // function applyLongPressListener() {
// //   const previews = document.querySelectorAll('[id="thumbnail"]');
// //   console.log('Applying long press listener to existing', previews.length, 'elements');

// //   previews.forEach(addPreviewOnLongPress);

// //   // Observe the body for added nodes to apply the listener to new [id="thumbnail"] elements
// //   const bodyObserver = new MutationObserver((mutations) => {
// //     mutations.forEach((mutation) => {
// //       mutation.addedNodes.forEach((newNode) => {
// //         if (newNode.nodeType === Node.ELEMENT_NODE && newNode.matches('[id="thumbnail"]')) {
// //           console.log('New [id="thumbnail"] element added, applying long press listener:', newNode);
// //           addPreviewOnLongPress(newNode);
// //         }
// //       });
// //     });
// //   });

// //   bodyObserver.observe(document.body, { childList: true, subtree: true });
// //   console.log('Body observer set for new [id="thumbnail"] elements');
// // }

// // // Start the process
// // applyLongPressListener();






// // This function will observe the entire document for the addition of ytd-video-preview elements
// function observeDocumentForVideoPreviews() {
//   const observer = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//       for (const node of mutation.addedNodes) {
//         // Check if the added node is a ytd-video-preview or contains one
//         if (node.nodeType === Node.ELEMENT_NODE) {
//           if (node.matches('ytd-video-preview') || node.querySelector('ytd-video-preview')) {
//             // Find the thumbnail container for the video preview
//             const thumbnailContainer = node.closest('[id="thumbnail"]');
//             if (thumbnailContainer) {
//               console.log('Found thumbnail container for new ytd-video-preview:', thumbnailContainer);
//               addPreviewOnLongPress(thumbnailContainer);
//             }
//           }
//         }
//       }
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
//   console.log('Document observer set for new ytd-video-preview elements');
// }






// function addPreviewOnLongPress(thumbnailElement) {
//   let timerId;

//   thumbnailElement.addEventListener('mousedown', (event) => {
//     event.preventDefault();
//     event.stopImmediatePropagation();
//     console.log('Mouse down on thumbnail:', thumbnailElement);

//     // Clear any existing timer to avoid multiple triggers
//     clearTimeout(timerId);

//     // Start the timer on mousedown
//     timerId = setTimeout(() => {
//       const videoPreview = thumbnailElement.querySelector('ytd-video-preview');
//       if (videoPreview) {
//         videoPreview.setAttribute('active', '');
//         videoPreview.classList.add('playing');
//         console.log('Preview should start for:', videoPreview);
//       } else {
//         console.log('No ytd-video-preview element found within the thumbnail.');
//       }
//     }, LONG_PRESS_DURATION);
//   }, true);

//   thumbnailElement.addEventListener('mouseup', (event) => {
//     console.log('Mouse up on thumbnail:', thumbnailElement);
//     event.stopImmediatePropagation();
//     event.preventDefault();
//     clearTimeout(timerId);
//   }, true);

//   thumbnailElement.addEventListener('mouseleave', (event) => {
//     console.log('Mouse leave on thumbnail:', thumbnailElement);
//     clearTimeout(timerId);
//   }, true);
// }

// // Start observing for video previews on document load
// observeDocumentForVideoPreviews();

// function applyLongPressListener() {
//   // Select elements with the ID 'thumbnail'
//   const thumbnails = document.querySelectorAll('[id="thumbnail"]');
//   console.log('Applying long press listener to existing', thumbnails.length, 'thumbnail-container elements');

//   thumbnails.forEach(addPreviewOnLongPress);

//   // Observe the body for added nodes to apply the listener to new elements with the ID 'thumbnail'
//   const bodyObserver = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//       mutation.addedNodes.forEach((newNode) => {
//         if (newNode.nodeType === Node.ELEMENT_NODE && newNode.matches('[id="thumbnail"]')) {
//           console.log('New thumbnail element added, applying long press listener:', newNode);
//           addPreviewOnLongPress(newNode);
//         }
//       });
//     });
//   });

//   bodyObserver.observe(document.body, { childList: true, subtree: true });
//   console.log('Body observer set for new thumbnail elements');
// }

// // applyFreeze();
// applyLongPressListener();





