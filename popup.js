document.addEventListener('DOMContentLoaded', function() {

  const disableButtons = document.querySelectorAll('.disable-button');
  const longClickSettingButtons = document.querySelectorAll('.long-click-setting-button');

  // Load any previously saved settings
  chrome.storage.sync.get(['fullDisable', 'longClickSetting'], function(data) {
    const fullDisable = data.fullDisable || 0;
    const longClickSetting = data.longClickSetting || 0;
    document.querySelector(`[full-disable="${fullDisable}"]`).classList.add('selected');
    document.querySelector(`[long-click-setting="${longClickSetting}"]`).classList.add('selected');
  });


// function to send message to re-run init function in content.js
function runInit() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) {
      return;
    }
    var activeTab = tabs[0];

    chrome.tabs.sendMessage(activeTab.id, {action: "runInit"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Message failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Response from content script:", response);
      }
    });
  });
}


function buttonHandler(buttonGroup, dataAttribute, attributeSetting) {
  buttonGroup.forEach((button) => {
    button.addEventListener('click', function() {
      let value = this.getAttribute(dataAttribute);

      buttonGroup.forEach((btn) => btn.classList.remove('selected'));
      this.classList.add('selected');

      chrome.storage.sync.set({[attributeSetting]: value}, function() {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit();
        }
      });
    });
  });
}


buttonHandler(disableButtons, 'full-disable', 'fullDisable');
buttonHandler(longClickSettingButtons, 'long-click-setting', 'longClickSetting');

});

