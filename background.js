chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({url: "*://www.youtube.com/*"}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ["content.js"]
            }, () => {
                chrome.tabs.sendMessage(tab.id, {action: "runInit"});
            });
        });
    });
});