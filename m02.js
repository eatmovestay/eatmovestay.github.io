// =========================================================================
// MODULE 02: XỬ LÝ LỤC THẦN (THÚ) & TUẦN KHÔNG PHỤC TÀNG (m02.js)
// Tương thích 100% với Code Nền total.html & Quy ước Lục Hào Cổ Pháp
// =========================================================================

(function () {
    // 1. Dữ liệu Can Chi & Lục Thần Cổ Pháp
    const CAN_DUONG = ["Giáp", "Bính", "Mậu", "Canh", "Nhâm"];
    const CAN_AM    = ["Ất", "Đinh", "Kỷ", "Tân", "Quý"];
    const CHI_DUONG = ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"];
    const CHI_AM    = ["Sửu", "Mão", "Tỵ", "Mùi", "Dậu", "Hợi"];

    const CAN_ALL = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
    const CHI_ALL = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

    const CYCLE_LUC_THAN = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"];

    // Bảng 6 Tuần Tuần Không (Không Vong)
    const KV_PAIRS = [
        ["Tuất", "Hợi"], // Group 0: Tuần Giáp Tý
        ["Thân", "Dậu"], // Group 1: Tuần Giáp Tuất
        ["Ngọ", "Mùi"],  // Group 2: Tuần Giáp Thân
        ["Thìn", "Tỵ"],  // Group 3: Tuần Giáp Ngọ
        ["Dần", "Mão"],  // Group 4: Tuần Giáp Thìn
        ["Tý", "Sửu"]    // Group 5: Tuần Giáp Dần
    ];
    const TUAN_NAME = ["Giáp Tý", "Giáp Tuất", "Giáp Thân", "Giáp Ngọ", "Giáp Thìn", "Giáp Dần"];

    // 2. Tạo giao diện UI và chèn vào khung #module-slots của total.html
    const myModuleBox = moduleSlot(`
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem; color: var(--gold); margin: 0; text-transform: uppercase; text-align: center;">Mô-đun 02: Lục Thần &amp; Tuần Không Phục Tàng</h1>
        </div>

        <!-- Khai báo Tứ Trị với Bộ Đoán Từ Gợi Ý -->
        <div style="font-size: 0.8rem; color: var(--gold); font-weight: bold; margin-bottom: 8px;">1. KHAI BÁO TỨ TRỊ (THỜI - NHẬT - NGUYỆT - TUẾ)</div>
        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Thời (Giờ)</label>
                <input type="text" id="m02_Thoi" placeholder="Gõ Can (vd: Gi, Ky...)" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugThoi')">
                <div id="m02_sugThoi" class="suggestions-list"></div>
            </div>
            <div class="input-suggest-box">
                <label>Nhật Thần (Ngày - Khởi Lục Thần &amp; TK)</label>
                <input type="text" id="m02_Nhat" placeholder="Gõ Can (vd: Gia, At...)" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugNhat')">
                <div id="m02_sugNhat" class="suggestions-list"></div>
            </div>
        </div>
        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Nguyệt Lệnh (Tháng)</label>
                <input type="text" id="m02_Nguyet" placeholder="Gõ Can..." autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugNguyet')">
                <div id="m02_sugNguyet" class="suggestions-list"></div>
            </div>
            <div class="input-suggest-box">
                <label>Thái Tuế (Năm)</label>
                <input type="text" id="m02_ThaiTue" placeholder="Gõ Can..." autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugThaiTue')">
                <div id="m02_sugThaiTue" class="suggestions-list"></div>
            </div>
        </div>

        <button class="btn-secondary" style="margin-bottom: 12px;" onclick="m02_DongBoTuNen()">↺ Lấy Tứ Trị Đã Nhập Từ Form Nền Ở Trên</button>

        <!-- Khai báo Phục Thần Phục Tàng -->
        <div style="font-size: 0.8rem; color: var(--gold); font-weight: bold; margin-top: 10px; margin-bottom: 8px;">2. KHAI BÁO PHỤC THẦN PHỤC TÀNG (TỐI ĐA 2 PHỤC THẦN)</div>
        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Phục Thần 1 (Tùy chọn)</label>
                <select id="m02_Phuc1_Hao">
                    <option value="0">-- Chọn Hào Ẩn (PT 1) --</option>
                    <option value="1">Ẩn dưới Hào 1</option>
                    <option value="2">Ẩn dưới Hào 2</option>
                    <option value="3">Ẩn dưới Hào 3</option>
                    <option value="4">Ẩn dưới Hào 4</option>
                    <option value="5">Ẩn dưới Hào 5</option>
                    <option value="6">Ẩn dưới Hào 6</option>
                </select>
            </div>
            <div class="input-suggest-box">
                <label>Chi &amp; Lục Thân PT 1</label>
                <input type="text" id="m02_Phuc1_Info" placeholder="Vd: Quan Quỷ Dậu" autocomplete="off">
            </div>
        </div>

        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Phục Thần 2 (Tùy chọn)</label>
                <select id="m02_Phuc2_Hao">
                    <option value="0">-- Chọn Hào Ẩn (PT 2) --</option>
                    <option value="1">Ẩn dưới Hào 1</option>
                    <option value="2">Ẩn dưới Hào 2</option>
                    <option value="3">Ẩn dưới Hào 3</option>
                    <option value="4">Ẩn dưới Hào 4</option>
                    <option value="5">Ẩn dưới Hào 5</option>
                    <option value="6">Ẩn dưới Hào 6</option>
                </select>
            </div>
            <div class="input-suggest-box">
                <label>Chi &amp; Lục Thân PT 2</label>
                <input type="text" id="m02_Phuc2_Info" placeholder="Vd: Thê Tài Mão" autocomplete="off">
            </div>
        </div>

        <button class="m-btn-process" onclick="processModule02()">⚡ AN LỤC THẦN &amp; QUÉT TUẦN KHÔNG (M02)</button>

        <textarea id="m02_Output" class="m-output-box" readonly onclick="this.select()"></textarea>
        <button id="m02_BtnCopy" class="btn-copy" style="display:none; margin-top:10px;" onclick="copyModule02Text()">📋 SAO CHÉP KẾT QUẢ MÔ-ĐUN 02 (TEXT THUẦN)</button>
    `);

    // 3. Logic Đoán Từ Gợi Ý Can Chi Chuẩn Dương+Dương / Âm+Âm
    window.m02_SuggestGanChi = function(inputEl, sugId) {
        const rawVal = inputEl.value.trim().toLowerCase();
        const sugBox = document.getElementById(sugId);
        sugBox.innerHTML = '';

        if (!rawVal) {
            sugBox.style.display = 'none';
            return;
        }

        // Loại bỏ dấu tiếng Việt cơ bản để tra gõ tắt (vd: Gia/Gi -> Giáp)
        const normalizeStr = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const val = normalizeStr(rawVal);

        let results = [];

        // Kiểm tra Thiên Can Dương -> Ghép Địa Chi Dương
        CAN_DUONG.forEach(can => {
            if (normalizeStr(can).startsWith(val)) {
                CHI_DUONG.forEach(chi => results.push(`${can} ${chi}`));
            }
        });

        // Kiểm tra Thiên Can Âm -> Ghép Địa Chi Âm
        CAN_AM.forEach(can => {
            if (normalizeStr(can).startsWith(val)) {
                CHI_AM.forEach(chi => results.push(`${can} ${chi}`));
            }
        });

        if (results.length > 0) {
            results.slice(0, 12).forEach(item => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerText = item;
                div.onclick = function() {
                    inputEl.value = item;
                    sugBox.style.display = 'none';
                };
                sugBox.appendChild(div);
            });
            sugBox.style.display = 'block';
        } else {
            sugBox.style.display = 'none';
        }
    };

    // Tự động lấy Tứ Trị từ Form Tứ Trị nền ở trên nếu user bấm nút
    window.m02_DongBoTuNen = function() {
        const thoi = document.getElementById("mThoi") ? document.getElementById("mThoi").value : "";
        const nhat = document.getElementById("mNhat") ? document.getElementById("mNhat").value : "";
        const nguyet = document.getElementById("mNguyet") ? document.getElementById("mNguyet").value : "";
        const thaiTue = document.getElementById("mThaiTue") ? document.getElementById("mThaiTue").value : "";

        if (thoi) document.getElementById("m02_Thoi").value = thoi;
        if (nhat) document.getElementById("m02_Nhat").value = nhat;
        if (nguyet) document.getElementById("m02_Nguyet").value = nguyet;
        if (thaiTue) document.getElementById("m02_ThaiTue").value = thaiTue;
    };

    // Helper tính vị trí Can Chi trong 60 Hoa Giáp
    function getGanChiIndex(canStr, chiStr) {
        const canIdx = CAN_ALL.indexOf(canStr);
        const chiIdx = CHI_ALL.indexOf(chiStr);
        if (canIdx === -1 || chiIdx === -1) return -1;

        for (let n = 0; n < 60; n++) {
            if (n % 10 === canIdx && n % 12 === chiIdx) return n;
        }
        return -1;
    }

    // Helper xác định Lục Thần bắt đầu ở Hào 1 dựa vào Can Ngày
    function getStartDeityIndex(canStr) {
        const canIdx = CAN_ALL.indexOf(canStr);
        if (canIdx === 0 || canIdx === 1) return 0; // Giáp / Ất -> Thanh Long
        if (canIdx === 2 || canIdx === 3) return 1; // Bính / Đinh -> Chu Tước
        if (canIdx === 4) return 2;                // Mậu -> Câu Trần
        if (canIdx === 5) return 3;                // Kỷ -> Đằng Xà
        if (canIdx === 6 || canIdx === 7) return 4; // Canh / Tân -> Bạch Hổ
        return 5;                                  // Nhâm / Quý -> Huyền Vũ
    }

    // 4. Hàm Thực Thi Logic Chính Của Mô-đun 02
    window.processModule02 = function () {
        const thoi = document.getElementById("m02_Thoi").value.trim();
        const nhat = document.getElementById("m02_Nhat").value.trim();
        const nguyet = document.getElementById("m02_Nguyet").value.trim();
        const thaiTue = document.getElementById("m02_ThaiTue").value.trim();

        const pt1Hao = parseInt(document.getElementById("m02_Phuc1_Hao").value);
        const pt1Info = document.getElementById("m02_Phuc1_Info").value.trim();
        const pt2Hao = parseInt(document.getElementById("m02_Phuc2_Hao").value);
        const pt2Info = document.getElementById("m02_Phuc2_Info").value.trim();

        if (!nhat) {
            alert("Vui lòng nhập Nhật Thần (Ngày) để làm căn cứ khởi Lục Thần & Tuần Không!");
            return;
        }

        const nhatParts = nhat.split(/\s+/);
        if (nhatParts.length < 2) {
            alert("Nhật Thần phải có đủ Thiên Can và Địa Chi (Ví dụ: Giáp Tý, Kỷ Dậu...)!");
            return;
        }

        const nhatCan = nhatParts[0];
        const nhatChi = nhatParts[1];

        // 1. Xác định Tuần Không theo Nhật Thần
        const gcIndex = getGanChiIndex(nhatCan, nhatChi);
        if (gcIndex === -1) {
            alert("Tên Can Chi Ngày nhập vào không hợp lệ (Can Chi phải đúng quy tắc Âm-Âm, Dương-Dương)!");
            return;
        }

        const groupTuan = Math.floor(gcIndex / 10);
        const kvChi = KV_PAIRS[groupTuan]; // Mảng 2 Chi Tuần Không [Chi1, Chi2]
        const tuanName = TUAN_NAME[groupTuan];

        // 2. An Lục Thần cho 6 Hào
        const startDeityIdx = getStartDeityIndex(nhatCan);
        const haoLucThan = {};
        for (let h = 1; h <= 6; h++) {
            haoLucThan[h] = CYCLE_LUC_THAN[(startDeityIdx + (h - 1)) % 6];
        }

        // 3. Trích xuất thông tin Quẻ từ Code Nền total.html
        const cungKeyChu = document.getElementById("selectCung") ? document.getElementById("selectCung").value : "";
        const qNameChu = document.getElementById("selectQue") ? document.getElementById("selectQue").value : "";

        let res = `=== MÔ-ĐUN 02: KẾT QUẢ AN LỤC THẦN & QUÉT TUẦN KHÔNG (DATA CẤP 2) ===\n`;
        res += `• Tứ Trị Lập Quẻ      : Thời: ${thoi || "---"} | Nhật: ${nhat} | Nguyệt: ${nguyet || "---"} | Tuế: ${thaiTue || "---"}\n`;
        res += `• Vòng Tuần Không     : Tuần ${tuanName}  => TUẦN KHÔNG TẠI ĐỊA CHI: [ ${kvChi[0]} ] và [ ${kvChi[1]} ]\n`;
        res += `• Khởi Lục Thần Ngày  : Can ${nhatCan} khởi ${CYCLE_LUC_THAN[startDeityIdx]} tại Hào 1\n\n`;

        res += `--- BẢNG CHI TIẾT LỤC THẦN & TRẠNG THÁI TUẦN KHÔNG CHO 6 HÀO ---\n`;
        res += `Hào   | Lục Thần      | Nạp Giáp (Quẻ Chính)        | Trạng Thái Tuần Không\n`;
        res += `-------------------------------------------------------------------------\n`;

        let datasetShared = []; // Lưu trữ Data cấu trúc để chia sẻ cho các module khác

        if (cungKeyChu && qNameChu && typeof dataDich !== 'undefined') {
            const chuData = dataDich[cungKeyChu].quẻ[qNameChu];

            for (let i = 5; i >= 0; i--) {
                const haoThu = i + 1;
                const napStr = chuData.n[i];
                const chiHanh = getChiHanh(napStr);
                const chi = chiHanh.split(" ")[0];
                const ltName = haoLucThan[haoThu];

                const isDong = typeof selectedDong !== 'undefined' && selectedDong.includes(haoThu);
                const isTK = kvChi.includes(chi);

                let tkStatus = "---";
                if (isTK) {
                    tkStatus = isDong ? "TUẦN KHÔNG (HÀO ĐỘNG)" : "TUẦN KHÔNG (HÀO TĨNH)";
                }

                // Kiểm tra xem Hào này có Phục Thần phục tàng bên dưới không
                let ptNote = "";
                let ptIsTK = false;
                if (pt1Hao === haoThu && pt1Info) {
                    const ptChi = pt1Info.split(/\s+/).pop();
                    if (kvChi.includes(ptChi)) {
                        ptNote += `\n       └─ [ Phục Thần 1: ${pt1Info} ] -> BỊ TUẦN KHÔNG!`;
                        ptIsTK = true;
                    } else {
                        ptNote += `\n       └─ [ Phục Thần 1: ${pt1Info} ]`;
                    }
                }
                if (pt2Hao === haoThu && pt2Info) {
                    const ptChi = pt2Info.split(/\s+/).pop();
                    if (kvChi.includes(ptChi)) {
                        ptNote += `\n       └─ [ Phục Thần 2: ${pt2Info} ] -> BỊ TUẦN KHÔNG!`;
                        ptIsTK = true;
                    } else {
                        ptNote += `\n       └─ [ Phục Thần 2: ${pt2Info} ]`;
                    }
                }

                res += `Hào ${haoThu} | ${ltName.padEnd(13, ' ')} | ${napStr.padEnd(27, ' ')} | ${tkStatus}${ptNote}\n`;

                datasetShared.push({
                    hao: haoThu,
                    lucThan: ltName,
                    napGiap: napStr,
                    chi: chi,
                    isDong: isDong,
                    isTuanKhong: isTK,
                    phucThanNote: ptNote
                });
            }
        } else {
            res += `(Chưa chọn Họ Quẻ & Quẻ Chủ ở phần trên. Vui lòng chọn Quẻ để hiển thị chi tiết nạp giáp!)\n`;
            for (let h = 6; h >= 1; h--) {
                res += `Hào ${h} | ${haoLucThan[h]}\n`;
            }
        }

        // 4. Kiểm tra Hào Biến Lâm Tuần Không (Nếu có Quẻ Biến)
        if (typeof bienQueGiam !== 'undefined' && bienQueGiam && bienQueGiam.data) {
            res += `\n--- QUÉT TUẦN KHÔNG TẠI QUẺ BIẾN (HÀO BIẾN) ---\n`;
            let coBienTK = false;
            for (let i = 5; i >= 0; i--) {
                const haoThu = i + 1;
                const napGocBien = bienQueGiam.data.n[i];
                const chiHanh = getChiHanh(napGocBien);
                const chi = chiHanh.split(" ")[0];

                if (kvChi.includes(chi)) {
                    coBienTK = true;
                    const isDongChinh = typeof selectedDong !== 'undefined' && selectedDong.includes(haoThu);
                    res += `• Quẻ Biến - Hào ${haoThu}: ${chiHanh} [Địa Chi: ${chi}] -> HÀO BIẾN LÂM TUẦN KHÔNG ${isDongChinh ? "(Phát sinh từ Hào Động)" : "(Hào Biến Tĩnh)"}\n`;
                }
            }
            if (!coBienTK) {
                res += `• Không có Hào Biến nào rơi vào Tuần Không.\n`;
            }
        }

        res += `\n--- GHI CHÚ BẢO TỒN DATA CHO CÁC MODULE TIẾP THEO ---
• Toàn bộ thông tin Lục Thần và vị trí Tuần Không (kể cả Phục Thần) đã được lưu vào bộ nhớ dùng chung window.M02_DATA.
• Các module tiếp theo (m03 - m60) có thể truy xuất trực tiếp để thực hiện tính toán chuyên sâu.`;

        // Lưu Data vào biến toàn cục window để các module sau dễ dàng truy cập
        window.M02_DATA = {
            nhatCan: nhatCan,
            nhatChi: nhatChi,
            tuanKhongChi: kvChi,
            tuanName: tuanName,
            haoLucThan: haoLucThan,
            dataset: datasetShared
        };

        const outputEl = document.getElementById("m02_Output");
        const copyBtn = document.getElementById("m02_BtnCopy");
        outputEl.value = res;
        outputEl.style.display = "block";
        copyBtn.style.display = "block";
    };

    // 5. Hàm Sao Chép Kết Quả Text Thuần
    window.copyModule02Text = function () {
        const outputEl = document.getElementById("m02_Output");
        if (!outputEl || !outputEl.value) return;

        function showSuccess() {
            const btn = document.getElementById("m02_BtnCopy");
            btn.innerText = "✅ ĐÃ SAO CHÉP DATA MÔ-ĐUN 02!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ MÔ-ĐUN 02 (TEXT THUẦN)"; }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(outputEl.value).then(showSuccess).catch(() => {
                outputEl.focus(); outputEl.select();
                document.execCommand("copy");
                showSuccess();
            });
        } else {
            outputEl.focus(); outputEl.select();
            document.execCommand("copy");
            showSuccess();
        }
    };
})();

