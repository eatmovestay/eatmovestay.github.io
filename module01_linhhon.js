/* =========================================================================
   MODULE 01: LUẬN GIẢI NGŨ LÁ LINH HỒN (5 LÁ)
   - Tự động lấy dữ liệu 5 Lá Linh Hồn từ trận bài ngulinh_bts.html
   - Tự động truy cập file01_bts.html trên GitHub/Repository để lấy DATABASE
   - Thực hiện thuật toán trích xuất luận giải & hiển thị kết quả tự động
   ========================================================================= */

// URL đường dẫn đến File01 chứa dữ liệu (cùng Repository trên GitHub)
const FILE01_URL = './file01_bts.html';

// Lưu trữ DATABASE sau khi tải từ File01
let file01Database = null;

/**
 * Hàm tải và trích xuất DATABASE từ file01_bts.html
 */
async function loadFile01Database() {
    if (file01Database) return file01Database;
    try {
        const response = await fetch(FILE01_URL);
        if (!response.ok) throw new Error(`Không thể tải file: ${response.statusText}`);
        const htmlText = await response.text();
        
        // Trích xuất biến DATABASE nằm giữa hai dấu ` trong script của File01
        const dbMatch = htmlText.match(/const\s+DATABASE\s*=\s*`([\s\S]*?)`;/);
        if (dbMatch && dbMatch[1]) {
            file01Database = dbMatch[1].normalize('NFC');
            return file01Database;
        } else {
            throw new Error('Không tìm thấy biến DATABASE trong File01');
        }
    } catch (error) {
        console.error('Lỗi khi tải File01:', error);
        return null;
    }
}

/**
 * Chuẩn hóa tên lá bài từ ngulinh_bts.html thành chuỗi truy vấn cho File01
 * Ví dụ: { n: 'TƯỚNG', f: 'Đ' }, color: 'XANH' -> "TƯỚNG XANH Đ"
 */
function formatCardQuery(card, colorName) {
    if (!card) return '';
    const name = card.n ? card.n.toUpperCase().trim() : '';
    // Lấy màu sắc chuẩn (XANH, VÀNG, TRẮNG, ĐỎ)
    let color = colorName ? colorName.toUpperCase().trim() : '';
    color = color.replace(/✦/g, '').replace(/CÔNG DANH/g, '').replace(/TÀI LỘC/g, '')
                 .replace(/GIA ĐẠO/g, '').replace(/TÌNH DUYÊN/g, '').replace(/LÁ/g, '')
                 .replace(/ĐẤT/g, '').replace(/XÁM/g, '').replace(/[\/\—\-]/g, '').trim();

    // Giới tính / Trạng thái: 'Đ' = Đứng, 'N' = Ngược đầu
    const status = card.f ? card.f.toUpperCase().trim() : 'Đ';
    return `${name} ${color} ${status}`.trim();
}

/**
 * Thuật toán bóc tách dữ liệu đoạn văn ý nghĩa từ DATABASE của File01
 */
function extractCardMeaning(searchKey, database) {
    if (!database) return "❌ Chưa tải được cơ sở dữ liệu File01.";
    
    const lines = database.split('\n');
    const keyClean = searchKey.normalize('NFC').toUpperCase().trim();
    
    // RegExp khớp chính xác dòng tiêu đề lá bài (Ví dụ: "TƯỚNG XANH Đ :")
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isChung = keyClean.split(' ').length === 2;
    const keyRe = isChung
        ? new RegExp('^\\s*(\\d+\\.\\s*)?' + escapeRe(keyClean) + '\\s*:?\\s*$')
        : new RegExp('^\\s*' + escapeRe(keyClean) + '\\s*:');

    let foundIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (keyRe.test(lines[i].normalize('NFC').toUpperCase())) { 
            foundIdx = i; 
            break; 
        }
    }

    if (foundIdx !== -1) {
        let segment = [lines[foundIdx]];
        for (let j = foundIdx + 1; j < lines.length; j++) {
            let lineText = lines[j].trim();
            if (lineText === "") continue;

            // Gặp dòng nhãn lá bài khác hoặc nhóm mới -> Dừng lại
            const m = lineText.match(/^(\d+\.\s*)?([^:]{1,40}?)\s*:/);
            if (m && m[2] === m[2].toUpperCase()) {
                if (m[2].trim() !== keyClean) break;
            }
            if (/^\d+\./.test(lineText)) break;

            segment.push(lines[j]);
        }
        return segment.join('\n').trim();
    } else {
        return "❌ KHÔNG KHỚP DỮ LIỆU: " + keyClean;
    }
}

/**
 * Xử lý luận giải cho 5 Lá Linh Hồn và hiển thị lên giao diện
 */
async function processLinhHonModule(state) {
    if (!state || !state.souls || state.souls.length === 0) return;

    // Tải DATABASE từ file01_bts.html
    const database = await loadFile01Database();
    if (!database) return;

    // Kiểm tra hoặc tạo khu vực hiển thị kết quả luận giải Linh Hồn
    let resultContainer = document.getElementById('module01-results');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'module01-results';
        resultContainer.className = 'khom-block';
        resultContainer.style.marginTop = '20px';
        resultContainer.style.border = '1px solid var(--gold)';
        
        // Thêm vào dưới khu vực finalReport
        const finalReport = document.getElementById('finalReport');
        if (finalReport) {
            finalReport.appendChild(resultContainer);
        }
    }

    let htmlOutput = `
        <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            ✦ LUẬN GIẢI CHI TIẾT NGŨ LÁ LINH HỒN ✦
        </div>
        <div style="font-family: 'EB Garamond', serif; color: var(--parchment); font-size: 15px; line-height: 1.6; margin-top: 12px;">
    `;

    // Lặp qua 5 Lá Linh Hồn và tra cứu nội dung
    state.souls.forEach((card, idx) => {
        const queryKey = formatCardQuery(card, state.colorName);
        const meaning = extractCardMeaning(queryKey, database);

        htmlOutput += `
            <div style="background: rgba(0,0,0,0.3); border-left: 3px solid var(--gold); padding: 10px 12px; margin-bottom: 12px; border-radius: 0 4px 4px 0;">
                <div style="font-family: 'Cinzel', serif; color: var(--gold-light); font-weight: bold; font-size: 13px;">
                    LÁ LINH HỒN ${idx + 1}: ${queryKey}
                </div>
                <div style="margin-top: 6px; white-space: pre-wrap; font-style: normal; opacity: 0.95;">${meaning}</div>
            </div>
        `;
    });

    htmlOutput += `</div>`;
    resultContainer.innerHTML = htmlOutput;
}

// Lắng nghe sự kiện "ngulinh:completed" khi lật xong bài 13
window.addEventListener('ngulinh:completed', (event) => {
    processLinhHonModule(event.detail);
});
