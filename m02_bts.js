/* =========================================================================
   MODULE 02: LUẬN GIẢI CHI TIẾT DỊCH LÝ TỨ SẮC (FILE 02)
   - Độc lập hoàn toàn, không gây đứt đoạn các module khác
   ========================================================================= */

(function () {
    const FILE02_URL = 'file02_bts.html';
    let file02DataObj = null;

    async function loadFile02Data() {
        if (file02DataObj) return file02DataObj;
        try {
            const response = await fetch(FILE02_URL);
            if (!response.ok) throw new Error(`Không thể tải File02 (${response.status})`);
            const htmlText = await response.text();

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
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                
                iframe.contentWindow.eval(scriptContent);
                file02DataObj = iframe.contentWindow.data;
                document.body.removeChild(iframe);
                return file02DataObj;
            }
            return null;
        } catch (error) {
            console.error('Module 02 - Lỗi tải dữ liệu:', error);
            return null;
        }
    }

    function getNormalizedColorM02(colorName) {
        if (!colorName) return 'XANH';
        let c = colorName.toUpperCase();
        if (c.includes('XANH')) return 'XANH';
        if (c.includes('VÀNG') || c.includes('VANG') || c.includes('ĐẤT')) return 'VÀNG';
        if (c.includes('TRẮNG') || c.includes('TRANG') || c.includes('XÁM')) return 'TRẮNG';
        if (c.includes('ĐỎ') || c.includes('DO')) return 'ĐỎ';
        return 'XANH';
    }

    function lookupCardData(card, globalColor, dataObj) {
        if (!card || !dataObj) return { meaning: 'Chưa tìm thấy dữ liệu giải mã.' };

        const type = card.n ? card.n.toUpperCase().trim() : '';
        const color = getNormalizedColorM02(globalColor);
        const pos = (card.f === 'Đ' || card.f === 'D') ? 'Đứng' : 'Ngược';

        if (dataObj[type] && dataObj[type][color] && dataObj[type][color][pos]) {
            return { type, color, pos, meaning: dataObj[type][color][pos] };
        }
        return { type, color, pos, meaning: 'Không tìm thấy kết quả phù hợp trong File02.' };
    }

    async function processModule02(state) {
        if (!state) return;

        let container = document.getElementById('module02-results');
        if (!container) {
            container = document.createElement('div');
            container.id = 'module02-results';
            container.className = 'khom-block';
            container.style.marginTop = '20px';
            container.style.border = '1px solid var(--gold)';
            
            const finalReport = document.getElementById('finalReport');
            if (finalReport) finalReport.appendChild(container);
        }

        const dataObj = await loadFile02Data();
        if (!dataObj) {
            container.innerHTML = `
                <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center;">✦ LUẬN GIẢI FILE 02 ✦</div>
                <div style="color: #ff9999; font-style: italic; text-align: center; margin-top: 8px;">❌ Không thể tải dữ liệu từ file02_bts.html (Hãy kiểm tra lại vị trí file hoặc server)</div>
            `;
            return;
        }

        let html = `
            <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                ✦ DỊCH LÝ TỨ SẮC — LUẬN GIẢI CHI TIẾT (FILE 02) ✦
            </div>
            <div style="font-family: 'EB Garamond', serif; color: var(--parchment); font-size: 14px; line-height: 1.6; margin-top: 12px;">
        `;

        if (state.souls && state.souls.length > 0) {
            html += `<div style="font-family: 'Cinzel', serif; color: var(--gold); font-weight: bold; margin-bottom: 8px; font-size: 13px;">❖ NGŨ LÁ LINH HỒN (5 LÁ):</div>`;
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

        if (state.khoms && state.khoms.length > 0) {
            const khomLabels = ['QUÁ KHỨ', 'HIỆN TẠI', 'TƯƠNG LAI'];
            state.khoms.forEach((khomCards, kIdx) => {
                html += `<div style="font-family: 'Cinzel', serif; color: var(--gold); font-weight: bold; margin-top: 14px; margin-bottom: 8px; font-size: 13px;">❖ KHÓM ${kIdx + 1} — ${khomLabels[kIdx]} (4 LÁ):</div>`;
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

    window.addEventListener('ngulinh:completed', (event) => {
        processModule02(event.detail);
    });
})();
