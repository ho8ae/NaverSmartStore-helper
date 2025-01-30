// class NaverAPIAuth {
//     constructor(clientId, clientSecret) {
//         this.clientId = clientId;
//         this.clientSecret = clientSecret;
//         this.accessToken = null;
//         this.tokenExpireTime = null;
        
//         console.log('Auth 초기화 및 bcrypt 확인:', {
//             hasBcrypt: typeof window.bcrypt !== 'undefined',
//             hasHashSync: typeof window.bcrypt?.hashSync === 'function',
//             clientId: this.clientId,
//             clientSecretPrefix: this.clientSecret?.substring(0, 10) + '...'
//         });
//     }

//     async generateSignature() {
//         try {
//             // 밀리초 단위 타임스탬프 사용
//             const timestamp = Date.now().toString();
//             const message = `${this.clientId}_${timestamp}`;
            
//             console.log('서명 생성 준비:', {
//                 timestamp,
//                 message,
//                 clientSecretFormat: this.clientSecret?.substring(0, 10) + '...'
//             });

//             // bcrypt 해싱
//             const hashedMessage = window.bcrypt.hashSync(message, this.clientSecret);
            
//             console.log('해시 생성 결과:', {
//                 hashedMessage: hashedMessage?.substring(0, 20) + '...',
//                 length: hashedMessage?.length
//             });

//             // Base64 인코딩 (URL safe)
//             const signature = Buffer.from(hashedMessage).toString('base64');

//             console.log('최종 서명:', {
//                 signature: signature.substring(0, 20) + '...',
//                 length: signature.length
//             });

//             return { signature, timestamp };
//         } catch (error) {
//             console.error('서명 생성 실패:', error);
//             throw error;
//         }
//     }

//     async requestToken() {
//         try {
//             const { signature, timestamp } = await this.generateSignature();

//             const params = new URLSearchParams({
//                 client_id: this.clientId,
//                 timestamp: timestamp,
//                 client_secret_sign: signature,
//                 grant_type: 'client_credentials',
//                 type: 'SELF'
//             });

//             console.log('API 요청 상세:', {
//                 url: 'https://api.commerce.naver.com/external/v1/oauth2/token',
//                 parameters: Object.fromEntries(params.entries()),
//                 currentTime: new Date().toISOString()
//             });

//             const response = await fetch('https://api.commerce.naver.com/external/v1/oauth2/token', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                     'Accept': 'application/json'
//                 },
//                 body: params
//             });

//             const responseData = await response.json();
            
//             if (!response.ok) {
//                 console.error('API 에러 상세:', {
//                     status: response.status,
//                     statusText: response.statusText,
//                     headers: Object.fromEntries(response.headers.entries()),
//                     data: responseData,
//                     invalidInputs: responseData.invalidInputs
//                 });
//                 throw new Error(responseData.message || '토큰 발급 실패');
//             }

//             this.accessToken = responseData.access_token;
//             this.tokenExpireTime = Date.now() + (responseData.expires_in * 1000);
            
//             return this.accessToken;
//         } catch (error) {
//             console.error('토큰 발급 요청 실패:', error);
//             throw error;
//         }
//     }

//     async getAccessToken() {
//         console.log('토큰 유효성 검사:', {
//             hasToken: !!this.accessToken,
//             hasExpireTime: !!this.tokenExpireTime,
//             isValid: this.isTokenValid()
//         });

//         if (!this.isTokenValid()) {
//             await this.requestToken();
//         }
//         return this.accessToken;
//     }

//     isTokenValid() {
//         return this.accessToken && 
//                this.tokenExpireTime && 
//                Date.now() < this.tokenExpireTime;
//     }
// }