/* =========================================================================
   MODULE 04: LUẬN GIẢI CẶP LÁ CÙNG NGƯỢC (N) TRONG 3 KHÓM (FILE 04)
   - Tự động lấy bài lật từ ngulinh_bts.html qua sự kiện ngulinh:completed
   - Tự động đọc chuỗi dữ liệu DATA_04 từ file04_bts.html
   - Chỉ xử lý các cặp lá bài CÙNG NGƯỢC (N + N) trong từng Khóm bài
   - Bọc IIFE cô lập hoàn toàn, không gây đứt đoạn hay xung đột module
   ========================================================================= */

(function () {
    const FILE04_URL = 'file04_bts.html';
    let file04DataText = null;
    const RANKING = ["TƯỚNG", "SĨ", "TƯỢNG", "XE", "PHÁO", "NGỰA", "CHỐT"];

    /**
     * Tải file04_bts.html và trích xuất chuỗi DATA_04 bằng Regex
     */
    async function loadFile04Data() {
        if (file04DataText) return file04DataText;
        try {
            const response = await fetch(FILE04_URL);
            if (!response.ok) throw new Error(`Không thể tải File04 (${response.status})`);
            const htmlText = await response.text();

            // Trích xuất chuỗi nằm giữa const DATA_04 = ` ... `;
            const match = htmlText.match(/const\s+DATA_04\s*=\s*`([\s\S]*?)`;/);
            if (match && match[1]) {
                file04DataText = match[1];
                return file04DataText;
            } else {
                throw new Error('Không tìm thấy biến DATA_04 trong file04_bts.html');
            }
        } catch (error) {
            console.error('Module 04 - Lỗi tải dữ liệu:', error);
            return null;
        }
    }

    /**
     * Thuật toán thứ tự thứ hạng quân bài
     */
    function getRankValue(name) {
        let n = name.toUpperCase();
        for (let i = 0; i < RANKING.length; i++) {
            if (n.includes(RANKING[i])) return i;
        }
        return 99;
    }

    /**
     * Thuật toán tra cứu chuẩn gốc của File 04
     */
    function searchLogicFile04(chu, gap, gapIsRight, dataText) {
        if (!dataText) return null;
        const lines = dataText.split('\n');
        let currentChu = "", targetChu = chu.toUpperCase().trim();
        let targetGap = "GẶP " + gap.toUpperCase().trim();

        for (let i = 0; i < lines.length; i++) {
            let rawLine = lines[i].trim();
            if (!rawLine) continue;
            let lineUp = rawLine.toUpperCase();

            if (lineUp.includes(":") && !lineUp.startsWith("GẶP")) {
                if (lineUp.includes(targetChu)) {
                    currentChu = targetChu;
                    continue;
                } else {
                    currentChu = "";
                }
            }

            if (currentChu === targetChu && lineUp.startsWith(targetGap)) {
                let content = rawLine.split(":")[1];
                if (!content) return null;
                let parts = content.split("|");
                return gapIsRight ? (parts[1] ? parts[1].trim() : parts[0].trim()) : parts[0].trim();
            }
        }
        return null;
    }

    /**
     * Chuẩn hóa định dạng lá bài cho đúng chuẩn File 04 (Ví dụ: "TƯỚNG ĐỎ N")
     */
    function formatCardM04(card, globalColor) {
        if (!card) return '';
        const name = card.n ? card.n.toUpperCase().trim() : '';

        let color = globalColor ? globalColor.toUpperCase().trim() : 'XANH';
        if (color.includes('XANH')) color = 'XANH';
        else if (color.includes('VÀNG') || color.includes('VANG') || color.includes('ĐẤT')) color = 'VÀNG';
        else if (color.includes('TRẮNG') || color.includes('TRANG') || color.includes('XÁM')) color = 'TRẮNG';
        else if (color.includes('ĐỎ') || color.includes('DO')) color = 'ĐỎ';

        return `${name} ${color} N`.trim();
    }

    /**
     * Tra cứu luận giải cho cặp lá CÙNG NGƯỢC
     */
    function lookupPairM04(strA, strB, dataText) {
        let val = searchLogicFile04(strA, strB, true, dataText);
        if (!val && getRankValue(strB) <= getRankValue(strA)) {
            val = searchLogicFile04(strB, strA, false, dataText);
        }
        return val;
    }

    /**
     * Xử lý luận giải chính cho Module 04 khi hoàn tất trải bài
     */
    async function processModule04(state) {
        if (!state || !state.khoms || state.khoms.length === 0) return;

        // Khởi tạo hoặc lấy khung chứa kết quả m04
        let container = document.getElementById('module04-results');
        if (!container) {
            container = document.createElement('div');
            container.id = 'module04-results';
            container.className = 'khom-block';
            container.style.marginTop = '20px';
            container.style.border = '1px solid var(--gold)';

            const finalReport = document.getElementById('finalReport');
            if (finalReport) finalReport.appendChild(container);
        }

        const dataText = await loadFile04Data();
        if (!dataText) {
            container.innerHTML = `
                <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center;">✦ LUẬN GIẢI FILE 04 ✦</div>
                <div style="color: #ff9999; font-style: italic; text-align: center; margin-top: 8px;">❌ Không thể tải dữ liệu từ file04_bts.html (Hãy kiểm tra lại vị trí file)</div>
            `;
            return;
        }

        const khomLabels = ['QUÁ KHỨ', 'HIỆN TẠI', 'TƯƠNG LAI'];
        let htmlOutput = `
            <div class="khom-label" style="color: var(--gold-light); font-size: 13px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                ✦ LUẬN GIẢI CẶP LÁ CÙNG NGƯỢC (N) — KHÓM BÀI (FILE 04) ✦
            </div>
            <div style="font-family: 'EB Garamond', serif; color: var(--parchment); font-size: 14px; line-height: 1.6; margin-top: 12px;">
        `;

        let totalPairsFound = 0;

        // Duyệt qua 3 Khóm bài (Mỗi Khóm 4 lá)
        state.khoms.forEach((khomCards, kIdx) => {
            let khomPairHtml = '';

            // Xét 3 cặp bài liên tiếp trong từng Khóm: (Lá 1-2), (Lá 2-3), (Lá 3-4)
            for (let i = 0; i < khomCards.length - 1; i++) {
                const card1 = khomCards[i];
                const card2 = khomCards[i + 1];

                // ĐIỀU KIỆN LỌC CỐT LÕI CỦA FILE 04:
                // Chỉ xét khi CẢ 2 LÁ ĐỀU LÀ NGƯỢC ('N')
                const isCard1Nguoc = (card1.f === 'N');
                const isCard2Nguoc = (card2.f === 'N');

                if (isCard1Nguoc && isCard2Nguoc) {
                    const strA = formatCardM04(card1, state.colorName);
                    const strB = formatCardM04(card2, state.colorName);

                    const meaning = lookupPairM04(strA, strB, dataText);

                    if (meaning) {
                        totalPairsFound++;
                        khomPairHtml += `
                            <div style="background: rgba(30,77,43,0.15); border-left: 3px solid #6aab7e; padding: 8px 12px; margin-bottom: 8px; border-radius: 0 4px 4px 0;">
                                <span style="color: var(--gold-light); font-weight: bold;">
                                    ✦ Cặp Lá ${i + 1} & ${i + 2}: ${strA} — ${strB}
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
                    Không có cặp lá bài nào CÙNG VỊ TRÍ NGƯỢC (N) đi cạnh nhau trong 3 Khóm.
                </div>
            `;
        }

        htmlOutput += `</div>`;
        container.innerHTML = htmlOutput;
    }

    // Lắng nghe sự kiện hoàn tất bài lật từ ngulinh_bts.html
    window.addEventListener('ngulinh:completed', (event) => {
        processModule04(event.detail);
    });
})();
