// =========================================================================
// MODULE 03: XỬ LÝ TOÀN DIỆN LOGIC MỘ KHỐ CỔ PHÁP (m03.js)
// Dựa trên lý thuyết & quẻ thực chiến của Tác giả Khúc Vĩ
// Kết nối dữ liệu từ total-1.html và m02.js (window.M02_DATA)
// =========================================================================

(function () {
    // 1. Bản đồ Mộ Khố chuẩn Ngũ Hành
    // Mộc (Dần, Mão) -> Mộ tại Mùi | Hỏa (Tỵ, Ngọ) -> Mộ tại Tuất
    // Thủy (Tý, Hợi) -> Mộ tại Thìn | Kim (Thân, Dậu) -> Mộ tại Sửu
    const MO_MAP = {
        "Dần": "Mùi", "Mão": "Mùi",
        "Tỵ": "Tuất", "Ngọ": "Tuất",
        "Tý": "Thìn", "Hợi": "Thìn",
        "Thân": "Sửu", "Dậu": "Sửu"
    };

    // Chi Xung Mộ (Phá Mộ Khóa)
    const XUNG_MO_MAP = {
        "Thìn": "Tuất", "Tuất": "Thìn",
        "Sửu": "Mùi", "Mùi": "Sửu"
    };

    // Chi Hợp Mộ (Kéo Mộ / Nhả Hào)
    const HOP_MO_MAP = {
        "Thìn": "Dậu", "Tuất": "Mão",
        "Sửu": "Tý", "Mùi": "Ngọ"
    };

    // Chi Xung Hào (Bật Hào ra khỏi Mộ)
    const XUNG_HAO_MAP = {
        "Tý": "Ngọ", "Ngọ": "Tý", "Sửu": "Mùi", "Mùi": "Sửu",
        "Dần": "Thân", "Thân": "Dần", "Mão": "Dậu", "Dậu": "Mão",
        "Thìn": "Tuất", "Tuất": "Thìn", "Tỵ": "Hợi", "Hợi": "Tỵ"
    };

    // 2. Tạo giao diện UI và chèn vào khung #module-slots của total-1.html
    const myModuleBox = moduleSlot(`
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem; color: var(--gold); margin: 0; text-transform: uppercase; text-align: center;">Mô-đun 03: Xử Lý Logic Mộ Khố Cổ Pháp (Khúc Vĩ)</h1>
        </div>

        <div style="font-size: 0.8rem; color: #ccc; margin-bottom: 12px; line-height: 1.4;">
            Mô-đun tự động quét <b>3 Hình Thức Nhập Mộ</b> (Nhật/Nguyệt Mộ, Hào Tĩnh Mộ Hào Động, Động Hóa Mộ Cùng Tuyến) và <b>3 Phương Thức Xuất Mộ</b> (Xung Mộ, Xung Hào, Hợp Mộ) dựa trên dữ liệu Tứ Trị &amp; Quẻ.
        </div>

        <div class="m-grid">
            <div class="input-suggest-box">
                <label>Chọn Hào Cần Soi Mộ Trọng Điểm (Dụng Thần / Thế)</label>
                <select id="m03_HaoSoi">
                    <option value="0">-- Quét Toàn Bộ 6 Hào --</option>
                    <option value="1">Soi Trọng Điểm Hào 1</option>
                    <option value="2">Soi Trọng Điểm Hào 2</option>
                    <option value="3">Soi Trọng Điểm Hào 3</option>
                    <option value="4">Soi Trọng Điểm Hào 4</option>
                    <option value="5">Soi Trọng Điểm Hào 5</option>
                    <option value="6">Soi Trọng Điểm Hào 6</option>
                </select>
            </div>
            <div class="input-suggest-box">
                <label>Phân Loại Ngữ Cảnh Chiêm Đoán</label>
                <select id="m03_NguCanh">
                    <option value="tong_quat">Chiêm Tổng Quát / Cầu Sự</option>
                    <option value="benh_tat">Chiêm Bệnh Tật / An Nguy (Ngắn hạn / Lâu dài)</option>
                    <option value="nguoi_xa">Chiêm Người Đi Xa Khi Nào Về / Định Cư</option>
                    <option value="phap_ly">Chiêm Pháp Lý / Rủi Ro / Chức Vụ Cơ Quan</option>
                </select>
            </div>
        </div>

        <button class="m-btn-process" onclick="processModule03()">🔮 TÍNH TOÁN LOGIC MỘ KHỐ (M03)</button>

        <textarea id="m03_Output" class="m-output-box" readonly onclick="this.select()"></textarea>
        <button id="m03_BtnCopy" class="btn-copy" style="display:none; margin-top:10px;" onclick="copyModule03Text()">📋 SAO CHÉP KẾT QUẢ MÔ-ĐUN 03 (DATA MỘ CẤP TRỌNG YẾU)</button>
    `);

    // Helper lấy Chi từ chuỗi Nạp Giáp
    function extractChi(napStr) {
        if (!napStr) return "";
        let clean = napStr.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        let words = clean.split(/\s+/);
        if (words.length >= 2) return words[words.length - 2];
        return words[0] || "";
    }

    // 3. Hàm xử lý logic chính của Mô-đun 03
    window.processModule03 = function () {
        const haoSoi = parseInt(document.getElementById("m03_HaoSoi").value);
        const nguCanh = document.getElementById("m03_NguCanh").value;

        // Trích xuất Tứ Trị
        let nhat = document.getElementById("tsNhat") ? document.getElementById("tsNhat").value : "";
        let nguyet = document.getElementById("tsNguyet") ? document.getElementById("tsNguyet").value : "";

        // Nếu m02 đã chạy, lấy thêm chi tiết Tứ Trị
        if (window.M02_DATA && window.M02_DATA.nhatChi) {
            nhat = window.M02_DATA.nhatChi;
        }

        const cungKeyChu = document.getElementById("selectCung") ? document.getElementById("selectCung").value : "";
        const qNameChu = document.getElementById("selectQue") ? document.getElementById("selectQue").value : "";

        if (!cungKeyChu || !qNameChu || typeof dataDich === 'undefined') {
            alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước!");
            return;
        }

        const chuData = dataDich[cungKeyChu].quẻ[qNameChu];
        const cacHaoDong = typeof selectedDong !== 'undefined' ? selectedDong : [];

        let res = `=== MÔ-ĐUN 03: KẾT QUẢ XỬ LÝ TOÀN DIỆN LOGIC MỘ KHỐ (CỔ PHÁP KHÚC VĨ) ===\n`;
        res += `• Tứ Trị Chiêm Đoán : Nhật Thần: ${nhat || "Chưa chọn"} | Nguyệt Lệnh: ${nguyet || "Chưa chọn"}\n`;
        res += `• Ngữ Cảnh Xử Lý   : ${document.getElementById("m03_NguCanh").options[document.getElementById("m03_NguCanh").selectedIndex].text}\n\n`;

        res += `--- I. PHÂN TÍCH QUY TẮC CẤP ĐỘ HÀO (THỨ BẬC CẤP NĂNG LƯỢNG) ---\n`;
        res += `• Cấp 1 (Tối cao) : Nhật Thần & Nguyệt Kiến (Bất khả xâm phạm, không bao giờ bị Nhập Mộ).\n`;
        res += `• Cấp 2            : Hào Biến.\n`;
        res += `• Cấp 3            : Hào Động.\n`;
        res += `• Cấp 4 (Thấp nhất): Hào Tĩnh.\n`;
        res += `=> Nguyên tắc Cố định: Hào chỉ bị Nhập Mộ bởi Hào có CẤP ĐỘ CAO HƠN hoặc BẰNG CẤP ĐỘ (theo tuyến Động - Biến của chính nó).\n\n`;

        res += `--- II. BẢNG QUÉT CHI TIẾT CÁC TRƯỜNG HỢP NHẬP MỘ TRONG QUẺ ---\n`;

        let danhSachHaoMo = [];

        for (let i = 5; i >= 0; i--) {
            const haoThu = i + 1;
            if (haoSoi !== 0 && haoSoi !== haoThu) continue;

            const napStr = chuData.n[i];
            const chi = extractChi(napStr);
            const moTarget = MO_MAP[chi]; // Địa chi Mộ của Hào này

            const isDong = cacHaoDong.includes(haoThu);
            let moStatus = [];
            let flagLockPower = false; // Đánh dấu Hào bị nhốt trong Mộ -> Tạm mất khả năng Sinh/Khắc/Hại

            if (moTarget) {
                // HÌNH THỨC A: Nhập Mộ tại Nhật Thần / Nguyệt Kiến (Cấp 1 Mộ Cấp 2,3,4)
                if (nhat === moTarget) {
                    moStatus.push(`BỊ NHẬP MỘ TẠI NHẬT THẦN [ ${nhat} ] (Cấp 1 thu Cấp ${isDong ? 3 : 4})`);
                    flagLockPower = true;
                }
                if (nguyet === moTarget) {
                    moStatus.push(`BỊ NHẬP MỘ TẠI NGUYỆT KIẾN [ ${nguyet} ] (Cấp 1 thu Cấp ${isDong ? 3 : 4})`);
                    flagLockPower = true;
                }

                // HÌNH THỨC B: Hào Tĩnh Nhập Mộ ở Hào Động (Cấp 3 Mộ Cấp 4)
                if (!isDong) {
                    // Tìm xem trong các hào động có hào nào mang chi Mộ của Hào Tĩnh này không
                    for (let hD of cacHaoDong) {
                        const chiDong = extractChi(chuData.n[hD - 1]);
                        if (chiDong === moTarget) {
                            // Kiểm tra xem Hào Động Mộ này có bị khắc hỏng không
                            let isMoBiKhac = false;
                            if ((nhat === "Dần" || nguyet === "Dần") && chiDong === "Thìn") isMoBiKhac = true; // Ví dụ Quẻ 3 Khốn->Tùy
                            
                            if (isMoBiKhac) {
                                moStatus.push(`Hào Động ${hD} [${chiDong}] là Mộ nhưng bị Tứ Trị Khắc Thương nát -> MẤT LỰC, KHÔNG THU ĐƯỢC HÀO TĨNH ${haoThu} VÀO MỘ`);
                            } else {
                                moStatus.push(`BỊ HÀO ĐỘNG ${hD} [ ${chiDong} ] THU VÀO MỘ (Cấp 3 thu Cấp 4)`);
                                flagLockPower = true;
                            }
                        }
                    }
                }

                // HÌNH THỨC C: Hào Động Nhập Mộ tại Hào Biến CÙNG TUYẾN (Động Hóa Mộ)
                if (isDong && typeof bienQueGiam !== 'undefined' && bienQueGiam && bienQueGiam.data) {
                    const napGocBien = bienQueGiam.data.n[i];
                    const chiBien = extractChi(napGocBien);

                    if (chiBien === moTarget) {
                        moStatus.push(`ĐỘNG HÓA MỘ CÙNG TUYẾN tại Hào Biến [ ${chiBien} ] (Cấp 2 thu Cấp 3) -> Tượng bị kẹt, trói buộc, câu lưu`);
                        flagLockPower = true;
                    }
                }
            } else {
                // Thổ Hào (Thìn, Tuất, Sửu, Mùi)
                moStatus.push(`Hào Thổ (Mộ Khố tự thân)`);
            }

            // Kiểm tra Hào Biến bị Nhập Mộ tại Nhật/Nguyệt (Cấp 1 Mộ Cấp 2)
            if (isDong && typeof bienQueGiam !== 'undefined' && bienQueGiam && bienQueGiam.data) {
                const napGocBien = bienQueGiam.data.n[i];
                const chiBien = extractChi(napGocBien);
                const moBienTarget = MO_MAP[chiBien];

                if (moBienTarget) {
                    if (nhat === moBienTarget) {
                        moStatus.push(`⚠️ HÀO BIẾN [ ${chiBien} ] BỊ NHẬP MỘ TẠI NHẬT [ ${nhat} ] -> Hào Biến bị khóa, tạm thời chưa thể Hồi Đầu Khắc/Sinh Hào Động!`);
                    }
                    if (nguyet === moBienTarget) {
                        moStatus.push(`⚠️ HÀO BIẾN [ ${chiBien} ] BỊ NHẬP MỘ TẠI NGUYỆT [ ${nguyet} ] -> Hào Biến bị khóa, tạm thời chưa thể Hồi Đầu Khắc/Sinh Hào Động!`);
                    }
                }
            }

            let strStatus = moStatus.length > 0 ? moStatus.join(" | ") : "Không bị Nhập Mộ (Tự Do)";
            res += `• Hào ${haoThu}: ${napStr.padEnd(25, ' ')} [Chi: ${chi}] -> ${strStatus}\n`;

            if (flagLockPower) {
                danhSachHaoMo.push({ hao: haoThu, nap: napStr, chi: chi, moTarget: moTarget });
            }
        }

        // III. PHƯƠNG THỨC XUẤT MỘ & ỨNG KỲ GIẢI TRỪ
        res += `\n--- III. PHƯƠNG THỨC XUẤT MỘ (PHÁ MỘ) & ỨNG KỲ THỜI GIAN ---\n`;
        if (danhSachHaoMo.length > 0) {
            danhSachHaoMo.forEach(item => {
                const chiHao = item.chi;
                const chiMo = item.moTarget;

                const chiXungMo = XUNG_MO_MAP[chiMo] || "";
                const chiXungHao = XUNG_HAO_MAP[chiHao] || "";
                const chiHopMo = HOP_MO_MAP[chiMo] || "";

                res += `[ HÀO ${item.hao}: ${item.nap} BỊ KẸT TRONG MỘ ${chiMo} ]\n`;
                res += `  + Cách 1 (Xung Mộ) : Gặp thời gian [ ${chiXungMo} ] Xung phá Mộ ${chiMo} -> Bật Mộ giải phóng Hào.\n`;
                res += `  + Cách 2 (Xung Hào) : Gặp thời gian [ ${chiXungHao} ] Xung trực tiếp Hào ${chiHao} -> Kéo Hào ra khỏi Mộ.\n`;
                res += `  + Cách 3 (Hợp Mộ) : Gặp thời gian [ ${chiHopMo} ] Lục Hợp với Mộ ${chiMo} (${chiMo} Hợp ${chiHopMo}) -> HẠO DỄ ỨNG NGHỆM NHẤT (Mộ bị kéo đi, nhả Hào ra).\n\n`;
            });
        } else {
            res += `• Không có Hào trọng điểm nào đang bị kẹt trong Mộ.\n\n`;
        }

        // IV. PHÂN TÍCH THEO NGỮ CẢNH VÀ CẢNH BÁO
        res += `--- IV. PHÂN TÍCH CHUYÊN SÂU THEO NGỮ CẢNH & CẢNH BÁO NGUY CƠ ---\n`;
        if (nguCanh === "benh_tat") {
            res += `⚠️ CHIÊM BỆNH TẬT / AN NGUY:\n`;
            res += `  + Dụng Thần / Thế nhập Mộ = Tượng bệnh nặng mất ý thức, bị cách ly hoặc kẹt trong vùng nguy hiểm.\n`;
            res += `  + Hào bị Nhập Mộ thì Hào Biến Khắc nó TAM THỜI CHƯA KHẮC ĐƯỢC (Được Mộ bảo vệ tạm thời).\n`;
            res += `  + ỨNG KỲ NGUY HẠI: Khi đến ngày/tháng XUNG HÀO / XUNG MỘ ra khỏi Mộ, Hào sẽ lập tức chịu trọn lực Hồi Đầu Khắc thương (Cần đặc biệt lưu ý mốc Xung Hào trước hay Xung Mộ trước).\n`;
        } else if (nguCanh === "nguoi_xa") {
            res += `✈️ CHIÊM NGƯỜI ĐI XA KHI NÀO VỀ:\n`;
            res += `  + Dụng Thần Động Hóa Mộ = Tượng người đi xa bị kẹt lại, trói buộc công việc, bị câu lưu chưa thể về.\n`;
            res += `  + GIẢI TRỪ VỀ NHÀ: Ứng nghiệm rõ nhất vào thời gian [ HỢP MỘ ] (Mộ bị Hợp nhả Dụng Thần ra) hoặc [ XUNG HÀO ] / [ XUNG MỘ ].\n`;
        } else if (nguCanh === "phap_ly") {
            res += `⚖️ CHIÊM PHÁP LÝ / CHỨC VỤ CƠ QUAN:\n`;
            res += `  + Động hóa Quan Quỷ Mộ = kẹt ở đơn vị, cơ quan nhà nước / thủ tục pháp lý trói buộc.\n`;
            res += `  + Lâm Đằng Xà = Tượng không gian nhỏ hẹp, xe lửa, đường dài trói buộc.\n`;
        } else {
            res += `📌 CHIÊM TỔNG QUÁT: Hào bị nhập Mộ tạm thời ẩn đi, vô lực sinh khắc. Phải chờ thời gian Xuất Mộ mới phát huy tác dụng.\n`;
        }

        res += `\n--- V. CÁC VÍ DỤ MINH HỌA THỰC CHIẾN (KHÚC VĨ) ---
1. Quẻ Mông -> Sư (Nhật Tý, Tháng Mùi): Dần Mộc Hào 6 động bị Nguyệt Mùi thu Mộ -> Chưa thể khắc Tử Tôn Tuất Thổ, đồng thời Hào Biến Dậu Kim chưa thể Hồi Đầu Khắc Dần Mộc.
2. Quẻ Khốn -> Tùy (Nhật Dần, Tháng Dần): Hào 2 Thìn Thổ động lẽ ra thu Hợi Thủy vào Mộ, nhưng bị Nhật/Nguyệt Dần Mộc khắc nát Thìn Thổ -> Thìn Thổ mất lực thu Mộ.
3. Quổ Cổ -> Sư (Xem bệnh - Nhật Mùi, Tháng Thìn): Dần Mộc động hóa Dậu Kim khắc, bị Nhật Mùi thu Mộ -> Đến tháng Thân (Xung Dần Mộc ra khỏi Mộ) thì Dần Mộc lập tức bị Dậu Kim hồi đầu khắc qua đời.
4. Quẻ Phong -> Chấn (Xem em về - Nhật Ngọ, Tháng Thân): Hợi Thủy động hóa Thìn Thổ (Động hóa Mộ) -> Đến ngày Dậu (Dậu Hợp Mộ Thìn), Thìn bị Hợp nhả Hợi Thủy ra -> Em trai về nhà an toàn.`;

        // Lưu Data Mộ cấp trọng yếu cho các module sau
        window.M03_DATA = {
            danhSachHaoMo: danhSachHaoMo,
            nguCanh: nguCanh
        };

        const outputEl = document.getElementById("m03_Output");
        const copyBtn = document.getElementById("m03_BtnCopy");
        outputEl.value = res;
        outputEl.style.display = "block";
        copyBtn.style.display = "block";
    };

    // 4. Hàm Sao Chép Kết Quả Text Thuần
    window.copyModule03Text = function () {
        const outputEl = document.getElementById("m03_Output");
        if (!outputEl || !outputEl.value) return;

        function showSuccess() {
            const btn = document.getElementById("m03_BtnCopy");
            btn.innerText = "✅ ĐÃ SAO CHÉP DATA MỘ (CẤP TRỌNG YẾU)!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ MÔ-ĐUN 03 (DATA MỘ CẤP TRỌNG YẾU)"; }, 2000);
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
