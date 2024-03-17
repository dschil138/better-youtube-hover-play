let alreadyOnYoutube = false;

chrome.runtime.setUninstallURL('https://davidschiller.net/uninstalled-better-youtube-previews.html', function() {
    if (chrome.runtime.lastError) {
        console.log('Error setting uninstall URL: ', chrome.runtime.lastError);
    } else {
        console.log('Uninstall URL set successfully.');
    }
});


const injectedTabIds = new Set();

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({firstTimeSetup: true}, () => {
        console.log('First time setup flag set.');
    });
    chrome.tabs.onActivated.addListener(handleTabActivation);
});


async function handleTabActivation(activeInfo) {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.url.includes("://www.youtube.com/")) {
        chrome.storage.local.get('firstTimeSetup', data => {
            if (data.firstTimeSetup) {
                // first time? proceed.
                console.log('onInstall - URL change detected: ', tab.url);
                try {
                    if (!injectedTabIds.has(tab.id)) {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ["content.js"]
                        }, () => {
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tab.id, { action: "installInit" });
                                injectedTabIds.add(tab.id);
                            },100);
                        });
                    }
                } catch (error) {
                    console.error("Error checking or injecting content script:", error);
                }
            }
        });
    }
}
