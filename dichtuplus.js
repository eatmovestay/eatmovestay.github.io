// =========================================================
//  DICHTUPLUS.JS — Module "Dịch Tự Plus · Nối Quẻ" (v1.0) cho trang Liên Hoa Độn Pháp
//  Kế thừa logic của dichtu.js nhưng là module ĐỘC LẬP (không cần dichtu.js).
//  Dữ liệu: dichtu.html (cùng thư mục), khối <script type="text/plain" id="kho-du-lieu-que">.
//  Nếu không có dichtu.html thì thử dichtuong.html (CONFIG.dataUrlDuPhong).
//
//  Dịch tự mở rộng: ghép các quái đơn của Chính – Hỗ – Biến thành quẻ kép mới rồi tra dịch tự.
//  Ký hiệu: C1/C2 = Chính thượng/hạ · H1/H2 = Hỗ thượng/hạ · B1/B2 = Biến thượng/hạ.
//  "X ➔ Y" nghĩa là X làm thượng quái, Y làm hạ quái.
//   Nhóm Chính – Hỗ (luôn có, 8 cặp):
//     C1➔H1, H1➔C1, C2➔H2, H2➔C2, C1➔H2, H2➔C1, H1➔C2, C2➔H1
//   Nhóm Chính – Biến (chỉ cặp của quái ĐỘNG):
//     hào 4–6 động (C1 biến B1): C1➔B1, B1➔C1
//     hào 1–3 động (C2 biến B2): C2➔B2, B2➔C2
//     (quái không động thì B = C nên bỏ qua)
//   Nhóm Biến: B2➔B1 (cặp B1➔B2 đã có ở dichtu.js nên không lặp lại)
//
//  Cách dùng: nút số chọn Không Thời; tích chọn Cách / Tượng / Nghĩa (Dịch tự luôn hiển thị,
//  thiếu thì báo "Rỗng"); mỗi cặp là một khung thu gọn / mở rộng (mặc định thu gọn, tiêu đề
//  ghi sẵn tên quẻ kép tìm được).
//
//  Phụ thuộc: chỉ trang Liên Hoa (renderResults, clearAll, switchTab, #result1, #result2).
//
//  Cho module khác dùng (window.DichTuPlus):
//    DichTuPlus.ready                -> Promise<{ok, ques, issues}|{ok:false, loi}>
//    DichTuPlus.getByPair(7, 3)      -> Promise<quẻ|{loi}>   (quái thượng, hạ theo số Liên Hoa: 1 Kiền … 8 Khôn)
//    DichTuPlus.getQue(18), getAll()
//    DichTuPlus.getCapKT(i)          -> Promise<{kt, hao, ky:{C1,C2,H1,H2,B1,B2}, cap:[{nhom, ten, thuong, ha, que|loi}]}>
//    DichTuPlus.getAllCapKT()        -> Promise<mảng>
//    DichTuPlus.plain(quẻ.cach)      -> text thuần của một mục
//    DichTuPlus.getState(), selectKT(i), getTicked(), onChange(fn), sự kiện 'dichtuplus:change'
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'dichtu.html', dataUrlDuPhong: 'dichtuong.html', tieuDe: 'Dịch Tự Plus · Nối Quẻ', khoa: 'dtp_chon', khoId: 'kho-du-lieu-que' };
    const TEN_LH = ['', 'Kiền', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'];
    const tenQ = n => TEN_LH[n] || '?';
    const QUAI_SO = { 'CÀN': 1, 'KIỀN': 1, 'ĐOÀI': 2, 'LY': 3, 'CHẤN': 4, 'TỐN': 5, 'KHẢM': 6, 'CẤN': 7, 'KHÔN': 8 };
    const MUC = [
        { key: 'dichtu', ten: 'Dịch tự' }, { key: 'cach', ten: 'Cách' },
        { key: 'tuong', ten: 'Tượng' }, { key: 'nghia', ten: 'Nghĩa' }
    ];
    const CHON = MUC.filter(m => m.key !== 'dichtu');         // 3 ô tích chọn

    function boDau(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    function soQuai(t) {
        const s = String(t || '').normalize('NFC').trim().toUpperCase();
        if (QUAI_SO[s]) return QUAI_SO[s];
        const b = boDau(s);
        const v = []; Object.keys(QUAI_SO).forEach(k => { if (boDau(k) === b && v.indexOf(QUAI_SO[k]) < 0) v.push(QUAI_SO[k]); });
        return v.length === 1 ? v[0] : null;
    }

    // ---------- PHÂN TÍCH dichtu.html ----------
    function phanLoaiNhan(nhan) {
        const k = nhan.normalize('NFC').toLowerCase().replace(/[:：\s]+$/, '').trim();
        if (k.indexOf('dịch tự') === 0) return 'dichtu';
        if (k.indexOf('cách') === 0) return 'cach';
        if (k.indexOf('tượng') === 0) return 'tuong';
        if (k.indexOf('nghĩa') === 0) return 'nghia';
        return null;
    }

    function themDong(target, raw) {
        const m = raw.match(/^(\s*)•\s*(.*)$/);
        if (m) target.blocks.push({ t: 'li', lv: m[1].length >= 2 ? 1 : 0, x: m[2].trim() });
        else target.blocks.push({ t: 'p', x: raw.trim() });
    }
    function themBang(target, t) {
        const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        if (cells.every(c => /^[•\-:\s]*$/.test(c))) return;          // dòng gạch ngăn |•••|•••|
        const last = target.blocks[target.blocks.length - 1];
        if (last && last.t === 'tb') last.rows.push(cells);
        else target.blocks.push({ t: 'tb', rows: [cells] });
    }

    function parse(text) {
        const issues = [], ques = [];
        let cung = '', cur = null, main = null, target = null, pendingQuai = null;
        const reHead = /^\s*(\d{1,3})\.\s+(.+?)\s*:\s*$/;
        const reQuai = /^\s*(\S+)\s+thượng\s*[-–—]\s*(\S+)\s+hạ\s*$/i;
        const reHet = /^\s*\*{2,}\s*HẾT\s*\*{2,}\s*$/i;
        const reCung = /^CUNG\s+(\S.*)$/;
        const reNhan = /^\s*\*\*([^*]+?)\*\*\s*(.*)$/;

        const lines = String(text || '').replace(/\r/g, '').split('\n');
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].replace(/\s+$/, '');
            const t = l.trim();
            if (reHet.test(t)) break;                                  // hết dữ liệu hợp lệ
            if (!t) continue;

            let m = t.match(reCung);
            if (m && t === t.toUpperCase()) { cung = m[1].trim(); main = target = null; continue; }

            m = t.match(reHead);
            if (m) {
                cur = { so: +m[1], ten: m[2].trim(), cung: cung, quai: null, thuong: null, ha: null, coNoiDung: false,
                        dichtu: null, cach: null, tuong: null, nghia: null, khac: [] };
                ques.push(cur); main = target = null;
                if (pendingQuai) { cur.quai = pendingQuai; pendingQuai = null; }
                continue;
            }

            m = t.match(reQuai);
            if (m) {
                const q = { goc: t, thuong: soQuai(m[1]), ha: soQuai(m[2]) };
                if (cur && !cur.quai && !cur.coNoiDung) cur.quai = q; else pendingQuai = q;
                continue;
            }

            if (/^•{2,}$/.test(t)) continue;                            // dòng ngăn cách •••
            if (!cur) continue;

            if (t.charAt(0) === '|') { if (target) themBang(target, t); continue; }

            m = l.match(reNhan);
            if (m) {
                cur.coNoiDung = true;
                const loai = phanLoaiNhan(m[1]);
                if (loai) {
                    if (!cur[loai]) cur[loai] = { label: m[1].replace(/[:：\s]+$/, '').trim(), blocks: [], extras: [] };
                    main = cur[loai]; target = main;
                } else {
                    const ex = { label: m[1].replace(/[:：\s]+$/, '').trim(), blocks: [] };
                    if (main) main.extras.push(ex); else cur.khac.push(ex);
                    target = ex;
                }
                if (m[2].trim()) themDong(target, m[2]);
                continue;
            }

            cur.coNoiDung = true;
            if (target) themDong(target, l);
        }

        // chỉ mục theo (thượng, hạ)
        const byPair = {}, bySo = {};
        ques.forEach(q => {
            if (q.quai) { q.thuong = q.quai.thuong; q.ha = q.quai.ha; q.quaiGoc = q.quai.goc; }
            q.quai = q.quaiGoc || '';
            const tag = 'Quẻ ' + q.so + ' ' + q.ten;
            if (bySo[q.so]) issues.push(tag + ': trùng số thứ tự'); else bySo[q.so] = q;
            if (!q.quaiGoc) issues.push(tag + ': thiếu dòng "… thượng - … hạ"');
            else if (!q.thuong || !q.ha) issues.push(tag + ': không nhận ra tên quái ở dòng "' + q.quaiGoc + '"');
            else {
                const k = q.thuong + '-' + q.ha;
                if (byPair[k]) issues.push(tag + ': trùng cặp quái với quẻ ' + byPair[k].so); else byPair[k] = q;
            }
        });
        if (ques.length && ques.length !== 64) {
            const thieu = []; for (let n = 1; n <= 64; n++) if (!bySo[n]) thieu.push(n);
            issues.push('Có ' + ques.length + '/64 quẻ' + (thieu.length ? ' (thiếu số ' + thieu.slice(0, 6).join(', ') + (thieu.length > 6 ? '…' : '') + ')' : ''));
        }
        return { ok: true, ques: ques, byPair: byPair, bySo: bySo, issues: issues };
    }

    function plain(field) {
        if (!field) return '';
        const dong = [];
        const them = bl => bl.forEach(b => {
            if (b.t === 'li') dong.push((b.lv ? '  ' : '') + '• ' + b.x);
            else if (b.t === 'tb') b.rows.forEach(r => dong.push(r.join(' | ')));
            else dong.push(b.x);
        });
        them(field.blocks);
        (field.extras || []).forEach(e => { dong.push(e.label + ' :'); them(e.blocks); });
        return dong.join('\n');
    }
    const coNoiDung = f => !!f && (f.blocks.length > 0 || (f.extras || []).some(e => e.blocks.length > 0));


    // ---------- TẢI dữ liệu (thử lần lượt dataUrl, dataUrlDuPhong) ----------
    let _loadP = null, _dataLast = null;

    function load() {
        if (_loadP) return _loadP;
        _loadP = (async function () {
            const urls = [CONFIG.dataUrl]; if (CONFIG.dataUrlDuPhong) urls.push(CONFIG.dataUrlDuPhong);
            const loi = [];
            for (const u of urls) {
                try {
                    const r = await fetch(u, { cache: 'no-cache' });
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    const html = await r.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const kho = doc.getElementById(CONFIG.khoId);
                    if (!kho) throw new Error('không thấy khối #' + CONFIG.khoId);
                    const text = kho.textContent;
                    if (!text.trim() || /^input here$/i.test(text.trim())) throw new Error('khối dữ liệu đang trống');
                    const d = parse(text); d.nguon = u; return d;
                } catch (e) { loi.push(u + ' (' + e.message + ')'); }
            }
            _loadP = null;
            return { ok: false, loi: 'Không tải được dữ liệu: ' + loi.join('; ') + '.' };
        })();
        return _loadP;
    }

    async function getAll() { const d = await load(); return d.ok ? d.ques : { loi: d.loi }; }
    async function getQue(so) {
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return d.bySo[+so] || { loi: 'Chưa có quẻ số ' + so + ' trong dữ liệu.' };
    }
    async function getByPair(thuong, ha) {
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return d.byPair[thuong + '-' + ha] || { loi: 'Không tìm thấy quẻ ' + tenQ(thuong) + ' thượng - ' + tenQ(ha) + ' hạ trong dữ liệu.' };
    }

    // ---------- ĐỌC KHÔNG THỜI TỪ TRANG LIÊN HOA ----------
    function docTrangThai() {
        const act = document.querySelector('.tab-panel.active');
        const id = act && act.id === 'panel2' ? 'result2' : 'result1';
        const a = document.getElementById(id);
        if (!a || !a.classList.contains('visible') || !Array.isArray(a._results) || !a._results.length) return null;
        return { nguon: id, results: a._results, soKT: a._results.length };
    }

    function ky(q) {
        return { C1: q.thuong, C2: q.ha, H1: q.hoThuong, H2: q.hoHa, B1: q.bienThuong, B2: q.bienHa };
    }
    const NHOM = {
        ch: 'Chính – Hỗ (ghép chéo)',
        cb: 'Chính – Biến (quái động)',
        bb: 'Biến (đảo)'
    };
    // Các cặp quẻ kép cần tra dịch tự cho 1 Không Thời
    function cacCap(q) {
        const k = ky(q), ds = [];
        const them = function (nhom, a, b) { ds.push({ nhom: nhom, a: a, b: b, ma: a + '>' + b, ten: a + ' ➔ ' + b, thuong: k[a], ha: k[b] }); };
        them('ch', 'C1', 'H1'); them('ch', 'H1', 'C1');
        them('ch', 'C2', 'H2'); them('ch', 'H2', 'C2');
        them('ch', 'C1', 'H2'); them('ch', 'H2', 'C1');
        them('ch', 'H1', 'C2'); them('ch', 'C2', 'H1');
        if (q.hao >= 4) { them('cb', 'C1', 'B1'); them('cb', 'B1', 'C1'); }      // quái thượng động
        else { them('cb', 'C2', 'B2'); them('cb', 'B2', 'C2'); }                  // quái hạ động
        them('bb', 'B2', 'B1');
        return ds;
    }

    async function getCapKT(i) {
        if (!cur || !cur.results[i - 1]) return { loi: 'Không có Không Thời ' + i + '.' };
        const q = cur.results[i - 1];
        const cap = cacCap(q);
        const ques = await Promise.all(cap.map(c => getByPair(c.thuong, c.ha)));
        return { kt: i, hao: q.hao, ky: ky(q), cap: cap.map((c, j) => Object.assign({}, c, ques[j].loi ? { loi: ques[j].loi } : { que: ques[j] })) };
    }
    async function getAllCapKT() {
        if (!cur) return [];
        return Promise.all(cur.results.map((q, i) => getCapKT(i + 1)));
    }

    // ---------- TRẠNG THÁI GIAO DIỆN ----------
    let cur = null, curSig = '', ktSel = 1;
    let tick = [];
    const thuGon = {};
    const listeners = [];
    let bodyEl = null, ketQuaEl = null;

    function docLuu() {
        try {
            const v = JSON.parse(root.localStorage.getItem(CONFIG.khoa) || '[]');
            return Array.isArray(v) ? v.filter(x => CHON.some(m => m.key === x)) : [];
        } catch (e) { return []; }
    }
    function ghiLuu() { try { root.localStorage.setItem(CONFIG.khoa, JSON.stringify(tick)); } catch (e) {} }

    function themCss() {
        if (document.getElementById('dtpCss')) return;
        const st = document.createElement('style');
        st.id = 'dtpCss';
        st.textContent =
            '.dp-box{margin-top:24px;border-top:1px solid var(--border,#5c3d1e);padding-top:20px}' +
            '.dp-title{font-family:"Cinzel Decorative",serif;font-size:.95rem;color:var(--gold-light,#e8b84b);margin-bottom:12px}' +
            '.dp-empty{font-size:.85rem;color:#888;text-align:center}' +
            '.dp-lbl{font-size:.7rem;font-weight:600;color:#aaa;text-transform:uppercase;margin:12px 0 6px}' +
            '.dp-nums{display:flex;flex-wrap:wrap;gap:6px}' +
            '.dp-n{min-width:42px;padding:8px 6px;background:transparent;color:var(--gold-light,#e8b84b);border:1px solid var(--gold,#c9922a);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer}' +
            '.dp-n.on{background:var(--gold,#c9922a);color:#000}' +
            '.dp-info{font-size:.78rem;color:var(--text,#e8d9c0);line-height:1.6;margin:10px 0 0;padding:8px 10px;background:rgba(0,0,0,.25);border:1px solid rgba(92,61,30,.5);border-radius:6px}' +
            '.dp-info b{color:var(--gold-light,#e8b84b)}' +
            '.dp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}' +
            '.dp-chip{padding:9px 3px;background:#252525;color:#bbb;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:.8rem;text-align:center;cursor:pointer}' +
            '.dp-chip.on{background:var(--gold,#c9922a);color:#000;border-color:var(--gold,#c9922a);font-weight:700}' +
            '.dp-tools{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}' +
            '.dp-mini{padding:6px 10px;background:transparent;color:var(--gold,#c9922a);border:1px solid #555;border-radius:8px;font-family:inherit;font-size:.72rem;cursor:pointer}' +
            '.dp-dem{font-size:.7rem;color:#888;margin-left:auto}' +
            '.dp-note{font-size:.7rem;color:#c9a14a;margin-top:8px;line-height:1.4}' +
            '.dp-panel{margin-top:10px;border:1px solid var(--gold,#c9922a);border-radius:10px;overflow:hidden;background:#201a14}' +
            '.dp-ph{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:#2a2118;color:var(--gold-light,#e8b84b);font-weight:600;font-size:.9rem}' +
            '.dp-ph span:last-child,.dp-sh span:last-child{font-size:.68rem;font-weight:400;color:#aaa;white-space:nowrap}' +
            '.dp-pb{padding:6px 8px 8px}' +
            '.dp-gl{font-size:.68rem;font-weight:700;color:#6fdc9a;text-transform:uppercase;margin:12px 2px 2px}' +
            '.dp-meta{font-size:.7rem;color:#9aa;margin:2px 2px 6px}' +
            '.dp-sub{margin-top:6px;border:1px solid #3a3a3a;border-radius:8px;overflow:hidden;background:#1a1612}' +
            '.dp-sh{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;background:#2c2620;color:#6fdc9a;font-size:.82rem;font-weight:600}' +
            '.dp-sb{padding:8px 10px;font-size:.82rem;line-height:1.55;color:#eee}' +
            '.dp-p{margin:0 0 6px 0;word-break:break-word}' +
            '.dp-li{margin:0 0 4px 0;padding-left:14px;position:relative;word-break:break-word}' +
            '.dp-li::before{content:"•";position:absolute;left:0;color:var(--gold,#c9922a)}' +
            '.dp-li.l2{margin-left:16px}.dp-li.l2::before{content:"◦"}' +
            '.dp-ex{margin-top:8px;padding:6px 8px;border-left:2px solid #6fdc9a;background:#211d18;border-radius:4px}' +
            '.dp-ex .dp-exl{font-size:.7rem;font-weight:700;color:#6fdc9a;margin-bottom:4px}' +
            '.dp-tb{border-collapse:collapse;margin:4px 0;font-size:.78rem}' +
            '.dp-tb td{border:1px solid #444;padding:3px 8px}' +
            '.dp-rong{font-size:.8rem;color:#e08a73;font-style:italic}' +
            '.dp-miss{font-size:.78rem;color:#e08a8a;font-style:italic;padding:6px 4px}' +
            '.dp-collapsed>.dp-pb,.dp-collapsed>.dp-sb{display:none}' +
            '@media(max-width:340px){.dp-grid{grid-template-columns:repeat(2,1fr)}}';
        document.head.appendChild(st);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
    // **đậm** và *nghiêng* trong dữ liệu
    function veInline(parent, text) {
        String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach(p => {
            if (!p) return;
            if (p.length > 4 && p.indexOf('**') === 0 && p.slice(-2) === '**') parent.appendChild(el('b', null, p.slice(2, -2)));
            else if (p.length > 2 && p.charAt(0) === '*' && p.slice(-1) === '*') parent.appendChild(el('i', null, p.slice(1, -1)));
            else parent.appendChild(document.createTextNode(p));
        });
    }
    function veBlocks(parent, blocks) {
        blocks.forEach(b => {
            if (b.t === 'tb') {
                const tb = el('table', 'dp-tb');
                b.rows.forEach(r => { const tr = el('tr'); r.forEach(c => tr.appendChild(el('td', null, c))); tb.appendChild(tr); });
                parent.appendChild(tb);
            } else {
                const d = el('div', b.t === 'li' ? 'dp-li' + (b.lv ? ' l2' : '') : 'dp-p');
                veInline(d, b.x);
                parent.appendChild(d);
            }
        });
    }
    function veMuc(parent, field) {
        if (!coNoiDung(field)) { parent.appendChild(el('div', 'dp-rong', 'Rỗng')); return; }
        veBlocks(parent, field.blocks);
        (field.extras || []).forEach(e => {
            if (!e.blocks.length) return;
            const x = el('div', 'dp-ex');
            x.appendChild(el('div', 'dp-exl', e.label));
            veBlocks(x, e.blocks);
            parent.appendChild(x);
        });
    }

    function khoiGap(loai, id, tieu, phu, noiDung) {
        const box = el('div', loai === 'q' ? 'dp-panel' : 'dp-sub');
        if (thuGon[id]) box.classList.add('dp-collapsed');
        const h = el('div', loai === 'q' ? 'dp-ph' : 'dp-sh');
        h.appendChild(el('span', null, tieu));
        const mui = el('span', null, (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn'));
        h.appendChild(mui);
        h.onclick = function () {
            thuGon[id] = !thuGon[id];
            box.classList.toggle('dp-collapsed', !!thuGon[id]);
            mui.textContent = (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn');
        };
        const b = el('div', loai === 'q' ? 'dp-pb' : 'dp-sb');
        noiDung(b);
        box.appendChild(h); box.appendChild(b);
        return box;
    }

    function ghiChuDuLieu() {
        if (!_dataLast || !_dataLast.ok || !_dataLast.issues.length) return null;
        const n = _dataLast.issues.length;
        return '⚠ Dữ liệu có ' + n + ' điểm cần xem: ' + _dataLast.issues.slice(0, 3).join(' ; ') + (n > 3 ? ' …' : '');
    }


    function taoPanel(c) {
        const que = _dataLast.byPair[c.thuong + '-' + c.ha];
        const khoa = ktSel + ':' + c.ma;
        const pid = 'p:' + khoa;
        if (!(pid in thuGon)) thuGon[pid] = true;                     // mặc định thu gọn
        const tieu = c.ten + ' · ' + (que ? que.ten : tenQ(c.thuong) + '/' + tenQ(c.ha));
        return khoiGap('q', pid, tieu, que ? 'Quẻ ' + que.so : 'không thấy', function (b) {
            if (!que) {
                b.appendChild(el('div', 'dp-miss', 'Không tìm thấy quẻ ' + tenQ(c.thuong) + ' thượng - ' + tenQ(c.ha) + ' hạ trong dữ liệu.'));
                return;
            }
            b.appendChild(el('div', 'dp-meta', c.a + ' ' + tenQ(c.thuong) + ' thượng - ' + c.b + ' ' + tenQ(c.ha) + ' hạ' + (que.cung ? ' · Cung ' + que.cung.replace(/^CUNG\s+/i, '') : '')));
            const hien = [MUC[0]].concat(CHON.filter(m => tick.indexOf(m.key) > -1));
            hien.forEach(m => {
                const f = que[m.key];
                b.appendChild(khoiGap('f', 'f:' + khoa + ':' + m.key, m.ten, coNoiDung(f) ? '' : 'Rỗng', function (sb) { veMuc(sb, f); }));
            });
        });
    }

    function datTatCa(v) {
        cacCap(cur.results[ktSel - 1]).forEach(c => {
            const khoa = ktSel + ':' + c.ma;
            thuGon['p:' + khoa] = v;
            MUC.forEach(m => { thuGon['f:' + khoa + ':' + m.key] = v; });
        });
        veKetQua();
    }

    function veKetQua() {
        if (!ketQuaEl) return;
        ketQuaEl.innerHTML = '';
        if (!_dataLast) { ketQuaEl.appendChild(el('div', 'dp-note', 'Đang tải dữ liệu…')); return; }
        if (!_dataLast.ok) { ketQuaEl.appendChild(el('div', 'dp-miss', _dataLast.loi)); return; }
        const tools = el('div', 'dp-tools');
        const g = el('button', 'dp-mini', 'Thu gọn tất cả'); g.type = 'button';
        const m = el('button', 'dp-mini', 'Mở rộng tất cả'); m.type = 'button';
        g.onclick = function () { datTatCa(true); };
        m.onclick = function () { datTatCa(false); };
        tools.appendChild(g); tools.appendChild(m);
        ketQuaEl.appendChild(tools);
        let nhomTruoc = '';
        cacCap(cur.results[ktSel - 1]).forEach(c => {
            if (c.nhom !== nhomTruoc) { ketQuaEl.appendChild(el('div', 'dp-gl', NHOM[c.nhom])); nhomTruoc = c.nhom; }
            ketQuaEl.appendChild(taoPanel(c));
        });
    }

    function datTick(ds) {
        tick = CHON.filter(m => ds.indexOf(m.key) > -1).map(m => m.key);
        ghiLuu(); render();
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        ketQuaEl = null;
        if (!cur) { bodyEl.appendChild(el('div', 'dp-empty', 'Chưa lập quẻ. Hãy nhập số và bấm "Lập Quẻ" ở phía trên.')); return; }

        const n = cur.soKT, q = cur.results[ktSel - 1], k = ky(q);
        bodyEl.appendChild(el('div', 'dp-lbl', 'Chọn Không Thời (' + n + ' Không Thời)'));
        const nums = el('div', 'dp-nums');
        for (let i = 1; i <= n; i++) {
            const b = el('button', 'dp-n' + (i === ktSel ? ' on' : ''), String(i));
            b.type = 'button';
            b.onclick = function () { ktSel = i; render(); emit(); };
            nums.appendChild(b);
        }
        bodyEl.appendChild(nums);

        const info = el('div', 'dp-info');
        info.innerHTML = '<b>Không Thời ' + ktSel + (ktSel === 1 ? ' (quẻ chính)' : '') + '</b> · hào động ' + q.hao +
            ' (' + (q.hao >= 4 ? 'thượng quái động: C1 ➔ B1' : 'hạ quái động: C2 ➔ B2') + ')' +
            '<br>C1 ' + tenQ(k.C1) + ' · C2 ' + tenQ(k.C2) + ' | H1 ' + tenQ(k.H1) + ' · H2 ' + tenQ(k.H2) + ' | B1 ' + tenQ(k.B1) + ' · B2 ' + tenQ(k.B2);
        bodyEl.appendChild(info);

        bodyEl.appendChild(el('div', 'dp-lbl', 'Tích chọn mục (Dịch tự luôn hiển thị)'));
        const g = el('div', 'dp-grid');
        CHON.forEach(m => {
            const c = el('button', 'dp-chip' + (tick.indexOf(m.key) > -1 ? ' on' : ''), m.ten);
            c.type = 'button';
            c.onclick = function () {
                const i = tick.indexOf(m.key);
                if (i > -1) tick.splice(i, 1); else tick.push(m.key);
                ghiLuu(); c.classList.toggle('on', tick.indexOf(m.key) > -1); capDem(); veKetQua();
            };
            g.appendChild(c);
        });
        bodyEl.appendChild(g);
        const tl = el('div', 'dp-tools');
        const a = el('button', 'dp-mini', 'Chọn tất cả'); a.type = 'button';
        a.onclick = function () { datTick(CHON.map(m => m.key)); };
        const b2 = el('button', 'dp-mini', 'Bỏ chọn'); b2.type = 'button';
        b2.onclick = function () { datTick([]); };
        const dem = el('span', 'dp-dem');
        const capDem = function () { dem.textContent = 'Đã chọn: ' + tick.length + '/3'; };
        tl.appendChild(a); tl.appendChild(b2); tl.appendChild(dem);
        bodyEl.appendChild(tl);
        capDem();

        const gc = ghiChuDuLieu();
        if (gc) bodyEl.appendChild(el('div', 'dp-note', gc));

        ketQuaEl = el('div');
        bodyEl.appendChild(ketQuaEl);
        veKetQua();
    }

    function emit() {
        listeners.forEach(fn => { try { fn(cur); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('dichtuplus:change', { detail: { state: cur, kt: ktSel } })); } catch (e) {}
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? st.nguon + '#' + st.results.map(q => [q.thuong, q.ha, q.hao, q.hoThuong, q.hoHa, q.bienThuong, q.bienHa].join(',')).join('|') : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        ktSel = 1;
        render();
        emit();
    }

    // ---------- GẮN VÀO TRANG LIÊN HOA ----------
    function bao(ten) {
        if (typeof root[ten] !== 'function' || root[ten].__dtp) return;
        const goc = root[ten];
        const w = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        w.__dtp = true;
        root[ten] = w;
    }

    function khoiTao() {
        if (document.getElementById('dtpBody')) return;
        themCss();
        tick = docLuu();
        const box = el('div', 'dp-box');
        box.innerHTML = '<div class="dp-title">' + CONFIG.tieuDe + '</div><div id="dtpBody"></div>';
        (document.querySelector('.container') || document.body).appendChild(box);
        bodyEl = document.getElementById('dtpBody');
        ['renderResults', 'clearAll', 'switchTab'].forEach(bao);
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            ['result1', 'result2'].forEach(id => {
                const a = document.getElementById(id);
                if (a) mo.observe(a, { attributes: true, attributeFilter: ['class'], childList: true });
            });
        } catch (e) {}
        capNhat(true);
        root.DichTuPlus.ready.then(d => { _dataLast = d; render(); });
    }

    root.DichTuPlus = {
        version: '1.0', CONFIG: CONFIG, MUC: MUC,
        ready: load(), load: load,
        getAll: getAll, getQue: getQue, getByPair: getByPair,
        getCapKT: getCapKT, getAllCapKT: getAllCapKT,
        plain: plain,
        getState: function () { return cur ? { nguon: cur.nguon, results: cur.results, soKT: cur.soKT, kt: ktSel } : null; },
        selectKT: function (i) { if (cur && i >= 1 && i <= cur.soKT) { ktSel = i; render(); emit(); } },
        getTicked: function () { return tick.slice(); },
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parse: parse, cacCap: cacCap }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);
