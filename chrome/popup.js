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

      console.log("Sending login request:", loginData); // 디버깅용

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log("Response status:", response.status); // 디버깅용

      const data = await response.json();
      console.log("Login response:", data); // 디버깅용

      if (data.success) {
        // 토큰과 사용자 정보 저장
        const { token, user } = data.data;

        await chrome.storage.local.set({
          token,
          user,
          isLoggedIn: true,
        });

        console.log("Token saved:", token); // 디버깅용

        // API 설정 폼으로 이동하기 전에 저장된 토큰 확인
        const savedToken = await getStoredToken();
        console.log("Saved token verified:", savedToken); // 디버깅용

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
      console.error("Login error:", error); // 디버깅용
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

      // URL 유효성 검사
      const url = new URL(productUrl.value);
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

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
            console.error("Chrome runtime error:", chrome.runtime.lastError);
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
            console.log("Crawled data:", response.data);
          } else {
            throw new Error(response?.message || "Crawling failed");
          }
        },
      );
    } catch (error) {
      console.error("Crawling error:", error);
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
      updateStatus("Preparing product data...", 30);

      // 수정된 데이터 수집
      const productData = {
        title: productTitle.value,
        price: parseInt(productPrice.value),
        stockQuantity: parseInt(productStock.value),
        origin: productOrigin.value,
        images: Array.from(productImages.querySelectorAll("input")).map(
          (input) => input.value,
        ),
        options: Array.from(
          productOptions.querySelectorAll(".option-item"),
        ).map((item) => ({
          name: item.querySelector('input[type="text"]').value,
          stock: parseInt(item.querySelector('input[type="number"]').value),
        })),
      };

      updateStatus("Registering product...", 50);
      const token = await getStoredToken();

      const response = await fetch(
        "http://localhost:3000/api/products/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productData }),
        },
      );

      const result = await response.json();

      if (result.success) {
        updateStatus("Product registered successfully!", 100);

        // 성공 메시지 표시 후 폼 초기화
        setTimeout(() => {
          crawledDataForm.style.display = "none";
          productUrl.value = "";
          productRegisterButton.disabled = true; // registerButton을 productRegisterButton로 변경
          updateStatus("Ready", 0);
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
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
    }
  }
  // 크롤링 데이터 표시 함수
  function displayCrawledData(data) {
    crawledDataForm.style.display = "block";

    // 기본 정보 설정
    productTitle.value = data.title || "";
    productPrice.value = data.price || 0;
    productStock.value = data.stockQuantity || 999;
    productOrigin.value = data.origin || "수입산";

    // 이미지 목록 표시
    productImages.innerHTML = "";
    if (data.images && data.images.length > 0) {
      data.images.forEach((imgUrl, index) => {
        const div = document.createElement("div");
        div.className = "image-item";
        div.innerHTML = `
        <input type="text" class="form-control form-control-sm" 
               value="${imgUrl}" data-index="${index}" />
        ${index === 0 ? "(대표이미지)" : ""}
      `;
        productImages.appendChild(div);
      });
    }

    // 옵션 정보 표시
    productOptions.innerHTML = "";
    if (data.options && data.options.length > 0) {
      data.options.forEach((option, index) => {
        const div = document.createElement("div");
        div.className = "option-item";
        div.innerHTML = `
        <div class="option-content">
          <input type="text" class="form-control form-control-sm" 
                 value="${option.name}" data-index="${index}" />
          <input type="number" class="form-control form-control-sm" 
                 value="${option.stock}" min="0" />
        </div>
        <button class="btn-remove-option" data-index="${index}">×</button>
      `;
        productOptions.appendChild(div);
      });
    }
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
      console.error("Error getting token:", error);
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
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  }
});
