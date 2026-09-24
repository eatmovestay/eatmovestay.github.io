// =========================================================================
// MODULE 01: XỬ LÝ LOGIC TUẦN KHÔNG (m01.js) - BẢN CHUẨN LÝ KHÍ CỔ PHÁP
// =========================================================================

(function () {
    // 1. Tạo giao diện UI và chèn vào khung #module-slots
    const myModuleBox = moduleSlot(`
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem; color: var(--gold); margin: 0; text-transform: uppercase; text-align: center;">Mô-đun 01: Khai Báo &amp; Phân Tích Tuần Không (TK)</h1>
        </div>

        <!-- Khai báo Địa Chi Tuần Không -->
        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Địa Chi Tuần Không thứ nhất</label>
                <select id="m01_ChiTK1">
                    <option value="">-- Chọn Chi TK 1 --</option>
                </select>
            </div>
            <div class="input-suggest-box">
                <label>Địa Chi Tuần Không thứ hai</label>
                <select id="m01_ChiTK2">
                    <option value="">-- Chọn Chi TK 2 --</option>
                </select>
            </div>
        </div>

        <!-- Khai báo Hào bị Tuần Không & Phục Thần -->
        <div class="input-suggest-box">
            <label>Các Hào bị Tuần Không ở Quẻ Chính (Để trống nếu muốn hệ thống tự quét)</label>
            <input type="text" id="m01_HaoBiTK" placeholder="Ví dụ: 1, 6..." autocomplete="off">
        </div>

        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Có Phục Thần bị Tuần Không không?</label>
                <select id="m01_CoPhucTK" onchange="document.getElementById('m01_BoxPhuc').style.display = this.value === 'có' ? 'block' : 'none'">
                    <option value="không">Không có Phục Thần TK</option>
                    <option value="có">Có Phục Thần bị TK</option>
                </select>
            </div>
            <div class="input-suggest-box" id="m01_BoxPhuc" style="display:none;">
                <label>Phục Thần ẩn dưới Hào mấy &amp; Tên/Chi PT</label>
                <input type="text" id="m01_InfoPhucTK" placeholder="Ví dụ: Hào 3 - Quan Quỷ Dậu" autocomplete="off">
            </div>
        </div>

        <!-- Chọn Phạm vi Dụng sự -->
        <div class="input-suggest-box">
            <label>Phạm vi Dụng sự (Lục Thân Dụng Thần)</label>
            <select id="m01_DungThan">
                <option value="">-- Chọn Phạm Vi Dụng Sự --</option>
                <option value="Thê Tài">Thê Tài: Tài chính, tiền bạc, lợi ích vật chất, Vợ/Bạn gái (Nam hỏi)</option>
                <option value="Tử Tôn">Tử Tôn: Nguồn phước, may mắn, cát thần, công lý, thuốc tốt, con cái/hậu bối</option>
                <option value="Phụ Mẫu">Phụ Mẫu: Giấy tờ, văn thư, tin tức, công ty, đất đai, nhà cửa, xe cộ, cha mẹ/thầy/trưởng bối</option>
                <option value="Quan Quỷ">Quan Quỷ: Bệnh, họa nạn, pháp luật, rủi ro, âm mưu, chức vụ (binh nghiệp), Chồng (Nữ hỏi)</option>
                <option value="Huynh Đệ">Huynh Đệ: Anh chị em, bạn học, đồng nghiệp, bạn bè, đối thủ tranh giành/chia phần</option>
            </select>
        </div>

        <button class="m-btn-process" onclick="processModule01()">⚡ XỬ LÝ LOGIC TUẦN KHÔNG</button>

        <textarea id="m01_Output" class="m-output-box" readonly onclick="this.select()"></textarea>
        <button id="m01_BtnCopy" class="btn-copy" style="display:none; margin-top:10px;" onclick="copyModule01Text()">📋 SAO CHÉP KẾT QUẢ TUẦN KHÔNG (DATA CẤP 1)</button>
    `);

    // 2. Nạp danh sách Địa Chi vào ô Select
    const chiSelects = ["m01_ChiTK1", "m01_ChiTK2"];
    chiSelects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel && typeof CHI_LIST !== 'undefined') {
            CHI_LIST.forEach(chi => {
                const opt = document.createElement("option");
                opt.value = chi; opt.text = chi;
                sel.appendChild(opt);
            });
        }
    });

    // 3. Hàm xử lý logic chính
    window.processModule01 = function () {
        const chiTK1 = document.getElementById("m01_ChiTK1").value;
        const chiTK2 = document.getElementById("m01_ChiTK2").value;
        const dungThan = document.getElementById("m01_DungThan").value;
        const coPhucTK = document.getElementById("m01_CoPhucTK").value;
        const infoPhucTK = document.getElementById("m01_InfoPhucTK").value.trim();

        const nhat = document.getElementById("tsNhat") ? document.getElementById("tsNhat").value : "";
        const nguyet = document.getElementById("tsNguyet") ? document.getElementById("tsNguyet").value : "";

        if (!chiTK1 && !chiTK2) {
            alert("Vui lòng chọn ít nhất 1 Địa Chi Tuần Không!");
            return;
        }

        const listChiTK = [chiTK1, chiTK2].filter(Boolean);
        let res = `=== MÔ-ĐUN 01: KẾT QUẢ XỬ LÝ LOGIC TUẦN KHÔNG (DATA CẤP 1) ===\n`;
        res += `• Địa Chi Tuần Không : ${listChiTK.join(" và ")}\n`;
        res += `• Nhật Thần            : ${nhat || "Chưa chọn ở phần trên"}\n`;
        res += `• Nguyệt Lệnh          : ${nguyet || "Chưa chọn ở phần trên"}\n`;
        res += `• Phạm vi Dụng sự      : ${dungThan || "Chưa chọn"}\n\n`;

        // A. Tính Vượng / Suy & Trường Sinh của Địa Chi Tuần Không theo Tứ Trị
        res += `--- 1. TRẠNG THÁI VƯỢNG SUY & TRƯỜNG SINH CỦA ĐỊA CHI TUẦN KHÔNG ---\n`;
        listChiTK.forEach(chi => {
            res += `[ Địa Chi Tuần Không: ${chi} ]\n`;
            if (nhat && typeof VUONG_SUY_TABLE !== 'undefined' && typeof getTruongSinh !== 'undefined') {
                let stNhat = resolveVuongSuy(VUONG_SUY_TABLE[chi][nhat], "Nhật");
                
                // Chuẩn hóa Lý Khí cho Thìn Thổ gặp Nhật Tý (Thổ vượng tại Tý & Thìn chứa Tý thủy hòa hợp)
                if (chi === "Thìn" && nhat === "Tý") {
                    stNhat = "Vượng (Thổ tùng Thủy, Thìn Thổ vượng tại Nhật Tý & hòa hợp Thủy khí)";
                }
                
                const tsNhat = getTruongSinh(chi, nhat);
                res += `  + So với Nhật (${nhat}): Trạng thái = ${stNhat} | Trường Sinh = ${tsNhat}\n`;
            }
            if (nguyet && typeof VUONG_SUY_TABLE !== 'undefined' && typeof getTruongSinh !== 'undefined') {
                let stNguyet = resolveVuongSuy(VUONG_SUY_TABLE[chi][nguyet], "Nguyệt");
                
                // Chuẩn hóa Lý Khí cho Thìn Thổ gặp Nguyệt Dậu (Thìn Dậu Lục Hợp, tuy Hưu nhưng được Hợp sinh củng cố lực)
                if (chi === "Thìn" && nguyet === "Dậu") {
                    stNguyet = "Hưu nhưng Nhị Hợp (Thìn Dậu Lục Hợp củng cố lực, trên mức Hưu Tù thông thường)";
                }

                const tsNguyet = getTruongSinh(chi, nguyet);
                res += `  + So với Nguyệt (${nguyet}): Trạng thái = ${stNguyet} | Trường Sinh = ${tsNguyet}\n`;
            }

            // Đánh giá Giả Không vs Thật Không
            if (chi === "Thìn" && nhat === "Tý") {
                res += `  => ĐÁNH GIÁ: GIẢ KHÔNG (Hào có năng lượng Vượng khí, chỉ tạm thời nằm im. Khi xuất không / xung không sẽ phát huy lực lượng mạnh mẽ).\n`;
            } else if (nhat && nguyet) {
                const isVuongNhat = VUONG_SUY_TABLE[chi][nhat].includes("Vượng") || VUONG_SUY_TABLE[chi][nhat].includes("Tướng") || VUONG_SUY_TABLE[chi][nhat].includes("Trực");
                const isVuongNguyet = VUONG_SUY_TABLE[chi][nguyet].includes("Vượng") || VUONG_SUY_TABLE[chi][nguyet].includes("Tướng") || VUONG_SUY_TABLE[chi][nguyet].includes("Trực");

                if (isVuongNhat || isVuongNguyet) {
                    res += `  => ĐÁNH GIÁ: GIẢ KHÔNG (Được Nhật/Nguyệt Vượng Tướng/Sinh Phù. Chờ ngày/tháng Điền Thực hoặc Xung Không sẽ phát huy tác dụng).\n`;
                } else {
                    res += `  => ĐÁNH GIÁ: THẬT KHÔNG / CHÂN KHÔNG (Hưu Tù Tử Suy, không có lực trợ giúp).\n`;
                }
            }
            res += `\n`;
        });

        // B. Quét Hào bị Tuần Không (Cả Quẻ Chủ & Quẻ Biến)
        res += `--- 2. DANH SÁCH HÀO BỊ TUẦN KHÔNG TRONG QUẺ ---\n`;
        const cungKeyChu = document.getElementById("selectCung") ? document.getElementById("selectCung").value : "";
        const qNameChu = document.getElementById("selectQue") ? document.getElementById("selectQue").value : "";

        let haoBiTKList = [];

        // Quét Quẻ Chủ
        if (cungKeyChu && qNameChu && typeof dataDich !== 'undefined') {
            const chuData = dataDich[cungKeyChu].quẻ[qNameChu];
            for (let i = 5; i >= 0; i--) {
                const haoThu = i + 1;
                const napStr = chuData.n[i];
                const chiHanh = getChiHanh(napStr);
                const chi = chiHanh.split(" ")[0];

                if (listChiTK.includes(chi)) {
                    const isDong = typeof selectedDong !== 'undefined' && selectedDong.includes(haoThu);
                    haoBiTKList.push({ hao: haoThu, nap: napStr, chi: chi, viTri: "Quẻ Chủ", isDong: isDong });
                    res += `• Quẻ Chủ - Hào ${haoThu}: ${napStr} [Địa chi: ${chi}] -> BỊ TUẦN KHÔNG (${isDong ? "HÀO ĐỘNG KHÔNG" : "HÀO TĨNH KHÔNG"})\n`;
                }
            }
        }

        // Quét Quẻ Biến
        if (typeof bienQueGiam !== 'undefined' && bienQueGiam && bienQueGiam.data) {
            for (let i = 5; i >= 0; i--) {
                const haoThu = i + 1;
                const napGocBien = bienQueGiam.data.n[i];
                const chiHanh = getChiHanh(napGocBien);
                const chi = chiHanh.split(" ")[0];

                if (listChiTK.includes(chi)) {
                    const isDongChinh = typeof selectedDong !== 'undefined' && selectedDong.includes(haoThu);
                    res += `• Quẻ Biến - Hào ${haoThu}: ${chiHanh} [Địa chi: ${chi}] -> HÀO BIẾN LÂM TUẦN KHÔNG ${isDongChinh ? "(Phát sinh từ Hào Động)" : "(Hào Biến Tĩnh)"}\n`;
                }
            }
        }

        if (coPhucTK === "có" && infoPhucTK) {
            res += `• Phục Thần Tuần Không: ${infoPhucTK} (Ẩn tàng bị Tuần Không)\n`;
        }

        // C. Phân Tích Phạm Vi Dụng Sự & Cảnh Báo
        res += `\n--- 3. PHÂN TÍCH PHẠM VI DỤNG SỰ & CẢNH BÁO NGUY CƠ ---\n`;
        if (dungThan) {
            const isDungThanTK = haoBiTKList.some(item => item.nap.includes(dungThan));
            if (isDungThanTK) {
                res += `⚠️ CẢNH BÁO NGUY CƠ CAO: DỤNG THẦN (${dungThan.toUpperCase()}) BỊ TUẦN KHÔNG!\n`;
                switch (dungThan) {
                    case "Thê Tài":
                        res += `  + Ý nghĩa: Lòng người không thật về tiền bạc/vợ/bạn gái; nguy cơ tài chính hỏng hóc, bị trộm thất thoát tiền, kinh doanh không thu hồi được vốn.\n`;
                        break;
                    case "Tử Tôn":
                        res += `  + Ý nghĩa: Nguồn phước bị che lấp, may mắn gián đoạn, thuốc uống không hiệu quả, con cái/hậu bối gây lo âu.\n`;
                        break;
                    case "Phụ Mẫu":
                        res += `  + Ý nghĩa: Giấy tờ, hợp đồng, nhà cửa, xe cộ, công ty có trục trặc/hồ sơ ảo; thông tin sai lệch; xin việc chỉ được thử việc không được chính thức.\n`;
                        break;
                    case "Quan Quỷ":
                        res += `  + Ý nghĩa: Rủi ro ẩn tàng, công danh chức vụ bị treo, lo lắng vô hình; Nữ hỏi về Chồng thì tâm tư người chồng không thật/đang lưỡng lự.\n`;
                        break;
                    case "Huynh Đệ":
                        res += `  + Ý nghĩa: Bạn bè, đồng nghiệp không chân thành; việc cạnh tranh tranh giành tạm thời lắng xuống nhưng có sự ngầm tính toán.\n`;
                        break;
                }
            } else {
                res += `• Dụng Thần (${dungThan}) không bị trực tiếp lâm Tuần Không.\n`;
            }
        }

        res += `\n--- 4. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM & QUY TẮC CỔ PHÁP ---
• Tứ Trị bất khả xâm phạm: Mọi Hào bị Tuần Không KHÔNG ĐƯỢC PHÉP Sinh/Khắc/Hình/Xung/Phá/Hại lên Tứ Trị.
• Hào Tĩnh Không mà Hưu Suy = Chân Không (Hỏng hẳn bất cứu).
• Hào Động Không có ứng kỳ riêng biệt tại thời điểm Xung Không hoặc Thực Không.`;

        const outputEl = document.getElementById("m01_Output");
        const copyBtn = document.getElementById("m01_BtnCopy");
        outputEl.value = res;
        outputEl.style.display = "block";
        copyBtn.style.display = "block";
    };

    // 4. Hàm Sao Chép Kết Quả
    window.copyModule01Text = function () {
        const outputEl = document.getElementById("m01_Output");
        if (!outputEl || !outputEl.value) return;

        function showSuccess() {
            const btn = document.getElementById("m01_BtnCopy");
            btn.innerText = "✅ ĐÃ SAO CHÉP DATA CẤP 1!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ TUẦN KHÔNG (DATA CẤP 1)"; }, 2000);
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