// =========================================================
//  MTRACHCAT.JS — Trạch Cát: Niên–Nguyệt khắc/hợp Sơn gia (Mộ Long)
//  Nguồn logic: bài "Trạch Cát Thần Bí – Bài 1" + 2 bảng ảnh trong bài.
//
//  PHỤ THUỘC (load theo thứ tự trong total.html):
//    1) thư viện lịch âm (window._calendar)
//    2) calendar-core.js   (dùng NL_getDayContext)
//    3) mtrachcat.js       (file này)
//
//  Module KHÔNG tự tính lịch. Mọi can chi Năm/Tháng/Ngày/Giờ đều lấy từ
//  NL_getDayContext() của calendar-core.js (Năm+Tháng theo Tiết Khí thật,
//  Ngày theo lịch Sóc Vọng, Giờ theo Ngũ Thử Độn).
//
//  API (window.TrachCat):
//    moLong(son, can)                 -> mộ long của sơn theo can năm
//    danhGiaThoiDiem(son, y, m, d, chi)
//    quetKhoang(son, tu, den, opts)   -> liệt kê ngày/giờ tốt
//    CONFIG                           -> quy ước có thể chỉnh
// =========================================================
(function (root) {
    'use strict';

    // ---------- DỮ LIỆU GỐC ----------
    const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
    const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

    // Tên quái dùng thay cho 4 sơn chính vị (theo bảng 24 sơn trong bài)
    const QUAI_RA_CHI = { 'Khảm':'Tý', 'Ly':'Ngọ', 'Chấn':'Mão', 'Đoài':'Dậu' };

    // Bảng Hồng Phạm Ngũ Hành (bảng ảnh số 1 trong bài) — 24 sơn
            const tu = document.getElementById('tcTu').value.split('-').map(Number);
            const den = document.getElementById('tcDen').value.split('-').map(Number);
            if (tu.length < 3 || den.length < 3 || tu.some(isNaN) || den.some(isNaN)) { out.innerHTML = '<p style="color:#b91c1c">Hãy chọn đủ ngày.</p>'; return; }
            const soNgay = (new Date(den[0], den[1] - 1, den[2]) - new Date(tu[0], tu[1] - 1, tu[2])) / 86400000;
            if (soNgay < 0) { out.innerHTML = '<p style="color:#b91c1c">Ngày kết thúc phải sau ngày bắt đầu.</p>'; return; }
            if (soNgay > 92) { out.innerHTML = '<p style="color:#b91c1c">Khoảng quá dài, chọn tối đa 92 ngày.</p>'; return; }
            const m = document.getElementById('tcMuc').value;
            const lay = ['DAI_CAT', 'CAT'].concat(m >= 2 ? ['TRUNG_SACH'] : [], m >= 3 ? ['HA_SACH'] : []);
            out.innerHTML = 'Đang tính…';
            setTimeout(() => {
                const kq = quetKhoang(son, { y: tu[0], m: tu[1], d: tu[2] }, { y: den[0], m: den[1], d: den[2] }, { chiLay: lay });
                out.innerHTML = kq.loi ? '<p style="color:#b91c1c">' + kq.loi + '</p>' : htmlKetQua(kq);
            }, 30);
        };
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dungGiaoDien);
        else dungGiaoDien();
    }

    const API = {
        moLong: moLong, napAm: napAm, quanHe: quanHe, chuanHoaSon: chuanHoaSon,
        danhGiaThoiDiem: danhGiaThoiDiem, quetKhoang: quetKhoang, htmlKetQua: htmlKetQua,
        CONFIG: CONFIG, NHAN_LOAI: NHAN_LOAI, NHAN_MUC: NHAN_MUC,
        _data: { SON_HANH: SON_HANH, HANH_RA_MO: HANH_RA_MO, NAP_AM: NAP_AM }
    };
    root.TrachCat = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
