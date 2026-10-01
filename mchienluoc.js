/* =========================================================================
 * mchienluoc.js — MODULE: TRA CỨU QUẺ
 * Kinh Dịch Lục Hào — công cụ tra cứu nhanh: chọn bất kỳ 1 trong 64 quẻ,
 * chọn đúng 1 hào Động (1-6), hiển thị:
 *   - Quẻ Chính (đã chọn) + Họ Quẻ của nó
 *   - Hào Động: Lục Thân + Địa Chi + Hành
 *   - Hào Biến: Lục Thân + Địa Chi + Hành
 *   - Quẻ Biến (tên) + Họ Quẻ của Quẻ Biến
 * KHÔNG hiển thị vạch Âm/Dương — chỉ tên quẻ + chữ.
 *
 * Toàn bộ logic nạp giáp/lục thân/tìm quẻ biến TÁI DÙNG NGUYÊN XI các hàm đã
 * có sẵn trong total.html (dataDich, getChiHanh, getHanh, tinhLucThan,
 * findQueByCode) — không khai báo lại, để tra cứu luôn khớp 100% với phần
 * Lập Quẻ chính và không có rủi ro 2 nơi tính ra 2 kết quả khác nhau.
 * Dùng bộ chọn (Họ Quẻ/Tên Quẻ/Hào Động) RIÊNG của module này (id tiền tố
 * mchienluoc_), không đụng tới lựa chọn quẻ đang làm việc ở phần Lập Quẻ chính phía
 * trên — tra cứu xong không ảnh hưởng gì tới quẻ bạn đang luận dở ở trên.
 * ========================================================================= */
(function () {
    "use strict";

    const CUNG_OPTIONS = [
        { value: "Can",  label: "Họ Kiền (Kim)" },
        { value: "Doai", label: "Họ Đoài (Kim)" },
        { value: "Ly",   label: "Họ Ly (Hỏa)" },
        { value: "Chan", label: "Họ Chấn (Mộc)" },
        { value: "Ton",  label: "Họ Tốn (Mộc)" },
        { value: "Kham", label: "Họ Khảm (Thủy)" },
        { value: "Can2", label: "Họ Cấn (Thổ)" },
        { value: "Khon", label: "Họ Khôn (Thổ)" }
    ];

    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module chienluoc — Tra Cứu Hào Động Đơn (64 Quẻ)</h1>
        </div>
        <p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
            Công cụ tra cứu độc lập — không ảnh hưởng tới quẻ đang chọn ở phần Lập Quẻ phía trên.
            Chọn 1 quẻ bất kỳ và đúng 1 hào Động để xem Hào Động/Hào Biến và Quẻ Biến tương ứng.
        </p>

        <label>Chọn Họ Quẻ</label>
        <select id="mchienluoc_cung"><option value="">-- Chọn Họ --</option></select>

        <label>Chọn Tên Quẻ</label>
        <select id="mchienluoc_que"><option value="">-- Chọn Họ Quẻ trước --</option></select>

        <label>Chọn Hào Động (chỉ 1 hào)</label>
        <select id="mchienluoc_hao">
            <option value="">-- Chọn Hào --</option>
            <option value="1">Hào 1</option>
            <option value="2">Hào 2</option>
            <option value="3">Hào 3</option>
            <option value="4">Hào 4</option>
            <option value="5">Hào 5</option>
            <option value="6">Hào 6</option>
        </select>

        <button class="m-btn-process" id="mchienluoc_traCuuBtn">🔍 TRA CỨU</button>
        <textarea id="mchienluoc_output" class="m-output-box" readonly></textarea>
        <button class="btn-copy" id="mchienluoc_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ TRA CỨU</button>
        <div class="fallback-box" id="mchienluoc_fallbackBox">
            <textarea id="mchienluoc_fallbackText" readonly></textarea>
            <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        </div>
    `;
    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);
    $("mchienluoc_output").addEventListener("click", function () { this.select(); });
    $("mchienluoc_fallbackText").addEventListener("click", function () { this.select(); });

    function populateCungSelect() {
        const sel = $("mchienluoc_cung");
        sel.innerHTML = '<option value="">-- Chọn Họ --</option>';
        CUNG_OPTIONS.forEach(o => {
            const opt = document.createElement("option");
            opt.value = o.value; opt.text = o.label;
            sel.appendChild(opt);
        });
    }
    populateCungSelect();

    function populateQueSelect() {
        const cungKey = $("mchienluoc_cung").value;
        const sel = $("mchienluoc_que");
        sel.innerHTML = '<option value="">-- Chọn quẻ --</option>';
        if (cungKey && dataDich[cungKey]) {
            Object.keys(dataDich[cungKey].quẻ).forEach(qName => {
                const opt = document.createElement("option");
                opt.value = qName; opt.text = qName;
                sel.appendChild(opt);
            });
        }
        $("mchienluoc_output").style.display = "none";
        $("mchienluoc_copyBtn").style.display = "none";
    }

    function traCuu() {
        const cungKey = $("mchienluoc_cung").value;
        const qName = $("mchienluoc_que").value;
        const haoSo = $("mchienluoc_hao").value;
        const outputEl = $("mchienluoc_output");

        if (!cungKey || !qName) {
            alert("Vui lòng chọn Họ Quẻ và Tên Quẻ trước.");
            return;
        }
        if (!haoSo) {
            alert("Vui lòng chọn đúng 1 Hào Động.");
            return;
        }

        const cungChu = dataDich[cungKey];
        const chuData = cungChu.quẻ[qName];
        const h = Number(haoSo);
        const i = h - 1;

        // Lục Thân + Chi + Hành của chính Hào Động trong Quẻ Chính (giữ nguyên, không đổi).
        const napHaoDong = chuData.n[i];
        const chiHanhDong = getChiHanh(napHaoDong);
        const chiDong = chiHanhDong.split(" ")[0];
        const hanhDong = getHanh(chiHanhDong);
        const lucThanDong = napHaoDong.replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/).slice(0, -2).join(" ");

        // Lật đúng 1 bit để tìm Quẻ Biến — dùng chung quy ước bit với findQueByCode (code nền).
        const chuCodeArr = chuData.c.split("");
        const bitIndex = 6 - h;
        chuCodeArr[bitIndex] = chuCodeArr[bitIndex] === "1" ? "0" : "1";
        const bienCode = chuCodeArr.join("");
        const queBien = findQueByCode(bienCode);

        let text = `=== MODULE Chiến Lược — TRA CỨU QUẺ ===\n`;
        text += `Quẻ Chính: ${qName} (Họ ${cungChu.name} - ${cungChu.hanh})\n`;
        text += `Hào Động ${h}: ${lucThanDong} ${chiDong} ${hanhDong}\n`;

        if (!queBien) {
            text += `Hào Biến: (không tìm thấy quẻ biến tương ứng trong dữ liệu 64 quẻ — kiểm tra lại data)\n`;
            text += `Quẻ Biến: (không xác định)\n`;
        } else {
            // Lục Thân Hào Biến tính lại theo hành Họ Quẻ CHÍNH (đúng quy ước code nền:
            // quái chứa hào Động thì nạp giáp lấy theo quẻ Biến, Lục Thân tính theo Cung Chủ).
            const napHaoBien = queBien.data.n[i];
            const chiHanhBien = getChiHanh(napHaoBien);
            const chiBien = chiHanhBien.split(" ")[0];
            const hanhBien = getHanh(chiHanhBien);
            const lucThanBien = tinhLucThan(hanhBien, cungChu.hanh);

            text += `Hào Biến: ${lucThanBien} ${chiBien} ${hanhBien}\n`;
            text += `Quẻ Biến: ${queBien.name} (Họ ${queBien.cung.name} - ${queBien.cung.hanh})\n`;
        }

        text += `=== HẾT TRA CỨU ===`;

        outputEl.value = text;
        outputEl.style.display = "block";
        $("mchienluoc_copyBtn").style.display = "block";
        $("mchienluoc_fallbackBox").style.display = "none";
    }

    function copyKetQua() {
        const text = $("mchienluoc_output").value;
        if (!text) return;
        function showSuccess() {
            const btn = $("mchienluoc_copyBtn");
            $("mchienluoc_fallbackBox").style.display = "none";
            btn.innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ TRA CỨU"; }, 2000);
        }
        function showFallback() {
            const fbBox = $("mchienluoc_fallbackBox");
            const ta = $("mchienluoc_fallbackText");
            ta.value = text;
            fbBox.style.display = "block";
            ta.focus();
            ta.select();
        }
        function tryExecCommandCopy() {
            try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                return ok;
            } catch (e) { return false; }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
                if (tryExecCommandCopy()) showSuccess(); else showFallback();
            });
        } else if (tryExecCommandCopy()) {
            showSuccess();
        } else {
            showFallback();
        }
    }

    $("mchienluoc_cung").addEventListener("change", populateQueSelect);
    $("mchienluoc_traCuuBtn").addEventListener("click", traCuu);
    $("mchienluoc_copyBtn").addEventListener("click", copyKetQua);

})();
