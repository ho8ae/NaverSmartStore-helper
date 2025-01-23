// content.js
function crawlPageData() {
    try {
        const selectors = {
            // 도매꾹의 선택자들
            title: "h1#lInfoItemTitle",
            price: "div.lItemPrice",
            description: "div#lInfoViewItemContents",
            images: "img.mainThumb",
            options: "ul.pSelectUIMenu li:not(.pDisabled) button.pSelectUIBtn",
            origin: "td.lInfoItemCountryContent"
        };

        // 상품 정보 추출
        const productInfo = {
            title: document.querySelector(selectors.title)?.textContent?.trim(),
            price: cleanPrice(document.querySelector(selectors.price)?.textContent),
            description: document.querySelector(selectors.description)?.innerHTML,
            images: Array.from(document.querySelectorAll(selectors.images)).map(img => img.src),
            origin: document.querySelector(selectors.origin)?.textContent?.trim() || "수입산",
            options: getOptions()
        };

        console.log("Crawled product info:", productInfo);
        return productInfo;
    } catch (error) {
        console.error('Crawling error:', error);
        return null;
    }
}

function cleanPrice(priceText) {
    // 가격에서 숫자만 추출
    return parseInt(priceText?.replace(/[^0-9]/g, '') || "0");
}

function getOptions() {
    const options = [];
    const optionElements = document.querySelectorAll("ul.pSelectUIMenu li:not(.pDisabled) button.pSelectUIBtn");
    
    optionElements.forEach(element => {
        const optionText = element.textContent;
        if (!optionText.includes('판매종료')) {
            const name = optionText.split('(')[0].trim();
            
            // 재고가 있는 옵션이면 기본값으로 999 설정
            // 판매 가능한 옵션만 표시되므로, disabled가 아닌 옵션은 재고가 있다고 가정
            options.push({
                name: name,
                stock: 999  // 기본 재고 값으로 999 설정
            });
        }
    });

    console.log("Extracted options:", options); // 디버깅을 위한 로그 추가
    return options;
}

// 크롤링 시작 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "crawl") {
        const data = crawlPageData();
        sendResponse({ success: true, data: data });
    }
});