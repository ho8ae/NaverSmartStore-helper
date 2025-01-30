// // categoryMapper.js
// class CategoryMapper {
//     constructor() {
//         this.categoryMap = new Map();
//         this.initializeCategoryMap();
//     }

//     async initializeCategoryMap() {
//         try {
//             const response = await fetch(chrome.runtime.getURL('category.csv'));
//             const text = await response.text();
            
//             // CSV 파싱
//             const rows = text.split('\n');
//             rows.forEach(row => {
//                 const [categoryId, ...paths] = row.split(',');
//                 const pathKey = paths.filter(p => p).join('_').toLowerCase();
//                 this.categoryMap.set(pathKey, categoryId);
//             });
//         } catch (error) {
//             console.error('Error loading category mapping:', error);
//         }
//     }

//     findSimilarCategory(targetPath) {
//         // 가장 유사한 카테고리를 찾는 로직
//         let maxSimilarity = 0;
//         let bestMatch = null;

//         for (const [path, id] of this.categoryMap.entries()) {
//             const similarity = this.calculateSimilarity(targetPath, path);
//             if (similarity > maxSimilarity) {
//                 maxSimilarity = similarity;
//                 bestMatch = id;
//             }
//         }

//         return bestMatch;
//     }

//     calculateSimilarity(str1, str2) {
//         // 문자열 유사도 계산 (Levenshtein distance 기반)
//         const matrix = [];

//         for (let i = 0; i <= str1.length; i++) {
//             matrix[i] = [i];
//         }

//         for (let j = 0; j <= str2.length; j++) {
//             matrix[0][j] = j;
//         }

//         for (let i = 1; i <= str1.length; i++) {
//             for (let j = 1; j <= str2.length; j++) {
//                 if (str1[i-1] === str2[j-1]) {
//                     matrix[i][j] = matrix[i-1][j-1];
//                 } else {
//                     matrix[i][j] = Math.min(
//                         matrix[i-1][j-1] + 1,
//                         matrix[i][j-1] + 1,
//                         matrix[i-1][j] + 1
//                     );
//                 }
//             }
//         }

//         const maxLength = Math.max(str1.length, str2.length);
//         return 1 - (matrix[str1.length][str2.length] / maxLength);
//     }

//     mapCategory(categoryLink) {
//         try {
//             // URL에서 카테고리 경로 추출
//             const pathMatch = categoryLink.match(/ca=(.+)$/);
//             if (!pathMatch) return null;

//             const pathParts = pathMatch[1].split('_');
//             const categoryPath = this.getCategoryPath(pathParts);

//             // 정확한 매칭 시도
//             const exactMatch = this.categoryMap.get(categoryPath.toLowerCase());
//             if (exactMatch) return exactMatch;

//             // 유사 카테고리 찾기
//             return this.findSimilarCategory(categoryPath);
//         } catch (error) {
//             console.error('Error mapping category:', error);
//             return null;
//         }
//     }

//     getCategoryPath(pathParts) {
//         // 카테고리 경로를 가져오는 로직
//         const mappedParts = [];
        
//         for (const part of pathParts) {
//             if (part === '00') continue;
//             // 여기에 실제 카테고리 매핑 로직 추가
//             // 예: '02_10_03' -> '패션의류_남성의류_바지'
//             mappedParts.push(this.getMappedCategory(part));
//         }

//         return mappedParts.join('_');
//     }

//     getMappedCategory(code) {
//         // 카테고리 코드를 실제 카테고리명으로 변환
//         const categoryCodeMap = {
//             '02': '패션의류',
//             '10': '남성의류',
//             '03': '바지',
//             // 더 많은 매핑 추가 필요
//         };

//         return categoryCodeMap[code] || code;
//     }
// }

// // content.js에서 사용할 수 있도록 export
// export const categoryMapper = new CategoryMapper();