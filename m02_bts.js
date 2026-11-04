/* =========================================================================
   MODULE 02: LUẬN GIẢI CHI TIẾT DỊCH LÝ TỨ SẮC (5 LINH HỒN + 3 KHÓM)
   - Tự động lấy bài lật từ ngulinh_bts.html
   - Tự động đọc dữ liệu `data` từ file02_bts.html
   ========================================================================= */

const FILE02_URL = 'file02_bts.html';
let file02DataObj = null;

/**
 * Tải và trích xuất dữ liệu `data` từ file02_bts.html bằng DOMParser
 */
async function loadFile02Data() {
    if (file02DataObj) return file02DataObj;
    try {
        const response = await fetch(FILE02_URL);
        if (!response.ok) throw new Error(`Không thể tải File02: ${response.statusText}`);
        const htmlText = await response.text();

        // Dùng DOMParser để đọc thẻ <script> bên trong file02_bts.html
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const scripts = doc.querySelectorAll('script');
        
        let scriptContent = '';
        scripts.forEach(s => {
            if (s.textContent.includes('const data =')) {
                scriptContent = s.textContent;
            }
        });

        if (scriptContent) {
            // Khởi tạo một iframe ẩn tạm thời để thực thi script và lấy biến data chính xác
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            iframe.contentWindow.eval(scriptContent);
            file02DataObj = iframe.contentWindow.data;
            
            document.body.removeChild(iframe); // Xóa iframe sau khi lấy xong data
            return file02DataObj;
        } else {
            throw new Error('Không tìm thấy đoạn script chứa `data` trong file02_bts.html');
        }
    } catch (error) {
        console.error('Lỗi khi đọc File02:', error);
        return null;
    }
}

/**
 * Chuẩn hóa hệ màu về 4 màu gốc: XANH, VÀNG, TRẮNG, ĐỎ
 */
function getNormalizedColor(colorName) {
    if (!colorName) return 'XANH';
    let c = colorName.toUpperCase();
    if (c.includes('XANH')) return 'XANH';
    if (c.includes('VÀNG') || c.includes('VANG') || c.includes('ĐẤT')) return 'VÀNG';
    if (c.includes('TRẮNG') || c.includes('TRANG') || c.includes('XÁM')) return 'TRẮNG';
    if (c.includes('ĐỎ') || c.includes('DO')) return 'ĐỎ';
    return 'XANH';
}

/**
 * Tra cứu ý nghĩa lá bài từ object data
 */
function lookupCardData(card, globalColor, dataObj) {
    if (!card || !dataObj) return { meaning: 'Không có dữ liệu tra cứu.' };

    const type = card.n ? card.n.toUpperCase().trim() : '';
    const color = getNormalizedColor(globalColor);
    const pos = (card.f === 'Đ' || card.f === 'D') ? 'Đứng' : 'Ngược';

    if (dataObj[type] && dataObj[type][color] && dataObj[type][color][pos]) {
        return {
            type,
            color,
            pos,
            meaning: dataObj[type][color][pos]
        };
    }
    return {
        type,
        color,
        pos,
        meaning: 'Không tìm thấy kết quả phù hợp trong File02.'
    };
}

/**
 * Hàm xử lý chính khi trải bài hoàn tất
 */
async function processModule02(state) {
    if (!state) return;

    const dataObj = await loadFile02Data();
    if (!dataObj) {
        console.error("Module 02: Không tải được data từ file02_bts.html");
        return;
    }

    // Tạo hoặc lấy khung chứa kết quả
    let container = document.getElementById('module02-results');
    if (!container) {
        container = document.createElement('div');
        container.id = 'module02-results';
        container.className = 'khom-block';
        container.style.marginTop = '20px';
        container.style.border = '1px solid var(--gold)';
        
        const finalReport = document.getElementById('finalReport');
        if (finalReport) {
            finalReport.appendChild(container);
        }
    }

    let html = `
        <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            ✦ DỊCH LÝ TỨ SẮC — LUẬN GIẢI CHI TIẾT (FILE 02) ✦
        </div>
        <div style="font-family: 'EB Garamond', serif; color: var(--parchment); font-size: 14px; line-height: 1.6; margin-top: 12px;">
    `;

    // 1. Luận giải Ngũ Lá Linh Hồn (5 lá)
    if (state.souls && state.souls.length > 0) {
        html += `
            <div style="font-family: 'Cinzel', serif; color: var(--gold); font-weight: bold; margin-bottom: 8px; font-size: 13px;">
                ❖ NGŨ LÁ LINH HỒN (5 LÁ):
            </div>
        `;
        state.souls.forEach((card, idx) => {
            const res = lookupCardData(card, state.colorName, dataObj);
            html += `
                <div style="background: rgba(255,255,255,0.05); border-left: 3px solid var(--gold); padding: 8px 12px; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                    <span style="color: var(--gold-light); font-weight: bold;">Lá L${idx + 1}: ${res.type} ${res.color} (${res.pos})</span><br>
                    <span style="opacity: 0.95;">- Giải mã: ${res.meaning}</span>
                </div>
            `;
        });
    }

    // 2. Luận giải 3 Khóm Bài (Mỗi khóm 4 lá)
    if (state.khoms && state.khoms.length > 0) {
        const khomLabels = ['QUÁ KHỨ', 'HIỆN TẠI', 'TƯƠNG LAI'];
        state.khoms.forEach((khomCards, kIdx) => {
            html += `
                <div style="font-family: 'Cinzel', serif; color: var(--gold); font-weight: bold; margin-top: 14px; margin-bottom: 8px; font-size: 13px;">
                    ❖ KHÓM ${kIdx + 1} — ${khomLabels[kIdx]} (4 LÁ):
                </div>
            `;
            khomCards.forEach((card, cIdx) => {
                const res = lookupCardData(card, state.colorName, dataObj);
                html += `
                    <div style="background: rgba(0,0,0,0.25); border-left: 3px solid #8fbc8f; padding: 8px 12px; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                        <span style="color: var(--gold-light); font-weight: bold;">Lá ${kIdx * 4 + cIdx + 1}: ${res.type} ${res.color} (${res.pos})</span><br>
                        <span style="opacity: 0.95;">- Giải mã: ${res.meaning}</span>
                    </div>
                `;
            });
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Lắng nghe sự kiện hoàn tất bài lật
window.addEventListener('ngulinh:completed', (event) => {
    processModule02(event.detail);
});
