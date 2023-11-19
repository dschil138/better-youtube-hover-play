// chrome.tabs.onActivated.addListener(activeInfo => {
//     chrome.tabs.sendMessage(activeInfo.tabId, { action: "checkURL" })
//         .catch(error => console.error("Error sending message:", error));
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && tab.active) {
//         chrome.tabs.sendMessage(tabId, { action: "checkURL" })
//             .catch(error => console.error("Error sending message:", error));
//     }
// });
