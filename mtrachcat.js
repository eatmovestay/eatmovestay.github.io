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
    const SON_HANH = {
        'Giáp':'Thủy','Dần':'Thủy','Thìn':'Thủy','Tốn':'Thủy','Tuất':'Thủy','Tý':'Thủy','Tân':'Thủy','Thân':'Thủy',
        'Sửu':'Thổ','Quý':'Thổ','Khôn':'Thổ','Canh':'Thổ','Mùi':'Thổ',
        'Ngọ':'Hỏa','Nhâm':'Hỏa','Bính':'Hỏa','Ất':'Hỏa',
        'Mão':'Mộc','Cấn':'Mộc','Tỵ':'Mộc',
        'Càn':'Kim','Hợi':'Kim','Dậu':'Kim','Đinh':'Kim'
    };

    // Cục tam hợp -> chi Mộ khố. Thổ đi theo cục Thủy (bài quy định cùng Thìn).
    const HANH_RA_MO = { 'Thủy':'Thìn','Thổ':'Thìn','Hỏa':'Tuất','Kim':'Sửu','Mộc':'Mùi' };

    // 30 cặp nạp âm, bắt đầu từ Giáp Tý/Ất Sửu
    const NAP_AM = [
        ['Hải trung kim','Kim'],['Lư trung hỏa','Hỏa'],['Đại lâm mộc','Mộc'],['Lộ bàng thổ','Thổ'],['Kiếm phong kim','Kim'],
        ['Sơn đầu hỏa','Hỏa'],['Giản hạ thủy','Thủy'],['Thành đầu thổ','Thổ'],['Bạch lạp kim','Kim'],['Dương liễu mộc','Mộc'],
        ['Tuyền trung thủy','Thủy'],['Ốc thượng thổ','Thổ'],['Tích lịch hỏa','Hỏa'],['Tùng bách mộc','Mộc'],['Trường lưu thủy','Thủy'],
        ['Sa trung kim','Kim'],['Sơn hạ hỏa','Hỏa'],['Bình địa mộc','Mộc'],['Bích thượng thổ','Thổ'],['Kim bạch kim','Kim'],
        ['Phú đăng hỏa','Hỏa'],['Thiên hà thủy','Thủy'],['Đại dịch thổ','Thổ'],['Thoa xuyến kim','Kim'],['Tang đố mộc','Mộc'],
        ['Đại khê thủy','Thủy'],['Sa trung thổ','Thổ'],['Thiên thượng hỏa','Hỏa'],['Thạch lựu mộc','Mộc'],['Đại hải thủy','Thủy']
    ];

    const SINH = { 'Mộc':'Hỏa','Hỏa':'Thổ','Thổ':'Kim','Kim':'Thủy','Thủy':'Mộc' };
    const KHAC = { 'Mộc':'Thổ','Thổ':'Thủy','Thủy':'Hỏa','Hỏa':'Kim','Kim':'Mộc' };

    // ---------- QUY ƯỚC CHỈNH ĐƯỢC (bài chưa quy định, mình chọn mặc định) ----------
    const CONFIG = {
        // Mức của MỘT trụ so với mộ long
        // Bài: đồng hành / sinh mộ long / bị mộ long khắc = tốt; khắc mộ long = đại hung;
        // mộ long sinh ra nó = tiểu hung. Ví dụ 2 của bài gọi "sinh mộ long" là đại cát.
        mucTheoQuanHe: {
            dongHanh:    'CAT',
            sinhMoLong:  'DAI_CAT',
            biMoLongKhac:'CAT',
            moLongSinh:  'TIEU_HUNG',
            khacMoLong:  'DAI_HUNG'
        },
        // Kết luận chung: Niên + 3 trụ (Tháng, Ngày, Giờ) — "3 chọi 1"
        xepLoai: function (nienMuc, ba) {
            const tot = m => m === 'CAT' || m === 'DAI_CAT';
            const soCat = ba.filter(tot).length;
            const coDaiHung = ba.indexOf('DAI_HUNG') !== -1;
            if (tot(nienMuc)) {
                if (soCat === 3) return 'DAI_CAT';
                if (soCat === 2 && !coDaiHung) return 'CAT';
                return 'NEN_TRANH';
            }
            if (nienMuc === 'TIEU_HUNG') return soCat === 3 ? 'TRUNG_SACH' : 'NEN_TRANH';
            if (nienMuc === 'DAI_HUNG')  return soCat === 3 ? 'HA_SACH'    : 'NEN_TRANH';
            return 'NEN_TRANH';
        }
    };

    const NHAN_MUC = {
        DAI_CAT:'Đại cát', CAT:'Cát', TIEU_HUNG:'Tiểu hung', DAI_HUNG:'Đại hung'
    };
    const NHAN_LOAI = {
        DAI_CAT:'Đại cát', CAT:'Cát', TRUNG_SACH:'Trung sách (3 chọi 1)',
        HA_SACH:'Hạ sách — nên hoãn nếu được', NEN_TRANH:'Nên tránh'
    };

    // ---------- HÀM CƠ BẢN ----------
    function chuanHoaSon(son) {
        let s = String(son || '').trim();
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        if (s === 'Tị') s = 'Tỵ';
        if (QUAI_RA_CHI[s]) s = QUAI_RA_CHI[s];
        return SON_HANH[s] ? s : null;
    }

    // "Giáp Tý" -> { can, chi, idx60 }
    function parseCanChi(text) {
        const p = String(text || '').trim().split(/\s+/);
        if (p.length < 2) return null;
        const chi = p[1] === 'Tị' ? 'Tỵ' : p[1];
        const c = CAN.indexOf(p[0]), h = CHI.indexOf(chi);
        if (c < 0 || h < 0 || (c % 2) !== (h % 2)) return null;
        let n = -1;
        for (let t = 0; t < 6; t++) { if ((c + 10 * t) % 12 === h) { n = c + 10 * t; break; } }
        return n < 0 ? null : { can: p[0], chi: chi, idx60: n };
    }

    function napAm(canChiText) {
        const cc = parseCanChi(canChiText);
        if (!cc) return null;
        const e = NAP_AM[Math.floor(cc.idx60 / 2)];
        return { canChi: cc.can + ' ' + cc.chi, ten: e[0], hanh: e[1] };
    }

    // Ngũ Thử Độn: can của giờ/tháng Tý theo can năm: (2*(can%5)) % 10
    function moLong(son, canNam) {
        const s = chuanHoaSon(son);
        const canIdx = CAN.indexOf(canNam);
        if (!s || canIdx < 0) return null;
        const hanhSon = SON_HANH[s];
        const chiMo = HANH_RA_MO[hanhSon];
        const stemTy = (2 * (canIdx % 5)) % 10;
        const canMo = CAN[(stemTy + CHI.indexOf(chiMo)) % 10];
        const na = napAm(canMo + ' ' + chiMo);
        return { son: s, hanhSon: hanhSon, chiMo: chiMo, canChi: na.canChi, napAm: na.ten, hanh: na.hanh };
    }

    function quanHe(hanhMo, hanhX) {
        const m = CONFIG.mucTheoQuanHe;
        if (hanhX === hanhMo)       return { quanHe:'Đồng hành mộ long',       muc: m.dongHanh };
        if (SINH[hanhX] === hanhMo) return { quanHe:'Sinh mộ long',            muc: m.sinhMoLong };
        if (KHAC[hanhMo] === hanhX) return { quanHe:'Bị mộ long khắc',         muc: m.biMoLongKhac };
        if (SINH[hanhMo] === hanhX) return { quanHe:'Mộ long sinh ra (tiết khí)', muc: m.moLongSinh };
        return                             { quanHe:'Khắc mộ long',            muc: m.khacMoLong };
    }

    function danhGiaTru(tenTru, canChiText, mo) {
        const na = napAm(canChiText);
        if (!na) return { tru: tenTru, canChi: canChiText || '?', loi: true, muc: null };
        const q = quanHe(mo.hanh, na.hanh);
        return {
            tru: tenTru, canChi: na.canChi, napAm: na.ten, hanh: na.hanh,
            quanHe: q.quanHe, muc: q.muc, nhanMuc: NHAN_MUC[q.muc]
        };
    }

    // ---------- ĐÁNH GIÁ MỘT THỜI ĐIỂM (cần calendar-core.js) ----------
    function danhGiaThoiDiem(son, y, m, d, chi) {
        if (typeof NL_getDayContext !== 'function')
            return { loi: 'Chưa load calendar-core.js (thiếu NL_getDayContext).' };
        const s = chuanHoaSon(son);
        if (!s) return { loi: 'Sơn không hợp lệ: ' + son };
        const ctx = NL_getDayContext(y, m, d, chi);
        if (!ctx.tietKhi) return { loi: 'Ngoài phạm vi dữ liệu Tiết Khí (2023–2046).' };
        if (!ctx.socVong || !ctx.gio || !ctx.gio.canChi) return { loi: 'Không đọc được can chi ngày/giờ.' };

        const canNam = ctx.tietKhi.canChiNam.split(' ')[0];
        const mo = moLong(s, canNam);

        const nien  = danhGiaTru('Niên',  ctx.tietKhi.canChiNam,   mo);
        const thang = danhGiaTru('Tháng', ctx.tietKhi.canChiThang, mo);
        const ngay  = danhGiaTru('Ngày',  ctx.socVong.canChiNgay,  mo);
        const gio   = danhGiaTru('Giờ',   ctx.gio.canChi,          mo);
        if ([nien, thang, ngay, gio].some(t => t.loi)) return { loi: 'Lỗi tra nạp âm.' };

        const loai = CONFIG.xepLoai(nien.muc, [thang.muc, ngay.muc, gio.muc]);
        return {
            son: s, hanhSon: mo.hanhSon, moLong: mo,
            nien: nien, thang: thang, ngay: ngay, gio: gio,
            loai: loai, nhanLoai: NHAN_LOAI[loai],
            ngayDuong: { y: y, m: m, d: d }, chiGio: chi
        };
    }

    // ---------- QUÉT KHOẢNG NGÀY ----------
    // tu/den: {y,m,d}. opts: { chiGio:[...], chiLay:['DAI_CAT','CAT','TRUNG_SACH'] }
    function quetKhoang(son, tu, den, opts) {
        opts = opts || {};
        const dsChi = opts.chiGio || CHI;
        const lay = opts.chiLay || ['DAI_CAT', 'CAT'];
        const out = [];
        const cur = new Date(tu.y, tu.m - 1, tu.d);
        const end = new Date(den.y, den.m - 1, den.d);
        for (; cur <= end; cur.setDate(cur.getDate() + 1)) {
            const y = cur.getFullYear(), m = cur.getMonth() + 1, d = cur.getDate();
            for (const c of dsChi) {
                const r = danhGiaThoiDiem(son, y, m, d, c);
                if (r.loi) { if (out.length === 0 && !opts.boQuaLoi) return { loi: r.loi }; continue; }
                if (lay.indexOf(r.loai) !== -1) out.push(r);
            }
        }
        return out;
    }

    const API = {
        moLong: moLong, napAm: napAm, quanHe: quanHe, chuanHoaSon: chuanHoaSon,
        danhGiaThoiDiem: danhGiaThoiDiem, quetKhoang: quetKhoang,
        CONFIG: CONFIG, NHAN_LOAI: NHAN_LOAI, NHAN_MUC: NHAN_MUC,
        _data: { SON_HANH: SON_HANH, HANH_RA_MO: HANH_RA_MO, NAP_AM: NAP_AM }
    };
    root.TrachCat = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
