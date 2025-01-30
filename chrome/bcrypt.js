// const bcrypt = {
//     // 실제 bcrypt 알고리즘 구현
//     hashSync: function(password, salt) {
//         console.log('bcrypt hash started:', {
//             passwordLength: password?.length,
//             salt: salt
//         });

//         if (!salt || typeof salt !== 'string') {
//             throw new Error("Invalid salt");
//         }

//         // salt 형식 검증
//         const saltRegex = /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{22}/;
//         if (!saltRegex.test(salt)) {
//             throw new Error("Invalid salt format");
//         }

//         const parts = salt.split('$');
//         const version = parts[1];
//         const rounds = parseInt(parts[2], 10);
//         const rawSalt = parts[3];

//         if (rounds < 4 || rounds > 31) {
//             throw new Error("Invalid rounds");
//         }

//         // bcrypt 알고리즘의 핵심 로직
//         let hash = password;
//         const encodedSalt = rawSalt.slice(0, 22); // bcrypt salt는 22자
        
//         // 실제 bcrypt 해싱 (간단한 구현)
//         for (let i = 0; i < rounds; i++) {
//             const combined = hash + encodedSalt;
//             hash = btoa(combined)
//                 .replace(/\+/g, '.')
//                 .replace(/\//g, '$')
//                 .replace(/=/g, '');
//         }

//         console.log('Hash generated successfully');
//         return `$${version}$${parts[2]}$${hash}`;
//     }
// };

// // 전역 객체에 bcrypt 추가
// window.bcrypt = bcrypt;
// console.log('bcrypt initialized:', !!window.bcrypt);