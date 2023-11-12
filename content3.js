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

// Object.defineProperty(window, 'movingThumbnailPlaying', {
//     get() {
//         return _movingThumbnailPlaying;
//     },
//     set(value) {
//         console.log(`movingThumbnailPlaying changed from ${_movingThumbnailPlaying} to ${value}`);
//         _movingThumbnailPlaying = value;
//     }
// });


function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 500);
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "runInit") {
        init();
        sendResponse({ result: "Init function rerun" });
    }
    return true;
});


function syncSettings() {
    chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting'], function (data) {
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
            // longPressFlag = false;


            let elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (elemBelow) {
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
        if (longPressFlag) {
            console.log('MOUSEUP');
            console.log('longPressFlag', longPressFlag);
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            setTimeout(function () {
                longPressFlag = false;
                longClickDebounce = false;
            }, 100);
        }
    }, true);

    window.addEventListener('click', function (e) {
        if (longPressFlag) {
            console.log('CLICK');
            console.log('longPressFlag', longPressFlag);
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            longPressFlag = false;
            setTimeout(function () {
                longPressFlag = false;
                longClickDebounce = false;
            }, 100);
        }
    }, true);

    // Listening For long press, sending mouseenter if so
    window.addEventListener('mousedown', function (e) {
        console.log('MOUSE DOWN');
        console.log('longPressFlag', longPressFlag);
        console.log('longClickSetting', longClickSetting);
        longPressTimer = setTimeout(function () {
            // isScrolling = false;
            console.log('LONG PRESS, isScrolling', isScrolling);


            longPressFlag = true;
            console.log('LONG PRESS');
            console.log('longPressFlag', longPressFlag);
            console.log('longClickSetting', longClickSetting);
            console.log('fullHoverDisable', fullHoverDisable);

            if (longClickSetting) {
                // e.preventDefault();
                // e.stopImmediatePropagation();
                // e.stopPropagation();
                isScrolling = false;
                // movingThumbnailPlaying = true;
                longClickDebounce = true;
                console.log('WHEN LONG CLICKED: movingThumbnailPlaying', movingThumbnailPlaying);

                let elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
                // elementsBelow = elementsBelow.reverse();
                for (let elemBelow of elementsBelow) {
                    if (elemBelow) {
                        if (isChannelPage) {
                            console.log('IS CHANNEL PAGE');
                        
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
            }
        }, 250);
    });
}


function handleMouseLeave(e) {
    console.log('mouse LEAVE', e.target);
    console.log('movingThumbnailPlaying', movingThumbnailPlaying);
    if (e.target.matches('#dismissible') && movingThumbnailPlaying && !longClickDebounce) {
        console.log('LEAVING DISMISSABLE setting preview playing to false');
        movingThumbnailPlaying = false;
        return;
    }
}




function handleMouseEnter(e) {
    console.log('mouse enter', e.target);
    if (movingThumbnailPlaying) {
        return;
    }

    if (((!fullHoverDisable && !longClickSetting) && isScrolling) || isScrolling || ((fullHoverDisable && longClickSetting) && !longPressFlag) || (fullHoverDisable && !longClickSetting)) {
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

// Adding listeners to the thumbnail preview element so I can know when to remove it. Currently 'ytd-moving-thumbnail-renderer'
function observeMovingThumbnailElement() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName.toLowerCase() === movingThumbnailElement) {
                        console.log('<renderer> element modified or added:', node);
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
    // ['#dismissible.style-scope'];
    // '#metadata-line.style-scope';
    // ['#metadata-line.style-scope', '#dismissible.style-scope'];
    // '.style-scope';

    for (const selector of selectors) {

        const initialElements = document.querySelectorAll(selector);
        addMouseEnterListeners(initialElements);
        addMouseLeaveListeners(initialElements);

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






observeDOMChanges();
observeMovingThumbnailElement();

init();

waitForElement('#subscriber-count', (element) => {
    isChannelPage = true;
});

waitForElement('#thumbnail', (element) => {
    init();
});