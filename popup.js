
let extensionEnabled, fullHoverDisable, longClickSetting, optionValue, longClickDuration;



// ON DOM CONTENT LOADED
document.addEventListener('DOMContentLoaded', async function () {
  let listenersAttached = false;



// Install Notification Stuff
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.action === "settingsNotification") {
        console.log("settingsNotification message received");
        notification.style.display = 'block';
        // Set the flag to indicate that the user has seen the notification
        // chrome.storage.local.set({ 'notificationSeen': true });
      }
    }
  );

  // version number in popup menu
  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  document.getElementById('version-number').textContent = `v${version}`;
  setTimeout(() => {
    console.log(`ESD Version - ${version}`);
  }, 8000);



  const dismissButton = document.querySelector('.welcome-tooltip-container .notification-tooltip .dismiss-tooltip');
  const tooltipContainer = document.querySelector('.welcome-tooltip-container');

  dismissButton.addEventListener('click', function () {
      tooltipContainer.style.display = 'none';
  });





  // RUN INIT FUNCTION
  function runInit() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Ensure there is at least one tab and its URL includes 'youtube.com'
      if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "runInit"}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Error sending runInit message:', chrome.runtime.lastError.message);
          }
          // process response?
        });
      }
    });
  }
  


  // FUNCTION to Load any previously saved settings
  async function getStoredValues() {
    console.log('getStoredValues');
    chrome.storage.sync.get(['extensionEnabled', 'fullHoverDisable', 'longClickSetting', 'optionValue', 'longClickDuration'], function(data) {

      longClickDuration = data.longClickDuration || 500;
      longClickSetting = data.longClickSetting || 1;
      fullHoverDisable = data.fullHoverDisable || 1;
      optionValue = data.optionValue || 2;
      extensionEnabled = data.extensionEnabled !== undefined ? data.extensionEnabled : true;

      document.getElementById('long-click-duration').value = longClickDuration;
      document.getElementById('current-value').innerHTML = `${longClickDuration} ms`;
      document.getElementById('toggleSwitch').checked = extensionEnabled;
      document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');

      console.log('Extension enabled:', extensionEnabled);
      if (extensionEnabled) {
        document.querySelector(`[option-value="${optionValue}"]`).classList.add('selected');
        document.getElementById('long-click-duration').value = longClickDuration;
      }

    });
  }




  try {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const optionButtons = document.querySelectorAll('.option-button');

    await getStoredValues();

    // TOGGLE SWITCH EVENT LISTENER
    toggleSwitch.addEventListener('input', function () {
      chrome.storage.sync.set({ 'extensionEnabled': this.checked }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit();
        }
      });
      extensionEnabled = this.checked;
      handleToggleButtons.call(this);
    });



    // SLIDER STUFF
    // SLIDER EVENT LISTENER
    document.getElementById('long-click-duration').addEventListener('input', function () {
      chrome.storage.sync.set({ 'longClickDuration': this.value }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error setting value:", chrome.runtime.lastError);
        } else {
          runInit();
        }
      });
    });


    //  - LONG CLICK DURATION
    var slider = document.getElementById('long-click-duration');
    var currentValueDisplay = document.getElementById('current-value');
  
    slider.oninput = function () {
      currentValueDisplay.innerHTML = `${this.value} ms`;
    };
  
    chrome.storage.sync.set({ longClickDuration: longClickDuration }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error setting value:", chrome.runtime.lastError);
      } else {
        runInit();
      }
    });






    // BUTTON STUFF
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

    async function handleToggleButtons() {
      if (extensionEnabled) {
        let optionValueButton = await getOptionValue();
        selectCorrectButton(optionButtons, optionValueButton);
        if (!listenersAttached) {
          buttonHandler(optionButtons);
          listenersAttached = true;
        }
      } else {
        optionButtons.forEach((btn) => {
          btn.classList.remove('selected');
        });
        if (listenersAttached) {
          removeButtonListeners(optionButtons);
          listenersAttached = false;
        }
      }
      setTimeout(runInit, 200);
    }



  } catch (error) {
    console.log("Error retrieving extensionEnabled:", error);
  }
});







