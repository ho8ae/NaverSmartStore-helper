import sys
import json
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QHBoxLayout, QPushButton, QLabel, QLineEdit, 
                            QTextEdit, QProgressBar, QComboBox, QMessageBox)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
import bcrypt
import pybase64
import requests
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import logging
import chromedriver_autoinstaller

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='smart_store_auto.log'
)

class NaverCommerceAPI:
    def __init__(self, client_id, client_secret):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://api.commerce.naver.com/external"
    
    def generate_signature(self, timestamp):
        password = f"{self.client_id}_{timestamp}"
        hashed = bcrypt.hashpw(password.encode('utf-8'), 
                             self.client_secret.encode('utf-8'))
        return pybase64.standard_b64encode(hashed).decode('utf-8')
    
    def get_access_token(self):
        current_time = time.time()
        if self.access_token and current_time < self.token_expires_at - 1800:
            return self.access_token
            
        timestamp = int(time.time() * 1000)
        signature = self.generate_signature(timestamp)
        
        data = {
            'client_id': self.client_id,
            'timestamp': timestamp,
            'grant_type': 'client_credentials',
            'client_secret_sign': signature,
            'type': 'SELF'
        }
        
        response = requests.post(f"{self.base_url}/v1/oauth2/token", data=data)
        if response.status_code == 200:
            result = response.json()
            self.access_token = result['access_token']
            self.token_expires_at = current_time + result['expires_in']
            return self.access_token
            
        raise Exception(f"토큰 발급 실패: {response.text}")
        
    def upload_image(self, image_url, token):
        try:
            # 이미지 다운로드
            image_response = requests.get(image_url)
            if image_response.status_code != 200:
                raise Exception("이미지 다운로드 실패")

            # 이미지 업로드 API 호출
            upload_url = f"{self.base_url}/v1/product-images/upload"

            files = {
                'imageFiles': ('image.jpg', image_response.content, 'image/jpeg')
            }

            headers = {
                'Authorization': f'Bearer {token}'
            }

            response = requests.post(upload_url, files=files, headers=headers)
            logging.info(f"이미지 업로드 응답: {response.text}")

            if response.status_code != 200:
                raise Exception(f"이미지 업로드 실패: {response.text}")

            result = response.json()
            if result.get('images') and len(result['images']) > 0:
                return result['images'][0]['url']
            else:
                raise Exception("이미지 URL을 찾을 수 없습니다.")

        except Exception as e:
            raise Exception(f"이미지 업로드 중 오류 발생: {str(e)}")

class ProductCrawler:
    def __init__(self, site_type="도매꾹"):
        self.site_type = site_type
        self.driver = None
        self.selectors = self.get_selectors(site_type)
        
    def get_selectors(self, site_type):
        # 사이트별 선택자 정의
        selectors = {
            "도매꾹": {
                "title": "h1#lInfoItemTitle",
                "price": "div.lItemPrice",
                "description": "div#lInfoViewItemContents",
                "images": "img.mainThumb",
                "options": "ul.pSelectUIMenu li:not(.pDisabled) button.pSelectUIBtn",
                "origin": "td.lInfoItemCountryContent"
            },
            "위탁판매사이트1": {
                "title": "h1.product-name",
                "price": "span.price",
                "description": "div.description",
                "images": "div.product-gallery img"
            }
        }
        return selectors.get(site_type, {})
    
    def init_driver(self):
        try:
            # Chrome 드라이버 자동 설치
            chromedriver_autoinstaller.install()
            
            # Chrome 옵션 설정
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--start-maximized')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except Exception as e:
            logging.error(f"드라이버 초기화 실패: {str(e)}")
            return False
    
    def crawl_product(self, url):
        try:
            if not self.driver and not self.init_driver():
                raise Exception("Chrome 드라이버 초기화 실패")
                
            logging.info(f"크롤링 시작: {url}")
            self.driver.get(url)
            wait = WebDriverWait(self.driver, 10)
            time.sleep(3)  # 페이지 로딩 대기
            
            # 옵션 정보 수집
            options = []
            option_elements = self.driver.find_elements(By.CSS_SELECTOR, self.selectors['options'])
            for element in option_elements:
                option_text = element.text
                if '판매종료' not in option_text:
                    # 재고 수량 추출
                    stock = ''.join(filter(str.isdigit, option_text.split('(')[-1].split(')')[0]))
                    option_name = option_text.split('(')[0].strip()
                    options.append({
                        'name': option_name,
                        'stock': int(stock) if stock else 0
                    })
            
            # 원산지 정보
            origin = self.get_element_text(wait, self.selectors['origin'])
            
            product_info = {
                'title': self.get_element_text(wait, self.selectors['title']),
                'price': self.clean_price(self.get_element_text(wait, self.selectors['price'])),
                'description': self.get_element_text(wait, self.selectors['description']),
                'images': self.get_element_attributes(wait, self.selectors['images'], 'src'),
                'options': options,
                'origin': origin
            }
            
            return product_info
        except Exception as e:
            logging.error(f"크롤링 실패: {str(e)}")
            raise
        
    def clean_price(self, price_text):
        # 가격에서 숫자만 추출
        return int(''.join(filter(str.isdigit, price_text or "0")))
    
    def get_element_text(self, wait, selector):
        try:
            element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
            return element.text.strip()
        except Exception as e:
            logging.warning(f"요소 텍스트 가져오기 실패 ({selector}): {str(e)}")
            return ""
    
    def get_element_attributes(self, wait, selector, attribute):
        try:
            elements = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))
            return [element.get_attribute(attribute) for element in elements if element.get_attribute(attribute)]
        except Exception as e:
            logging.warning(f"요소 속성 가져오기 실패 ({selector}): {str(e)}")
            return []
    
    def close(self):
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass

class WorkerThread(QThread):
    progress = pyqtSignal(int)
    finished = pyqtSignal(dict)
    error = pyqtSignal(str)
    
    def __init__(self, url, api_client, site_type):
        super().__init__()
        self.url = url
        self.api_client = api_client
        self.site_type = site_type
    
    def prepare_product_data(self, product_info, uploaded_images, detail_content):
        return {
            "originProduct": {
                "excludeAdminAutoUpdate": True,
                "excludeSettle": True,
                "statusType": "SALE",
                "saleType": "NEW",
                "leafCategoryId": "50000803",
                "name": product_info['title'],
                "detailContent": detail_content,
                "images": {
                    "representativeImage": {
                        "url": uploaded_images[0]
                    },
                    "optionalImages": [
                        {"url": img} for img in uploaded_images[1:] if img
                    ]
                },
                "salePrice": product_info['price'],
                "stockQuantity": 999,
                "detailAttribute": {
                    "hasManuallyEnteredProductInfo": True,
                    "productInfoProvidedNotice": {
                        "productInfoProvidedNoticeType": "WEAR",
                        # wear 필드를 바로 추가
                        "wear": {
                            "material": "상세페이지 참조",      # 소재
                            "color": "상세페이지 참조",         # 색상
                            "size": "상세페이지 참조",          # 치수
                            "manufacturer": "상세페이지 참조",   # 제조자
                            "caution": "상세페이지 참조",       # 취급시 주의사항
                            "packDate": "2024-01",            # 제조연월 (필드명 수정)
                            "warrantyPolicy": "상세페이지 참조", # 품질보증기준
                            "afterServiceDirector": "1234-5678" # A/S 책임자와 전화번호
                        }
                    },
                    "originAreaInfo": {
                        "originAreaCode": "0200037",
                        "content": product_info.get('origin', '수입산'),
                        "plural": False,
                        "importer": "주식회사 수입사"
                    },
                    "minorPurchasable": True,
                    "afterServiceInfo": {
                        "afterServiceTelephoneNumber": "1234-5678",
                        "afterServiceGuideContent": "구매자 단순변심 반품 가능"
                    }
                }
            },
            "smartstoreChannelProduct": {
                "naverShoppingRegistration": True,
                "channelProductDisplayStatusType": "ON"
            }
        }

    def run(self):
        crawler = None
        try:
            self.progress.emit(10)
            crawler = ProductCrawler(self.site_type)
            
            self.progress.emit(20)
            product_info = crawler.crawl_product(self.url)
            
            self.progress.emit(40)
            token = self.api_client.get_access_token()
            
            self.progress.emit(50)
    
            if not product_info['images']:
                raise Exception("상품 이미지를 찾을 수 없습니다.")
    
            # 이미지 정보 로깅
            logging.info("크롤링된 이미지 정보:")
            for idx, img_url in enumerate(product_info['images']):
                logging.info(f"Image {idx + 1}: {img_url}")
    
            # 이미지 업로드
            total_images = len(product_info['images'])
            uploaded_images = []
            for idx, img_url in enumerate(product_info['images']):
                progress = 50 + ((idx + 1) / total_images * 20)
                self.progress.emit(int(progress))
                logging.info(f"이미지 업로드 시도 {idx + 1}/{total_images}: {img_url}")
                uploaded_url = self.api_client.upload_image(img_url, token)
                uploaded_images.append(uploaded_url)
                logging.info(f"이미지 업로드 성공 {idx + 1}: {uploaded_url}")
    
            self.progress.emit(80)
            
            # HTML 형식의 상세 설명 구성
            detail_content = f"""
                <div style="width:100%; margin:0 auto; text-align:center;">
                    <h2>{product_info['title']}</h2>
                    {''.join([f'<div style="margin:30px 0;"><img src="{img}" style="max-width:100%;" /></div>' for img in uploaded_images])}
                    <div>{product_info.get('description', '')}</div>
                </div>
            """
            
            self.progress.emit(90)
            
            # 상품 데이터 준비
            data = self.prepare_product_data(product_info, uploaded_images, detail_content)
            
            # 상품 등록 API 호출
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            logging.info("상품 등록 API 호출")
            response = requests.post(
                f"{self.api_client.base_url}/v2/products",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                logging.info("상품 등록 성공")
                self.progress.emit(100)
                self.finished.emit(response.json())
            else:
                error_msg = f"상품 등록 실패: {response.text}"
                logging.error(error_msg)
                raise Exception(error_msg)
                    
        except Exception as e:
            logging.error(f"작업 실패: {str(e)}")
            self.error.emit(str(e))
        finally:
            if crawler:
                crawler.close()





class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.initUI()
        self.load_config()
        
    def initUI(self):
        self.setWindowTitle('스마트스토어 자동등록 프로그램')
        self.setGeometry(100, 100, 800, 600)
        
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout()
        
        # API 설정 그룹
        api_group = QVBoxLayout()
        
        # Client ID 입력
        client_id_layout = QHBoxLayout()
        client_id_layout.addWidget(QLabel('Client ID:'))
        self.client_id_input = QLineEdit()
        client_id_layout.addWidget(self.client_id_input)
        api_group.addLayout(client_id_layout)
        
        # Client Secret 입력
        client_secret_layout = QHBoxLayout()
        client_secret_layout.addWidget(QLabel('Client Secret:'))
        self.client_secret_input = QLineEdit()
        client_secret_layout.addWidget(self.client_secret_input)
        api_group.addLayout(client_secret_layout)
        
        # 사이트 선택
        site_layout = QHBoxLayout()
        site_layout.addWidget(QLabel('사이트 선택:'))
        self.site_combo = QComboBox()
        self.site_combo.addItems(['도매꾹', '위탁판매사이트1'])
        site_layout.addWidget(self.site_combo)
        api_group.addLayout(site_layout)
        
        # URL 입력
        url_layout = QHBoxLayout()
        url_layout.addWidget(QLabel('상품 URL:'))
        self.url_input = QLineEdit()
        url_layout.addWidget(self.url_input)
        
        # 진행 상황
        self.progress_bar = QProgressBar()
        
        # 로그
        log_label = QLabel('작업 로그:')
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        
        # 버튼
        button_layout = QHBoxLayout()
        self.register_btn = QPushButton('상품 등록')
        self.register_btn.clicked.connect(self.register_product)
        self.save_config_btn = QPushButton('설정 저장')
        self.save_config_btn.clicked.connect(self.save_config)
        button_layout.addWidget(self.register_btn)
        button_layout.addWidget(self.save_config_btn)
        
        # 레이아웃 구성
        layout.addLayout(api_group)
        layout.addLayout(url_layout)
        layout.addWidget(self.progress_bar)
        layout.addWidget(log_label)
        layout.addWidget(self.log_text)
        layout.addLayout(button_layout)
        
        main_widget.setLayout(layout)
    
    def load_config(self):
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                self.client_id_input.setText(config.get('client_id', ''))
                self.client_secret_input.setText(config.get('client_secret', ''))
        except FileNotFoundError:
            pass
    
    def save_config(self):
        config = {
            'client_id': self.client_id_input.text(),
            'client_secret': self.client_secret_input.text()
        }
        with open('config.json', 'w', encoding='utf-8') as f:
            json.dump(config, f)
        QMessageBox.information(self, '알림', '설정이 저장되었습니다.')
    
    def register_product(self):
        client_id = self.client_id_input.text()
        client_secret = self.client_secret_input.text()
        url = self.url_input.text()
        
        if not all([client_id, client_secret, url]):
            QMessageBox.warning(self, '경고', '모든 필드를 입력해주세요.')
            return
        
        self.progress_bar.setValue(0)
        self.register_btn.setEnabled(False)
        
        api_client = NaverCommerceAPI(client_id, client_secret)
        site_type = self.site_combo.currentText()
        
        self.worker = WorkerThread(url, api_client, site_type)
        self.worker.progress.connect(self.update_progress)
        self.worker.finished.connect(self.on_registration_complete)
        self.worker.error.connect(self.on_error)
        self.worker.start()
    
    def update_progress(self, value):
        self.progress_bar.setValue(value)
        self.log_text.append(f"진행률: {value}%")
    
    def on_registration_complete(self, result):
        self.register_btn.setEnabled(True)
        self.log_text.append("상품 등록 완료!")
        self.log_text.append(f"결과: {json.dumps(result, indent=2, ensure_ascii=False)}")
        QMessageBox.information(self, '완료', '상품이 성공적으로 등록되었습니다.')
    
    def on_error(self, error_msg):
        self.register_btn.setEnabled(True)
        self.log_text.append(f"오류 발생: {error_msg}")
        QMessageBox.warning(self, '오류', f'오류가 발생했습니다:\n{error_msg}')

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()