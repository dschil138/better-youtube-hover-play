

chrome.runtime.setUninstallURL('https://davidschiller.net/uninstalled-better-youtube-previews.html', function() {
    if (chrome.runtime.lastError) {
        console.log('Error setting uninstall URL: ', chrome.runtime.lastError);
    } else {
        console.log('Uninstall URL set successfully.');
    }
});


const injectedTabIds = new Set();

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.onActivated.addListener(handleTabActivation);
});

async function handleTabActivation(activeInfo) {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.url.includes("://www.youtube.com/")) {
        try {
            // Check if the content script has already been injected in this tab
            if (!injectedTabIds.has(tab.id)) {
                // Content script is not injected, proceed to inject it
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                }, () => {
                    chrome.tabs.sendMessage(tab.id, { action: "runInit" });
                    // Add the tab ID to the set of injected tabs
                    injectedTabIds.add(tab.id);
                });
            }
        } catch (error) {
            console.error("Error checking or injecting content script:", error);
        }
    }
}


// URL listener that listens for changes to the URL of the current tab, and if there is any change, it sends the messate "urlChange" to the content script
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tabId, { message: "urlChange" });
    }
});