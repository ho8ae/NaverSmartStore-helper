chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CRAWL_COMPLETE') {
      // Handle crawled data
      chrome.storage.local.set({ crawledData: request.data });
    }
  });