function getExtensionEnabled() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('extensionEnabled', function(data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.extensionEnabled !== undefined ? data.extensionEnabled : true);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  // function to send message to re-run init function in content.js
  function runInit() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "runInit" });
    });
  }

  try {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const optionButtons = document.querySelectorAll('.option-button');

    let extensionEnabled = await getExtensionEnabled();

    toggleSwitch.checked = extensionEnabled;

    console.log("standalone log 1 -- extensionEnabled:", extensionEnabled);

    // add event listener to toggleSwitch
    toggleSwitch.addEventListener('input', function () {
      chrome.storage.sync.set({ 'extensionEnabled': this.checked }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        }
      });
    
      extensionEnabled = this.checked; // Update the extensionEnabled variable
    
      handleToggleButtons.call(this);
    });

      async function getOptionValue() {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting'], function (data) {
            chrome.storage.sync.get(['optionValue'], function (data) {
              const optionValue = data.optionValue || '2';
              if (extensionEnabled) {
                document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');
              }
              resolve(optionValue);
            });
          });
        });
      }



    async function handleToggleButtons() {
      if (extensionEnabled) {
        console.log("adding via selectCorrectButton");
        let optionValueButton = await getOptionValue();
        selectCorrectButton(optionButtons, optionValueButton);
        buttonHandler(optionButtons); // Enable button listeners
      } else {
        optionButtons.forEach((btn) => {
          btn.classList.remove('selected');
          btn.removeEventListener('click', buttonClickHandler); // remove event listeners when disabled
        });
        console.log("ELSE removing");
      }
      setTimeout(runInit, 50);
    }






    // function to map option value to settings object
    function mapOptionToSettings(optionValue) {
      let settings = {
        longClickSetting: '0',
        fullHoverDisable: '1',
      };

      switch (optionValue) {
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

    // Load previous setting for the buttons
    chrome.storage.sync.get(['optionValue'], function (data) {
      const optionValue = data.optionValue || '2';
      if (extensionEnabled) {
        document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');
      }
    });





    function buttonClickHandler(buttonGroup) {
      // Use event target instead of 'this'
      let optionValue = event.target.getAttribute('option-value');
    
      if (!extensionEnabled) {
        return;
      }
    
      buttonGroup.forEach((btn) => btn.classList.remove('selected'));
      event.target.classList.add('selected');
    
      let settings = mapOptionToSettings(optionValue);
    
      chrome.storage.sync.set({ optionValue: optionValue, ...settings }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit();
        }
      });
    }
    
    // Update the buttonHandler function
    function buttonHandler(buttonGroup) {
      console.log(" in buttonHandler");
      buttonGroup.forEach((button) => {
        // Bind buttonGroup as the parameter for buttonClickHandler
        button.addEventListener('click', buttonClickHandler.bind(null, buttonGroup));
      });
    }
    
    function removeButtonListeners(buttonGroup) {
      console.log("Removing button listeners");
      buttonGroup.forEach((button) => {
        button.removeEventListener('click', buttonClickHandler);
      });
    }

    buttonHandler(optionButtons);






    function selectCorrectButton(buttonGroup, optionValue) {
      console.log("in selcetCorrectButton", optionValue);
      buttonGroup.forEach((button) => {
        console.log(button.getAttribute);
        if (button.getAttribute('option-value') === optionValue) {
          button.classList.add('selected');
        }
      });
    }
  } catch (error) {
    console.error("Error retrieving extensionEnabled:", error);
  }
});




let listenersAttached = false;

async function handleToggleButtons() {
  if (extensionEnabled) {
    console.log("adding via selectCorrectButton");
    let optionValueButton = await getOptionValue();
    selectCorrectButton(optionButtons, optionValueButton);
    if (!listenersAttached) {
      buttonHandler(optionButtons); // Enable button listeners when the extension is enabled
      listenersAttached = true;
    }
  } else {
    optionButtons.forEach((btn) => {
      btn.classList.remove('selected');
    });
    console.log("ELSE removing");
    if (listenersAttached) {
      removeButtonListeners(optionButtons);  // Remove button listeners when the extension is disabled
      listenersAttached = false;
    }
  }
  setTimeout(runInit, 50);
}

