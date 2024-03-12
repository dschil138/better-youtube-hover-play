function getExtensionEnabledValue() {
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
  let addedListeners = false;

  function handleInput(inputId, storageKey) {
    const inputElement = document.querySelector(inputId);
        const inputValue = inputElement.value;
        chrome.storage.sync.set({[storageKey]: inputValue});
        runInit();
  }


  function runInit() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "runInit" });
    });
  }


  try {

    const toggleSwitch = document.getElementById('toggleSwitch');
    const optionButtons = document.querySelectorAll('.option-button');

    let extensionEnabled = await getExtensionEnabledValue();
    console.log('extensionEnabled', extensionEnabled);

    toggleSwitch.checked = extensionEnabled;


    // add event listener to toggleSwitch
    toggleSwitch.addEventListener('input', function () {
      chrome.storage.sync.set({ 'extensionEnabled': this.checked }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        }
      });
    
      extensionEnabled = this.checked;
    
      handleToggleButtons.call(this);
    });

      async function getOptionValue() {
        return new Promise((resolve, reject) => {
          chrome.storage.sync.get(['fullHoverDisable', 'longClickSetting', 'longClickDuration'], function (data) {
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
        let optionValueButton = await getOptionValue();
        selectCorrectButton(optionButtons, optionValueButton);
        buttonHandler(optionButtons); // Enable button listeners
      } else {
        optionButtons.forEach((btn) => {
          btn.classList.remove('selected');
          btn.removeEventListener('click', buttonClickHandler); // remove event listeners when disabled
        });
      }
      setTimeout(runInit, 550);
    }



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
    chrome.storage.sync.get(['optionValue', 'longClickDuration'], function (data) {
      const optionValue = data.optionValue || '2';
      const longClickDuration = data.longClickDuration || 500;

      if (extensionEnabled) {
        document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');
        document.getElementById('long-click-duration').value = longClickDuration;

      }
    });











  if (!addedListeners) {

    function addQuantityHandlers(quantityId, incrementId, decrementId, storageKey, handleInput) {
      const quantityElement = document.getElementById(quantityId);
      const incrementElement = document.getElementById(incrementId);
      const decrementElement = document.getElementById(decrementId);


      incrementElement.addEventListener('click', function() {
        quantityElement.value = +(parseFloat(quantityElement.value) + 10).toFixed(2);
        handleInput(`#${quantityId}`, storageKey);
      });

      decrementElement.addEventListener('click', function() {
        quantityElement.value = +(parseFloat(quantityElement.value) - 10).toFixed(2);
        handleInput(`#${quantityId}`, storageKey);
      });

      quantityElement.addEventListener('input', function() {
        handleInput(`#${quantityId}`, storageKey);
      });
    }

    addQuantityHandlers('long-click-duration', 'increment-duration', 'decrement-duration', 'longClickDuration', handleInput);

    addedListeners = true;
  }











    function buttonClickHandler(buttonGroup) {
      // Use event target instead of 'this'
      let optionValue = event.target.getAttribute('option-value');
      let longClickDuration = document.getElementById('long-click-duration').value;
    
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

      chrome.storage.sync.set({ longClickDuration: longClickDuration }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit();
        }
      });
    }
    

    function buttonHandler(buttonGroup) {
      buttonGroup.forEach((button) => {
        // Bind buttonGroup as the parameter for buttonClickHandler
        button.addEventListener('click', buttonClickHandler.bind(null, buttonGroup));
      });
    }
    
    function removeButtonListeners(buttonGroup) {
      buttonGroup.forEach((button) => {
        button.removeEventListener('click', buttonClickHandler);
      });
    }

    buttonHandler(optionButtons);




    function selectCorrectButton(buttonGroup, optionValue) {
      buttonGroup.forEach((button) => {
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
    if (listenersAttached) {
      removeButtonListeners(optionButtons);  // Remove button listeners when the extension is disabled
      listenersAttached = false;
    }
  }
  setTimeout(runInit, 50);
}

