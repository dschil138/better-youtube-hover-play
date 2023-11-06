document.addEventListener('DOMContentLoaded', function() {

  const sensitivityButtons = document.querySelectorAll('.sensitivity-button');
  const disableButtons = document.querySelectorAll('.disable-button');

  // Load any previously saved settings
  chrome.storage.sync.get(['mouseSensitivity', 'fullDisable'], function(data) {
    const mouseSensitivity = data.mouseSensitivity || 2;
    const fullDisable = data.fullDisable || false;
    document.querySelector(`[mouse-sensitivity="${mouseSensitivity}"]`).classList.add('selected');
    document.querySelector(`[full-disable="${fullDisable}"]`).classList.add('selected');
  });


// function to send message to re-run init function in content.js
function runInit() {
  console.log('runInit');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) {
      console.error("No active tab found.");
      return;
    }
    var activeTab = tabs[0];
    console.log("Active tab:", activeTab);

    chrome.tabs.sendMessage(activeTab.id, {action: "runInit"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Message failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Response from content script:", response);
      }
    });
  });
}



function buttonHandler(buttonGroup, dataAttribute, speedName) {
  console.log('buttonHandler');
  console.log('buttonGroup', buttonGroup);
  console.log('dataAttribute', dataAttribute);
  console.log('speedName', speedName);
  buttonGroup.forEach((button) => {
    button.addEventListener('click', function() {
      let value = this.getAttribute(dataAttribute);

      buttonGroup.forEach((btn) => btn.classList.remove('selected'));
      this.classList.add('selected');

      // Convert to boolean
      if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      }


      chrome.storage.sync.set({[speedName]: value}, function() {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit(); // Only call if successful
        }
      });
    });
  });
}


buttonHandler(sensitivityButtons, 'mouse-sensitivity', 'mouseSensitivity');
buttonHandler(disableButtons, 'full-disable', 'fullDisable');

});

