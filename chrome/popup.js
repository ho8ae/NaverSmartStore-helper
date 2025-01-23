// popup.js
document.addEventListener("DOMContentLoaded", function () {
  // DOM 요소
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const apiSettingsForm = document.getElementById("apiSettingsForm");
  const crawlingForm = document.getElementById("crawlingForm");

  // DOM 요소 추가
  const crawledDataForm = document.getElementById("crawledDataForm");
  const productTitle = document.getElementById("productTitle");
  const productPrice = document.getElementById("productPrice");
  const productStock = document.getElementById("productStock");
  const productOrigin = document.getElementById("productOrigin");
  const productImages = document.getElementById("productImages");
  const productOptions = document.getElementById("productOptions");

  // 로그인 관련 요소
  const loginButton = document.getElementById("loginButton");
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  // API 설정 관련 요소
  const apiKey = document.getElementById("apiKey");
  const secretKey = document.getElementById("secretKey");
  const verifyApiButton = document.getElementById("verifyApiButton");
  const apiStatus = document.getElementById("apiStatus");

  // 크롤링 관련 요소
  const productUrl = document.getElementById("productUrl");
  const crawlButton = document.getElementById("crawlButton");
  // const registerButton = document.getElementById("registerButton");
  const signupButton = document.getElementById("signupButton"); // 회원가입 버튼
  const productRegisterButton = document.getElementById(
    "productRegisterButton",
  ); // 상품 등록 버튼

  const progressBar = document.querySelector(".progress");
  const status = document.getElementById("status");

  // 폼 전환 요소
  const showRegister = document.getElementById("showRegister");
  const showLogin = document.getElementById("showLogin");

  // 초기 상태 체크
  checkAuthStatus();

  // 폼 전환 이벤트
  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
  });

  // 로그인 처리
  loginButton.addEventListener("click", async () => {
    try {
      updateStatus("Logging in...", 30);

      // 로그인 요청 데이터 준비
      const loginData = {
        email: email.value,
        password: password.value,
      };

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        // 토큰과 사용자 정보 저장
        const { token, user } = data.data;

        await chrome.storage.local.set({
          token,
          user,
          isLoggedIn: true,
        });

        updateStatus("Login successful!", 100);

        // API 키가 이미 있는 경우 자동으로 설정
        if (user.api_key && user.secret_key) {
          apiKey.value = user.api_key;
          secretKey.value = user.secret_key;
        }

        showApiSettingsForm();
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      updateStatus("Login failed: " + error.message, 0);
    }
  });

  // API 키 검증
  verifyApiButton.addEventListener("click", async () => {
    try {
      updateStatus("Verifying API keys...", 50);
      const token = await getStoredToken();

      const apiKeyValue = apiKey.value;
      const secretKeyValue = secretKey.value;

      const response = await fetch(
        "http://localhost:3000/api/auth/verify-api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            apiKey: apiKeyValue,
            secretKey: secretKeyValue,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // API 키 정보 저장
        await chrome.storage.local.set({
          apiKey: apiKeyValue,
          secretKey: secretKeyValue,
        });

        apiStatus.textContent = "API keys verified and saved successfully!";
        apiStatus.className = "status-message success";
        showCrawlingForm();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      apiStatus.textContent = "API verification failed: " + error.message;
      apiStatus.className = "status-message error";
    }
  });

  // 크롤링 실행
  crawlButton.addEventListener("click", async () => {
    try {
      if (!productUrl.value) {
        throw new Error("Please enter a product URL");
      }

      updateStatus("Crawling product...", 30);

      // URL 유효성 검사 - 도메인 체크 추가
      const url = new URL(productUrl.value);
      if (!url.hostname.includes("domeggook.com")) {
        // 예시로 도매꾹 도메인 체크
        throw new Error("Invalid product URL. Please enter a valid URL.");
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // 이전 크롤링 데이터 초기화
      resetCrawlingForm();

      updateStatus("Initiating crawling...", 40);

      // content script 주입
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // 크롤링 실행
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "crawl",
          url: productUrl.value,
        },
        async function (response) {
          if (chrome.runtime.lastError) {
            throw new Error("Failed to communicate with page");
          }

          if (response && response.success) {
            updateStatus("Crawling completed!", 100);

            // 크롤링 데이터 저장 및 표시
            await chrome.storage.local.set({
              crawledData: response.data,
              lastCrawledUrl: productUrl.value,
            });

            displayCrawledData(response.data);
          } else {
            throw new Error(response?.message || "Crawling failed");
          }
        },
      );
    } catch (error) {
      updateStatus("Crawling error: " + error.message, 0);
    }
  });

  // 회원가입 버튼 이벤트 리스너 추가
  signupButton.addEventListener("click", async () => {
    try {
      updateStatus("Signing up...", 30);
      const signupData = {
        email: regEmail.value,
        password: regPassword.value,
      };

      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      if (data.success) {
        updateStatus("Registration successful!", 100);
        registerForm.style.display = "none";
        loginForm.style.display = "block";
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      updateStatus("Registration failed: " + error.message, 0);
    }
  });

  // 스마트스토어 등록
  productRegisterButton.addEventListener("click", async () => {
    try {
      updateStatus("Registering product...", 50);
      const token = await getStoredToken();
      const data = await chrome.storage.local.get(["crawledData"]);

      // 상세 로깅 추가
      console.group("Product Registration Debug");
      console.log("Token:", token);
      console.log("Crawled Data:", data.crawledData);
      console.log(
        "API Endpoint:",
        "http://localhost:3000/api/products/register",
      );

      const response = await fetch(
        "http://localhost:3000/api/products/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productData: data.crawledData,
          }),
        },
      );

      const result = await response.json();
      console.log("API Response:", result);
      console.groupEnd();

      if (result.success) {
        updateStatus("Product registered successfully!", 100);
        setTimeout(resetCrawlingForm, 2000);
      } else {
        throw new Error(result.message || "등록 실패");
      }
    } catch (error) {
      console.error("Registration Error Details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      updateStatus("Registration failed: " + error.message, 0);
    }
  });

  productOptions.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-option")) {
      const index = e.target.dataset.index;
      e.target.closest(".option-item").remove();
    }
  });

  // 유틸리티 함수들
  async function checkAuthStatus() {
    try {
      const token = await getStoredToken();
      if (token) {
        const response = await fetch("http://localhost:3000/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          showApiSettingsForm();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      console.error("Registration error:", error);
      updateStatus("Registration failed: " + error.message, 0);
    }
  }

  // 크롤링 완료 후 폼 초기화 함수
  function resetCrawlingForm() {
    productUrl.value = ""; // URL 입력 필드 초기화
    crawledDataForm.style.display = "none"; // 크롤링 데이터 폼 숨기기
    productTitle.value = "";
    productPrice.value = "";
    productStock.value = "999";
    productOrigin.value = "";
    productImages.innerHTML = "";
    productOptions.innerHTML = "";
    updateStatus("Ready for next product", 0); // 상태 메시지 초기화
  }

  // 크롤링 데이터 표시 함수
  function displayCrawledData(data) {
    crawledDataForm.style.display = "block";

    // 기본 정보 설정
    productTitle.value = data.title || "";
    productPrice.value = data.price || 0;
    productStock.value = data.stockQuantity || 999;
    productOrigin.value = data.origin || "수입산";

    // 이미지 처리
    productImages.innerHTML = "";
    const images = data.images || [];
    images.forEach((imgUrl, index) => {
      const div = document.createElement("div");
      div.className = "image-item";
      div.innerHTML = `
            <input type="text" class="form-control form-control-sm" 
                   value="${imgUrl}" data-index="${index}" />
            ${index === 0 ? "(대표이미지)" : ""}
        `;
      productImages.appendChild(div);
    });

    // 옵션 처리
    productOptions.innerHTML = "";
    const options = data.options || [];

    // 중복 옵션 제거
    const uniqueOptions = Array.from(
      new Set(options.map((opt) => opt.name)),
    ).map((name, index) => ({
      name,
      stockQuantity: 999,
    }));

    const formattedData = {
      originProduct: {
        statusType: "SALE",
        saleType: "NEW",
        leafCategoryId: "50000803",
        name: data.title,
        detailContent: data.description,
        images: {
          representativeImage: {
            url: images[0],
          },
          optionalImages: [
            {
              url: images[0],
            },
          ],
        },
        salePrice: parseInt(data.price),
        stockQuantity: 999,
        // 배송 정보 추가
        deliveryInfo: {
          deliveryType: "DELIVERY",
          deliveryAttributeType: "NORMAL",
          deliveryFee: {
            deliveryFeeType: "FREE",
            baseFee: 0,
          },
          claimDeliveryInfo: {
            returnDeliveryFee: 3000,
            exchangeDeliveryFee: 3000,
          },
          deliveryCompany: "CJGLS",
        },
        detailAttribute: {
          productInfoProvidedNotice: {
            productInfoProvidedNoticeType: "WEAR",
            wear: {
              material: "상세페이지 참조",
              color: "상세페이지 참조",
              size: "상세페이지 참조",
              manufacturer: "상세페이지 참조",
              caution: "상세페이지 참조",
              packDate: "2024-01",
              warrantyPolicy: "상세페이지 참조",
              afterServiceDirector: "010-3710-7457",
            },
          },
          optionInfo:
            uniqueOptions.length > 0
              ? {
                  optionCombinationSortType: "CREATE",
                  optionCombinationGroupNames: {
                    optionGroupName1: "옵션",
                  },
                  optionCombinations: uniqueOptions.map((opt, index) => ({
                  
                    optionName1: opt.name,
                    stockQuantity: 999,
                    price: 0,
                    usable: true,
                  })),
                  useStockManagement: true,
                }
              : undefined,
          originAreaInfo: {
            originAreaCode: "0200037",
            content: data.origin || "수입산",
            plural: false,
            importer: "주식회사 수입사",
          },

          afterServiceInfo: {
            afterServiceTelephoneNumber: "010-3710-7457",
            afterServiceGuideContent: "구매자 단순변심 반품 가능",
          },
        },
      },
      smartstoreChannelProduct: {
        naverShoppingRegistration: true,
        channelProductDisplayStatusType: "ON",
      },
    };

    // UI 업데이트
    uniqueOptions.forEach((option) => {
      const div = document.createElement("div");
      div.className = "option-item";
      div.innerHTML = `
        <div class="option-content">
            <input type="text" class="form-control form-control-sm" 
                   value="${option.name}" readonly />  
            <input type="number" class="form-control form-control-sm" 
                   value="${option.stockQuantity}" min="0" readonly />
        </div>
      `;
      productOptions.appendChild(div);
    });

    chrome.storage.local.set({ crawledData: formattedData });
    console.log("Chrome storage data:", formattedData);
  }

  function showApiSettingsForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    apiSettingsForm.style.display = "block";
  }

  function showCrawlingForm() {
    apiSettingsForm.style.display = "none";
    crawlingForm.style.display = "block";
  }

  function updateStatus(message, progress = null) {
    status.textContent = message;
    if (progress !== null) {
      progressBar.style.width = `${progress}%`;
    }
  }

  async function getStoredToken() {
    try {
      const data = await chrome.storage.local.get(["token"]);
      if (!data.token) {
        throw new Error("No token found");
      }
      return data.token;
    } catch (error) {
      return null;
    }
  }

  async function showApiSettingsForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    apiSettingsForm.style.display = "block";

    // 저장된 API 키 불러오기
    try {
      const data = await chrome.storage.local.get(["apiKey", "secretKey"]);
      if (data.apiKey && data.secretKey) {
        apiKey.value = data.apiKey;
        secretKey.value = data.secretKey;
        apiStatus.textContent = "Saved API keys loaded";
        apiStatus.className = "status-message success";
      }
    } catch (error) {}
  }
});
