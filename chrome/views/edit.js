document.addEventListener("DOMContentLoaded", async () => {
  // 저장된 데이터 불러오기
  const { formattedData } = await chrome.storage.local.get("formattedData");

  if (!formattedData) {
    alert("상품 데이터를 찾을 수 없습니다.");
    window.close();
    return;
  }

  const product = formattedData.originProduct;

  // 기본 정보 설정
  document.getElementById("name").value = product.name || "";
  document.getElementById("salePrice").value = product.salePrice || 0;
  document.getElementById("stockQuantity").value = product.stockQuantity || 999;
  document.getElementById("originArea").value =
    product.detailAttribute.originAreaInfo.content || "수입산";
  document.getElementById("detailContent").value = product.detailContent || "";
  document.getElementById("deliveryFee").value =
    product.deliveryInfo.deliveryFee.baseFee || 0;
  document.getElementById("returnFee").value =
    product.deliveryInfo.claimDeliveryInfo.returnDeliveryFee || 3000;
  document.getElementById("saveBtn").textContent = "상품 등록";

  // 이미지 목록 표시
  const imageList = document.getElementById("imageList");
  const images = product.images.optionalImages || [];
  images.forEach((img) => addImageItem(img.url));

  // 옵션 목록 표시
  const optionList = document.getElementById("optionList");
  const options = product.detailAttribute.optionInfo?.optionCombinations || [];
  options.forEach((opt) => addOptionItem(opt));

  // 이미지 추가 버튼
  document.getElementById("addImageBtn").addEventListener("click", () => {
    addImageItem("");
  });

  // 옵션 추가 버튼
  document.getElementById("addOptionBtn").addEventListener("click", () => {
    addOptionItem({ optionName1: "", stockQuantity: 999, price: 0 });
  });

  // 저장 버튼
  // 상품 등록 버튼
  document.getElementById("saveBtn").addEventListener("click", async () => {
    try {
      const updatedData = {
        ...formattedData,
        originProduct: {
          ...formattedData.originProduct,
          name: document.getElementById("name").value,
          salePrice: parseInt(document.getElementById("salePrice").value),
          stockQuantity: parseInt(
            document.getElementById("stockQuantity").value,
          ),
          detailContent: document.getElementById("detailContent").value,
          images: {
            representativeImage: { url: getImageUrls()[0] },
            optionalImages: getImageUrls().map((url) => ({ url })),
          },
          detailAttribute: {
            ...formattedData.originProduct.detailAttribute,
            originAreaInfo: {
              ...formattedData.originProduct.detailAttribute.originAreaInfo,
              content: document.getElementById("originArea").value,
            },
            optionInfo: {
              optionCombinationSortType: "CREATE",
              optionCombinationGroupNames: {
                optionGroupName1: "옵션",
              },
              optionCombinations: getOptions(),
              useStockManagement: true,
            },
          },
          deliveryInfo: {
            ...formattedData.originProduct.deliveryInfo,
            deliveryFee: {
              ...formattedData.originProduct.deliveryInfo.deliveryFee,
              baseFee: parseInt(document.getElementById("deliveryFee").value),
            },
            claimDeliveryInfo: {
              returnDeliveryFee: parseInt(
                document.getElementById("returnFee").value,
              ),
              exchangeDeliveryFee: parseInt(
                document.getElementById("returnFee").value,
              ),
            },
          },
        },
      };

      // 토큰 가져오기
      const { token } = await chrome.storage.local.get("token");
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      // 상품 등록 요청
      const response = await fetch(
        "http://localhost:3000/api/products/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productData: updatedData,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        alert("상품이 성공적으로 등록되었습니다!");
        window.close();
      } else {
        throw new Error(result.message || "상품 등록 실패");
      }
    } catch (error) {
      alert("상품 등록 중 오류 발생: " + error.message);
      console.error("등록 오류:", error);
    }
  });

  // 취소 버튼
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.close();
  });
});

function addImageItem(url) {
  const div = document.createElement("div");
  div.className = "image-item";
  div.innerHTML = `
        <input type="text" class="form-control" value="${url}" placeholder="이미지 URL">
        <button type="button" class="btn btn-danger remove-btn">삭제</button>
    `;
  document.getElementById("imageList").appendChild(div);

  // 삭제 버튼 이벤트
  div
    .querySelector(".remove-btn")
    .addEventListener("click", () => div.remove());
}

function addOptionItem(option) {
  const div = document.createElement("div");
  div.className = "option-item";
  div.innerHTML = `
        <input type="text" class="form-control" value="${option.optionName1}" placeholder="옵션명">
        <input type="number" class="form-control" value="${option.stockQuantity}" placeholder="재고수량">
        <input type="number" class="form-control" value="${option.price}" placeholder="추가금액">
        <button type="button" class="btn btn-danger remove-btn">삭제</button>
    `;
  document.getElementById("optionList").appendChild(div);

  // 삭제 버튼 이벤트
  div
    .querySelector(".remove-btn")
    .addEventListener("click", () => div.remove());
}

function getImageUrls() {
  return Array.from(
    document.getElementById("imageList").querySelectorAll("input"),
  )
    .map((input) => input.value)
    .filter((url) => url.trim() !== "");
}

function getOptions() {
  return Array.from(
    document.getElementById("optionList").querySelectorAll(".option-item"),
  ).map((item) => {
    const inputs = item.querySelectorAll("input");
    return {
      optionName1: inputs[0].value,
      stockQuantity: parseInt(inputs[1].value) || 999,
      price: parseInt(inputs[2].value) || 0,
      usable: true,
    };
  });
}
