document.addEventListener('DOMContentLoaded', function() {

  const optionButtons = document.querySelectorAll('.option-button');

  // This function will map your single variable to the longClickSetting and fullHoverDisable settings
  function mapOptionToSettings(optionValue) {
    let settings = {
      longClickSetting: '0',
      fullHoverDisable: '1'
    };

    switch(optionValue) {
      case '1':
        settings.fullHoverDisable = '0';
        settings.longClickSetting = '0';
        break;
      case '2':
        settings.longClickSetting = '1';
        settings.fullHoverDisable = '1';
        break;
      case '3':
        settings.fullHoverDisable = '1';
        settings.longClickSetting = '0';
        break;
    }

    return settings;
  }

  // Load any previously saved settings
  chrome.storage.sync.get(['optionValue'], function(data) {
    const optionValue = data.optionValue || '2';
    document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');
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

  function buttonHandler(buttonGroup) {
    buttonGroup.forEach((button) => {
      button.addEventListener('click', function() {
        let optionValue = this.getAttribute('option-value');

        buttonGroup.forEach((btn) => btn.classList.remove('selected'));
        this.classList.add('selected');

        let settings = mapOptionToSettings(optionValue);

        chrome.storage.sync.set({optionValue: optionValue, ...settings}, function() {
          if (chrome.runtime.lastError) {
            console.error("Error setting value:", chrome.runtime.lastError);
          } else {
            runInit();
          }
        });
      });
    });
  }

  buttonHandler(optionButtons);

});
