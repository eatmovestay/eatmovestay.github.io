/* ============================================================
   NGŨ LINH ENGINE — lớp tích hợp thuật toán lập quẻ
   ------------------------------------------------------------
   File này KHÔNG chứa logic lập quẻ. Nó chỉ là "ổ cắm" (socket)
   để các file thuật toán Ngũ Linh (mỗi file 1 phương pháp) cắm
   vào và dùng chung dữ liệu Ngày/Giờ lấy từ Lịch Dụng Sự.

   CÁCH 1 FILE THUẬT TOÁN ĐĂNG KÝ VÀO ENGINE
   ------------------------------------------------------------
   Mỗi file thuật toán (nạp bằng <script> SAU file này) chỉ cần gọi:

       NguLinhEngine.register({
           id:   'ten-khong-dau-duy-nhat',   // vd: 'luc-nham', 'kim-long'
           name: 'Tên hiển thị cho người dùng',
           run:  function(ctx) {
               // ... logic lập quẻ của phương pháp này ...
               return 'Toàn bộ kết quả dưới dạng CHUỖI TEXT THUẦN';
           }
       });

   Nếu trang có NHIỀU thuật toán cùng đăng ký, khi bấm nút
   "Lập Quẻ Ngũ Linh" trên lịch, engine sẽ hiện danh sách cho
   người dùng chọn 1 thuật toán để chạy.

   CẤU TRÚC ctx TRUYỀN VÀO run(ctx)
   ------------------------------------------------------------
   ctx.duong    = { ngay, thang, nam, thu }              // thu: "Thứ Hai"...
   ctx.socVong  = { amLich, canChiNgay, canChiThang, canChiNam } | null
   ctx.tietKhi  = { tietHienHanh, canChiThang, canChiNam } | null
   ctx.gio      = { chi, canChi, khoangGio } | null       // vd: chi:'Tý',
                                                           // canChi:'Giáp Tý',
                                                           // khoangGio:'23:00–00:59'

   run(ctx) PHẢI trả về một chuỗi text thuần (không HTML). Chuỗi
   này sẽ hiển thị trong khung kết quả kèm nút "Copy text" để
   người dùng tự dán ra nơi khác xử lý tiếp.
   ============================================================ */

window.NguLinhEngine = (function () {
    const algorithms = [];

    function register(def) {
        if (!def || !def.id || !def.name || typeof def.run !== 'function') {
            console.error('NguLinhEngine.register: định nghĩa thuật toán không hợp lệ.', def);
            return;
        }
        if (algorithms.some(a => a.id === def.id)) {
            console.warn('NguLinhEngine: id "' + def.id + '" đã được đăng ký trước đó, bỏ qua bản trùng.');
            return;
        }
        algorithms.push(def);
    }

    function list() {
        return algorithms.slice();
    }

    // Được gọi từ nút "🔮 Lập Quẻ Ngũ Linh" trong modal chi tiết ngày
    // (do calendar-core.js render ra).
    function layQue() {
        const sel = window.__nlSelectedDate;
        if (!sel) {
            alert('Vui lòng chọn một ngày trên lịch trước.');
            return;
        }
        const chiEl = document.getElementById('gioChiSelect');
        const chi = chiEl ? chiEl.value : '';
        if (!chi) {
            alert('Vui lòng chọn giờ trước khi lập quẻ.');
            return;
        }
        if (typeof NL_getDayContext !== 'function') {
            alert('Thiếu dữ liệu nền từ calendar-core.js.');
            return;
        }

        const ctx = NL_getDayContext(sel.year, sel.month, sel.day, chi);

        if (algorithms.length === 0) {
            alert('Chưa có thuật toán Ngũ Linh nào được nạp.\nHãy thêm file thuật toán (vd: js/ngulinh-ten-phuong-phap.js) vào index.html, sau dòng nạp ngulinh-engine.js.');
            return;
        }
        if (algorithms.length === 1) {
            runAndShow(algorithms[0], ctx);
        } else {
            openChooser(ctx);
        }
    }

    function openChooser(ctx) {
        window.__nlPendingCtx = ctx;
        const html = algorithms.map(a =>
            `<button class="btn-secondary" style="width:100%;margin-bottom:8px;text-align:left" onclick="NguLinhEngine._runById('${a.id}')">${a.name}</button>`
        ).join('');
        document.getElementById('nlChonNoiDung').innerHTML = html;
        document.getElementById('nlChonModal').classList.add('active');
    }

    function _runById(id) {
        const algo = algorithms.find(a => a.id === id);
        const ctx = window.__nlPendingCtx;
        closeNlModal('nlChonModal');
        if (algo && ctx) runAndShow(algo, ctx);
    }

    function runAndShow(algo, ctx) {
        let text;
        try {
            text = algo.run(ctx);
            if (typeof text !== 'string') text = String(text);
        } catch (e) {
            text = 'Lỗi khi chạy thuật toán "' + algo.name + '":\n' + (e && e.message ? e.message : e);
        }
        showResult(algo.name, text);
    }

    function showResult(title, text) {
        document.getElementById('nlKetQuaTitle').textContent = '🔮 ' + title;
        document.getElementById('nlKetQuaText').value = text;
        document.getElementById('nlKetQuaModal').classList.add('active');
    }

    function copyResult() {
        const ta = document.getElementById('nlKetQuaText');
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, 999999);
        let ok = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ta.value);
                ok = true;
            }
        } catch (e) { /* rơi xuống fallback bên dưới */ }
        if (!ok) {
            try { document.execCommand('copy'); } catch (e) {}
        }
        const btn = document.getElementById('nlCopyBtn');
        if (btn) {
            const old = btn.textContent;
            btn.textContent = '✅ Đã copy';
            setTimeout(() => { btn.textContent = old; }, 1500);
        }
    }

    function closeNlModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    return { register, list, layQue, _runById, copyResult, closeNlModal };
})();
