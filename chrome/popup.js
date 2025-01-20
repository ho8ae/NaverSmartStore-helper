let auth = null;

// 로그 표시 함수
function showLog(message, isError = false) {
  const logDiv = document.getElementById('logSection');
  const logEntry = document.createElement('div');
  logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  logEntry.style.color = isError ? 'red' : 'green';
  logDiv.appendChild(logEntry);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// UI 관련 함수들
function showLoading(show) {
  document.getElementById('loadingSection').style.display = show ? 'block' : 'none';
}

function showResult(show) {
  document.getElementById('resultSection').style.display = show ? 'block' : 'none';
}

// 결과 표시 함수
function displayResult(productInfo) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <div>
      <p><strong>제목:</strong> ${productInfo.title}</p>
      <p><strong>가격:</strong> ${productInfo.price.toLocaleString()}원</p>
      <p><strong>재고:</strong> ${productInfo.stock}개</p>
      <p><strong>이미지 수:</strong> ${productInfo.images.length}개</p>
      <p><strong>설명:</strong> ${productInfo.description?.substring(0, 100)}...</p>
    </div>
  `;
  resultDiv.dataset.productInfo = JSON.stringify(productInfo);
  showResult(true);
}

// 크롤링 함수 - 도매꾹 사이트에 맞게 수정
async function crawlProductInfo() {
  showLog('크롤링 시작...');
  
  const productInfo = {
    title: document.querySelector('div.title > p.goods_name')?.textContent?.trim(),
    price: parseInt(document.querySelector('span.real_price')?.textContent?.replace(/[^0-9]/g, '') || '0'),
    description: document.querySelector('#goods_desc')?.innerHTML || '',
    images: Array.from(document.querySelectorAll('#goods_desc img')).map(img => img.src),
    stock: 999  // 도매꾹은 기본 재고 999로 설정
  };

  showLog('크롤링된 정보: ' + JSON.stringify(productInfo, null, 2));
  return productInfo;
}

// 상품 등록 함수
async function registerProduct(accessToken, productData) {
  showLog('상품 등록 시작...');
  
  if (!productData.title || !productData.price || !productData.images?.length) {
    throw new Error('필수 정보가 누락되었습니다 (상품명, 가격, 이미지)');
  }

  const requestBody = {
    originProduct: {
      statusType: 'SALE',
      saleType: 'NEW',
      leafCategoryId: '50000000',
      name: productData.title,
      detailContent: productData.description,
      images: {
        representativeImage: { url: productData.images[0] },
        optionalImages: productData.images.slice(1).map(url => ({ url }))
      },
      salePrice: productData.price,
      stockQuantity: productData.stock || 999,
      deliveryInfo: {
        deliveryType: 'DELIVERY',
        deliveryAttributeType: 'NORMAL',
        deliveryCompany: 'CJGLS',
        deliveryFee: {
          deliveryFeeType: 'FREE',
          baseFee: 0
        },
        deliveryBundleGroupUsable: true,
        claimDeliveryInfo: {
          returnDeliveryCompany: 'CJGLS',
          returnFee: 3000,
          exchangeDeliveryCompany: 'CJGLS',
          exchangeFee: 6000
        }
      },
      detailAttribute: {
        naverShoppingSearchInfo: {},
        afterServiceInfo: {
          afterServiceTelephoneNumber: '000-000-0000',
          afterServiceGuideContent: '상품에 문제가 있을 경우 연락주세요.'
        },
        originAreaInfo: {
          originAreaCode: 'CHINA',
          content: '중국'
        },
        sellerCodeInfo: {
          sellerManagementCode: ''
        },
        certificationType: 'NONE',
        productCertificationInfos: []
      }
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: 'ON'
    }
  };

  showLog('API 요청 데이터: ' + JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://api.commerce.naver.com/external/v2/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      showLog('API 에러 응답: ' + JSON.stringify(errorData, null, 2), true);
      throw new Error(errorData.message || '상품 등록 실패');
    }

    const result = await response.json();
    showLog('API 성공 응답: ' + JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    showLog('API 호출 중 오류: ' + error.message, true);
    throw error;
  }
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  showLog('확장 프로그램 초기화 완료');

  // API 키 저장
  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    
    if (!clientId || !clientSecret) {
      showLog('클라이언트 ID와 시크릿을 입력해주세요', true);
      return;
    }

    showLog('API 키 저장 시도...');
    showLoading(true);
    
    try {
      auth = new NaverAPIAuth(clientId, clientSecret);
      const accessToken = await auth.getAccessToken();
      showLog('액세스 토큰 발급 성공: ' + accessToken.substring(0, 10) + '...');

      chrome.storage.local.set({
        apiCredentials: { clientId, clientSecret }
      }, () => {
        showLog('API 키가 저장되었습니다');
        alert('API 키가 성공적으로 저장되었습니다');
      });
    } catch (error) {
      showLog('API 키 인증 실패: ' + error.message, true);
      alert('API 키 인증에 실패했습니다: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  // 크롤링 시작
  document.getElementById('crawlBtn').addEventListener('click', async () => {
    showLog('크롤링 시작...');
    
    if (!auth) {
      try {
        const { apiCredentials } = await chrome.storage.local.get('apiCredentials');
        if (!apiCredentials) {
          showLog('저장된 API 키가 없습니다', true);
          alert('먼저 API 키를 등록해주세요');
          return;
        }
        auth = new NaverAPIAuth(apiCredentials.clientId, apiCredentials.clientSecret);
        showLog('저장된 API 키로 인증 객체 생성');
      } catch (error) {
        showLog('API 키 로딩 실패: ' + error.message, true);
        return;
      }
    }

    showLoading(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: crawlProductInfo,
      });
      
      const productInfo = result[0].result;
      showLog('크롤링 성공');
      displayResult(productInfo);
    } catch (error) {
      showLog('크롤링 실패: ' + error.message, true);
      alert('크롤링 중 오류가 발생했습니다: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  // 상품 등록
  document.getElementById('registerProduct').addEventListener('click', async () => {
    if (!auth) {
      showLog('API 인증이 필요합니다', true);
      alert('API 인증이 필요합니다');
      return;
    }

    showLoading(true);
    
    try {
      const accessToken = await auth.getAccessToken();
      const productData = JSON.parse(document.getElementById('result').dataset.productInfo);
      const result = await registerProduct(accessToken, productData);
      
      if (result.originProductNo) {
        showLog('상품 등록 성공 (상품번호: ' + result.originProductNo + ')');
        alert(`상품이 성공적으로 등록되었습니다. (상품번호: ${result.originProductNo})`);
      } else {
        throw new Error('상품 등록 실패');
      }
    } catch (error) {
      showLog('상품 등록 실패: ' + error.message, true);
      alert('상품 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  // 저장된 API 키 불러오기
  chrome.storage.local.get('apiCredentials', ({ apiCredentials }) => {
    if (apiCredentials) {
      document.getElementById('clientId').value = apiCredentials.clientId;
      document.getElementById('clientSecret').value = apiCredentials.clientSecret;
      auth = new NaverAPIAuth(apiCredentials.clientId, apiCredentials.clientSecret);
      showLog('저장된 API 키 로드 완료');
    }
  });
});