/* =========================================================================
   MODULE 03: LUẬN GIẢI CẶP LÁ CÙNG ĐỨNG (Đ) TRONG 3 KHÓM (FILE 03)
   - Độc lập hoàn toàn, bóc tách dữ liệu an toàn
   ========================================================================= */

(function () {
    const FILE03_URL = 'file03_bts.html';
    let file03DataText = null;

    async function loadFile03Data() {
        if (file03DataText) return file03DataText;
        try {
            const response = await fetch(FILE03_URL);
            if (!response.ok) throw new Error(`Không thể tải File03 (${response.status})`);
            const htmlText = await response.text();

            const match = htmlText.match(/const\s+THU_VIEN_DATA\s*=\s*`([\s\S]*?)`;/);
            if (match && match[1]) {
                file03DataText = match[1];
                return file03DataText;
            }
            return null;
        } catch (error) {
            console.error('Module 03 - Lỗi tải dữ liệu:', error);
            return null;
        }
    }

    function timKiemFile03(chu, gap, layBenPhai, dataText) {
        if (!dataText) return null;
        let cleanChu = chu.trim().toUpperCase();
        let cleanGap = gap.trim().toUpperCase();
        let lines = dataText.split('\n');
        let indexNhom = -1;

        for (let i = 0; i < lines.length; i++) {
            let row = lines[i].trim().toUpperCase();
            if (row.includes(cleanChu) && row.includes(":")) {
                if (!row.startsWith("GẶP")) { indexNhom = i; break; }
            }
        }

        if (indexNhom === -1) return null;

        for (let j = indexNhom + 1; j < lines.length; j++) {
            let row = lines[j].trim().toUpperCase();
            if (row.includes(":") && !row.startsWith("GẶP")) break;
            if (row.startsWith("GẶP") && row.includes(cleanGap)) {
                let textSauDauHaiCham = lines[j].split(":")[1] || "";
                let haiVe = textSauDauHaiCham.split("|");
                if (haiVe.length >= 2) return layBenPhai ? haiVe[1].trim() : haiVe[0].trim();
                else if (haiVe.length === 1) return haiVe[0].trim();
            }
        }
        return null;
    }

    function formatCardM03(card, globalColor) {
        if (!card) return '';
        const name = card.n ? card.n.toUpperCase().trim() : '';

        let color = globalColor ? globalColor.toUpperCase().trim() : 'XANH';
        if (color.includes('XANH')) color = 'XANH';
        else if (color.includes('VÀNG') || color.includes('VANG') || color.includes('ĐẤT')) color = 'VÀNG';
        else if (color.includes('TRẮNG') || color.includes('TRANG') || color.includes('XÁM')) color = 'TRẮNG';
        else if (color.includes('ĐỎ') || color.includes('DO')) color = 'ĐỎ';

        return `${name} ${color} Đ`.trim();
    }

    async function processModule03(state) {
        if (!state || !state.khoms || state.khoms.length === 0) return;

        let container = document.getElementById('module03-results');
        if (!container) {
            container = document.createElement('div');
            container.id = 'module03-results';
            container.className = 'khom-block';
            container.style.marginTop = '20px';
            container.style.border = '1px solid var(--gold)';

            const finalReport = document.getElementById('finalReport');
            if (finalReport) finalReport.appendChild(container);
        }

        const dataText = await loadFile03Data();
        if (!dataText) {
            container.innerHTML = `
                <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center;">✦ LUẬN GIẢI FILE 03 ✦</div>
                <div style="color: #ff9999; font-style: italic; text-align: center; margin-top: 8px;">❌ Không thể tải dữ liệu từ file03_bts.html (Hãy kiểm tra lại vị trí file)</div>
            `;
            return;
        }

        const khomLabels = ['QUÁ KHỨ', 'HIỆN TẠI', 'TƯƠNG LAI'];
        let htmlOutput = `
            <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                ✦ LUẬN GIẢI CẶP LÁ CÙNG ĐỨNG (Đ) — KHÓM BÀI (FILE 03) ✦
            </div>
            <div style="font-family: 'EB Garamond', serif; color: var(--parchment); font-size: 14px; line-height: 1.6; margin-top: 12px;">
        `;

        let totalPairsFound = 0;

        state.khoms.forEach((khomCards, kIdx) => {
            let khomPairHtml = '';

            for (let i = 0; i < khomCards.length - 1; i++) {
                const card1 = khomCards[i];
                const card2 = khomCards[i + 1];

                const isCard1Dung = (card1.f === 'Đ' || card1.f === 'D');
                const isCard2Dung = (card2.f === 'Đ' || card2.f === 'D');

                if (isCard1Dung && isCard2Dung) {
                    const strL = formatCardM03(card1, state.colorName);
                    const strR = formatCardM03(card2, state.colorName);

                    let meaning = timKiemFile03(strL, strR, true, dataText);
                    if (!meaning) meaning = timKiemFile03(strR, strL, false, dataText);

                    if (meaning) {
                        totalPairsFound++;
                        khomPairHtml += `
                            <div style="background: rgba(201,168,76,0.08); border-left: 3px solid var(--gold); padding: 8px 12px; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                                <span style="color: var(--gold-light); font-weight: bold;">
                                    ✦ Cặp Lá ${i + 1} & ${i + 2}: ${strL} — ${strR}
                                </span><br>
                                <span style="opacity: 0.95;">➤ Giải mã: ${meaning}</span>
                            </div>
                        `;
                    }
                }
            }

            if (khomPairHtml !== '') {
                htmlOutput += `
                    <div style="font-family: 'Cinzel', serif; color: var(--gold); font-weight: bold; margin-top: 12px; margin-bottom: 6px; font-size: 13px;">
                        ❖ KHÓM ${kIdx + 1} — ${khomLabels[kIdx]}:
                    </div>
                    ${khomPairHtml}
                `;
            }
        });

        if (totalPairsFound === 0) {
            htmlOutput += `
                <div style="text-align: center; font-style: italic; color: rgba(245,237,214,0.7); padding: 10px 0;">
                    Không có cặp lá bài nào CÙNG VỊ TRÍ ĐỨNG (Đ) đi cạnh nhau trong 3 Khóm.
                </div>
            `;
        }

        htmlOutput += `</div>`;
        container.innerHTML = htmlOutput;
    }

    window.addEventListener('ngulinh:completed', (event) => {
        processModule03(event.detail);
    });
})();
