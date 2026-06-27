const fs = require('fs');
const src1 = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\e4ebc7ac-6eb6-4f47-b060-2e39c99f1181\\nutrition_mape_chart_1781429964054.png';
const src2 = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\e4ebc7ac-6eb6-4f47-b060-2e39c99f1181\\ocr_f1_chart_1781429987774.png';
const dst1 = 'C:\\Users\\ASUS\\Desktop\\Nutralyze-Complete\\Fig2_Nutrition_MAPE.png';
const dst2 = 'C:\\Users\\ASUS\\Desktop\\Nutralyze-Complete\\Fig3_OCR_F1.png';
try { fs.copyFileSync(src1, dst1); console.log('✅ Copied Fig2_Nutrition_MAPE.png'); } catch(e) { console.log('❌ Fig2 error:', e.message); }
try { fs.copyFileSync(src2, dst2); console.log('✅ Copied Fig3_OCR_F1.png'); } catch(e) { console.log('❌ Fig3 error:', e.message); }
