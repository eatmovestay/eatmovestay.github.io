/* ============================================================
   FILE MẪU — chỉ để minh họa cách 1 thuật toán Ngũ Linh thật sẽ
   được viết và đăng ký vào NguLinhEngine.

   Khi có file thuật toán thật (vd: ngulinh-luc-nham.js,
   ngulinh-kim-long.js...), hãy:
     1. Xoá <script src="js/ngulinh-mau-vi-du.js"></script>
        trong index.html (hoặc để lại cũng không sao, vì đây chỉ
        là 1 lựa chọn thêm trong danh sách).
     2. Thêm <script src="js/ten-file-that.js"></script> ngay
        sau dòng nạp ngulinh-engine.js.
     3. Trong file đó, gọi NguLinhEngine.register({...}) đúng
        như cấu trúc bên dưới.
   ============================================================ */

NguLinhEngine.register({
    id: 'vi-du',
    name: 'Ví dụ minh họa (xoá khi có thuật toán thật)',
    run: function (ctx) {
        const L = [];
        L.push('=== VÍ DỤ LẬP QUẺ NGŨ LINH ===');
        L.push('');
        L.push('Ngày: ' + ctx.duong.ngay + '/' + ctx.duong.thang + '/' + ctx.duong.nam + ' (' + ctx.duong.thu + ')');

        if (ctx.socVong) {
            L.push('');
            L.push('--- Lịch Sóc Vọng ---');
            L.push('Âm lịch: ' + ctx.socVong.amLich);
            L.push('Can Chi Ngày: ' + ctx.socVong.canChiNgay);
            L.push('Can Chi Tháng: ' + ctx.socVong.canChiThang);
            L.push('Can Chi Năm: ' + ctx.socVong.canChiNam);
        }

        if (ctx.tietKhi) {
            L.push('');
            L.push('--- Lịch Tiết Khí ---');
            L.push('Tiết hiện hành: ' + ctx.tietKhi.tietHienHanh);
            L.push('Can Chi Tháng: ' + ctx.tietKhi.canChiThang);
            L.push('Can Chi Năm: ' + ctx.tietKhi.canChiNam);
        }

        if (ctx.gio) {
            L.push('');
            L.push('--- Giờ lập quẻ ---');
            L.push('Giờ: ' + ctx.gio.chi + ' (' + ctx.gio.khoangGio + ')');
            L.push('Can Chi Giờ: ' + ctx.gio.canChi);
        }

        L.push('');
        L.push('(Đây chỉ là dữ liệu ctx được truyền vào — thay hàm run() này');
        L.push('bằng logic lập quẻ thật của phương pháp Ngũ Linh.)');

        return L.join('\n');
    }
});
