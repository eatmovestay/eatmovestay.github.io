// =========================================================
//  THEDUNG.JS — Module "Thể Dụng · 64 Quẻ" (v1.0) cho trang Liên Hoa Độn Pháp
//  Dữ liệu: thedung.html (cùng thư mục), khối nằm trong <pre> (hoặc <script type="text/plain">).
//
//  Cách hoạt động:
//   • Tự lấy các Không Thời từ trang Liên Hoa ("Lập Quẻ"): 5 / 9 / 13 Không Thời. Nút số để chọn.
//   • Mỗi Không Thời có 3 quẻ kép Chính – Hỗ – Biến. Tìm quẻ trong thedung.html theo dòng
//     "Quái tượng: Thượng X hạ Y".
//   • Thể / Dụng đề xuất: Dụng = vị trí quái đơn ĐỘNG của quẻ Chính (hào 1–3 → hạ, hào 4–6 → thượng),
//     Thể = vị trí còn lại; áp dụng cùng vị trí cho cả 3 quẻ kép.
//       Thượng = Thể, Hạ = Dụng  → dùng dữ liệu P1
//       Thượng = Dụng, Hạ = Thể  → dùng dữ liệu P2
//     Chiều đề xuất được bật sẵn; có thể bật thêm chiều còn lại để tham khảo.
//   • Lưới 6 ô tích chọn: Thông tin chung · Sơ lược · Ý 1 · Ý 2 · Ý 3 · Nhận diện.
//   • Mọi khung thu gọn / mở rộng được. Mục thiếu hiện "Rỗng"; quẻ chưa nạp thì báo "chưa nạp".
//
//  Cách đọc thedung.html:
//   • Tiêu đề quẻ "số. Tên quẻ :" → "**Tên quẻ**" + "Quái tượng: Thượng X hạ Y." + thông tin chung
//     (dừng ở dòng "P1.").
//   • "P1. Thể X – Dụng Y :" + dòng "(☰ X thượng / ☰ Y hạ)" + Sơ lược (dừng ở "**1. …").
//     Ý 1 = "**1. …", Ý 2 = "**2. …", Ý 3 = "**Tóm tắt chiều P1**" / "**3. Tóm tắt chiều P2**".
//   • "P2. …" cùng cấu trúc (chiều Thượng = Dụng, Hạ = Thể).
//   • "P3. Nhận diện :" dừng khi gặp tiêu đề quẻ khác, dòng *** hoặc hết dữ liệu.
//   • Dấu "<!--", "-->" và dòng chỉ có mũi tên (→) bị bỏ qua. (Nếu <!-- không đóng thì trình duyệt sẽ
//     ẩn dữ liệu khi mở thedung.html, nhưng module vẫn đọc được vì đọc thẳng nội dung file.)
//
//  Phụ thuộc: chỉ trang Liên Hoa (renderResults, clearAll, switchTab, #result1, #result2).
//
//  Cho module khác dùng (window.TheDung):
//    TheDung.ready                   -> Promise<{ok, ques, issues, thongKe}|{ok:false, loi}>
//    TheDung.getByPair(1, 5)         -> Promise<quẻ|{loi}>   (quái thượng, hạ theo số Liên Hoa: 1 Kiền … 8 Khôn)
//    TheDung.getQue(1), getAll()
//    TheDung.getKhongThoi(i)         -> Promise<{kt, hao, dungViTri, cap:[{vt, role, thuong, ha, the, dung, chieuMacDinh, que|loi}]}>
//    TheDung.getAllKhongThoi()
//    TheDung.section(quẻ, 'P1', 'y2')-> {tieuDe, blocks} | null   (chiều 'P1'|'P2'; mục 'soluoc'|'y1'|'y2'|'y3')
//    TheDung.plain(section)          -> text thuần
//    quẻ = { so, ten, quai, thuong, ha, chung, P1, P2, nhanDien }
//    TheDung.getState(), selectKT(i), getTicked(), onChange(fn), sự kiện 'thedung:change'
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'thedung.html', tieuDe: 'Thể Dụng · 64 Quẻ', khoa: 'td_chon' };
    const TEN_LH = ['', 'Kiền', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'];
    const tenQ = n => TEN_LH[n] || '?';
    const QUAI_SO = { 'CÀN': 1, 'KIỀN': 1, 'ĐOÀI': 2, 'LY': 3, 'CHẤN': 4, 'TỐN': 5, 'KHẢM': 6, 'CẤN': 7, 'KHÔN': 8 };

    // 6 ô tích chọn
    const MUC = [
        { key: 'chung', ngan: 'Thông tin chung', ten: 'Thông tin chung của quẻ' },
        { key: 'soluoc', ngan: 'Sơ lược', ten: 'Mục Sơ Lược' },
        { key: 'y1', ngan: 'Ý 1 · Bản chất', ten: 'Ý 1: Bản chất tương tác năng lượng' },
        { key: 'y2', ngan: 'Ý 2 · Đời sống', ten: 'Ý 2: Map vào các phạm vi thực tế đời sống' },
        { key: 'y3', ngan: 'Ý 3 · Tóm tắt', ten: 'Ý 3: Tóm tắt chiều' },
        { key: 'nhandien', ngan: 'Nhận diện', ten: 'Nhận diện (P3)' }
    ];

    function boDau(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    function soQuai(t) {
        const s = String(t || '').normalize('NFC').replace(/[.,;:]+$/, '').trim().toUpperCase();
        if (QUAI_SO[s]) return QUAI_SO[s];
        const b = boDau(s), v = [];
        Object.keys(QUAI_SO).forEach(k => { if (boDau(k) === b && v.indexOf(QUAI_SO[k]) < 0) v.push(QUAI_SO[k]); });
        return v.length === 1 ? v[0] : null;
    }

    // ---------- PHÂN TÍCH thedung.html ----------
    const reBoLine = /^\s*\*\*([^*]+?)\*\*\s*(?:[:：]\s*)?\.?\s*$/;         // dòng chỉ có chữ đậm = tiêu đề nhỏ

    function toBlocks(lines) {
        const out = [];
        lines.forEach(raw => {
            const s = String(raw).replace(/\s+$/, '').trim();
            if (!s) return;
            let m = s.match(reBoLine);
            if (m) { out.push({ t: 'h', x: m[1].replace(/[:：\s]+$/, '').trim() }); return; }
            m = s.match(/^[-•]\s+(.*)$/);
            if (m) { out.push({ t: 'li', x: m[1].trim() }); return; }
            out.push({ t: 'p', x: s });
        });
        return out;
    }
    const coBlocks = sec => !!sec && sec.blocks && sec.blocks.length > 0;

    function tachParen(s) {      // "(☰ Càn thượng / ☰ Càn hạ)" -> { thuong: 'Càn', ha: 'Càn' }
        const m = String(s).match(/\(([^)]*)\)/);
        if (!m) return null;
        const r = {};
        m[1].split('/').forEach(p => {
            const w = p.trim().split(/\s+/);
            const nhan = (w[w.length - 1] || '').toLowerCase();
            const ten = w[w.length - 2];
            if (nhan === 'thượng') r.thuong = ten; else if (nhan === 'hạ') r.ha = ten;
        });
        return (r.thuong && r.ha) ? r : null;
    }

    function tachChieu(lines, tenChieu) {
        const i1 = lines.findIndex(l => /^\s*\*\*\s*1\.\s/.test(l));
        const i2 = i1 < 0 ? -1 : lines.findIndex((l, i) => i > i1 && /^\s*\*\*\s*2\.\s/.test(l));
        const i3 = i2 < 0 ? -1 : lines.findIndex((l, i) => i > i2 && /^\s*\*\*\s*(?:3\.\s*)?Tóm\s*tắt/i.test(l));
        const tieuDeY = l => l.trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*\s*[:：]?\s*\.?\s*$/, '').replace(/[:：]\s*$/, '').trim();
        const cat = (a, b) => lines.slice(a, b < 0 ? lines.length : b);
        const ch = { tieu: tenChieu, soluoc: null, y1: null, y2: null, y3: null };
        const dauY = [i1, i2, i3].filter(x => x >= 0);
        const heSoLuoc = dauY.length ? dauY[0] : lines.length;
        ch.soluoc = { tieuDe: 'Sơ lược', blocks: toBlocks(lines.slice(0, heSoLuoc)) };
        const mk = (i, next) => i < 0 ? null : { tieuDe: tieuDeY(lines[i]), blocks: toBlocks(cat(i + 1, next)) };
        const nextAfter = i => { const c = dauY.filter(x => x > i); return c.length ? c[0] : -1; };
        ch.y1 = mk(i1, nextAfter(i1));
        ch.y2 = mk(i2, nextAfter(i2));
        ch.y3 = mk(i3, -1);
        return ch;
    }

    function dungQue(q) {
        const L = q.lines;
        const pos = {};
        L.forEach((l, i) => { const m = l.trim().match(/^P([123])\s*\.\s*(.*?)\s*:?\s*$/); if (m && !('p' + m[1] in pos)) pos['p' + m[1]] = { i: i, ten: m[2] }; });
        const moc = Object.keys(pos).map(k => pos[k].i).sort((a, b) => a - b);
        const dau = moc.length ? moc[0] : L.length;
        const sau = i => { const c = moc.filter(x => x > i); return c.length ? c[0] : L.length; };

        // thông tin chung: bỏ dòng tên đậm "**Tên quẻ**"
        const chungL = L.slice(0, dau).filter((l, i) => !(i < 3 && /^\s*\*\*[^*]+\*\*\s*\.?\s*$/.test(l) && l.replace(/[*\s.]/g, '').toLowerCase() === q.ten.replace(/\s/g, '').toLowerCase()));
        q.chung = { tieuDe: 'Thông tin chung', blocks: toBlocks(chungL) };

        const dong = chungL.find(l => /Quái\s*tượng\s*:/i.test(l));
        if (dong) {
            const m = dong.match(/Thượng\s+(\S+?)\s+hạ\s+(\S+?)\s*\.?\s*$/i);
            if (m) { q.quai = dong.replace(/^\s*Quái\s*tượng\s*:\s*/i, '').replace(/[.\s]+$/, ''); q.thuong = soQuai(m[1]); q.ha = soQuai(m[2]); }
        }
        ['p1', 'p2'].forEach(k => {
            const p = pos[k];
            const ten = k.toUpperCase();
            if (!p) { q[ten] = null; return; }
            const lines = L.slice(p.i + 1, sau(p.i));
            q[ten] = tachChieu(lines, p.ten || ten);
            if (!q.thuong && k === 'p1') {
                const dongP = lines.find(l => l.trim().charAt(0) === '(');
                const pr = dongP && tachParen(dongP);
                if (pr) { q.thuong = soQuai(pr.thuong); q.ha = soQuai(pr.ha); q.quai = 'Thượng ' + pr.thuong + ' hạ ' + pr.ha; }
            }
        });
        const p3 = pos.p3;
        q.nhanDien = p3 ? { tieuDe: p3.ten || 'Nhận diện', blocks: toBlocks(L.slice(p3.i + 1, sau(p3.i))) } : null;
        delete q.lines;
    }

    function parse(text) {
        const issues = [], ques = [];
        const reHead = /^\s*(\d{1,3})\.\s+(.+?)\s*:\s*$/;
        const reRao = /^\s*\*{3,}\s*$/;
        const reHet = /^\s*\*{2,}\s*HẾT\s*\*{2,}\s*$/i;
        let cur = null;
        String(text || '').replace(/\r/g, '').split('\n').forEach(l => {
            if (reHet.test(l)) { cur = null; return; }
            if (reRao.test(l)) { cur = null; return; }
            const m = l.match(reHead);
            if (m && !/^\s*P\d/.test(l)) {
                cur = { so: +m[1], ten: m[2].replace(/\*+/g, '').trim(), quai: '', thuong: null, ha: null, lines: [] };
                ques.push(cur); return;
            }
            if (!cur) return;
            if (/^\s*(→|->|-->|<!--)+\s*$/.test(l)) return;
            cur.lines.push(l);
        });

        const byPair = {}, bySo = {};
        ques.forEach(q => {
            dungQue(q);
            const tag = 'Quẻ ' + q.so + ' ' + q.ten;
            if (bySo[q.so]) issues.push(tag + ': trùng số thứ tự'); else bySo[q.so] = q;
            if (!q.thuong || !q.ha) issues.push(tag + ': thiếu dòng "Quái tượng: Thượng … hạ …"');
            else {
                const k = q.thuong + '-' + q.ha;
                if (byPair[k]) issues.push(tag + ': trùng cặp quái với quẻ ' + byPair[k].so); else byPair[k] = q;
            }
            if (!q.P1) issues.push(tag + ': thiếu P1');
            if (!q.P2) issues.push(tag + ': thiếu P2');
            if (!q.nhanDien) issues.push(tag + ': thiếu P3 Nhận diện');
        });
        const thongKe = 'Đã nạp ' + ques.length + '/64 quẻ' + (ques.length ? ' (số ' + ques.map(q => q.so).join(', ') + ')' : '');
        return { ok: true, ques: ques, byPair: byPair, bySo: bySo, issues: issues, thongKe: thongKe };
    }

    function plain(sec) {
        if (!sec) return '';
        const d = [];
        if (sec.tieuDe) d.push(sec.tieuDe);
        (sec.blocks || []).forEach(b => d.push(b.t === 'li' ? '• ' + b.x : b.x));
        return d.join('\n');
    }
    function section(que, chieu, muc) {
        if (!que) return null;
        if (muc === 'chung') return que.chung;
        if (muc === 'nhandien') return que.nhanDien;
        const c = que[String(chieu).toUpperCase()];
        return c ? c[muc] : null;
    }

    // ---------- TẢI thedung.html ----------
    function layKho(html) {
        const sc = html.match(/<script[^>]*type=["']text\/plain["'][^>]*>([\s\S]*?)(?:<\/script>|$)/i);
        let raw;
        if (sc) raw = sc[1];
        else {
            const m = html.match(/<pre[^>]*>/i);
            const start = m ? m.index + m[0].length : 0;
            const end = html.lastIndexOf('</pre>');
            raw = html.slice(start, end > start ? end : html.length);
        }
        raw = raw.replace(/<!--/g, '').replace(/-->/g, '').replace(/<\/?(?:body|html|pre)[^>]*>/gi, '');
        const ta = document.createElement('textarea');       // giải mã &amp; &lt; … (textarea không chạy script)
        ta.innerHTML = raw;
        return ta.value;
    }

    let _loadP = null, _dataLast = null;
    function load() {
        if (_loadP) return _loadP;
        _loadP = fetch(CONFIG.dataUrl, { cache: 'no-cache' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(html => {
                const text = layKho(html);
                if (!text.trim() || /^input here$/i.test(text.trim())) throw new Error('khối dữ liệu đang trống');
                return parse(text);
            })
            .catch(e => { _loadP = null; return { ok: false, loi: 'Không tải được ' + CONFIG.dataUrl + ' (' + e.message + ').' }; });
        return _loadP;
    }

    async function getAll() { const d = await load(); return d.ok ? d.ques : { loi: d.loi }; }
    async function getQue(so) {
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return d.bySo[+so] || { loi: 'Chưa nạp quẻ số ' + so + ' trong ' + CONFIG.dataUrl + '.' };
    }
    async function getByPair(thuong, ha) {
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return d.byPair[thuong + '-' + ha] || { loi: 'Chưa nạp quẻ ' + tenQ(thuong) + ' thượng - ' + tenQ(ha) + ' hạ trong ' + CONFIG.dataUrl + '.' };
    }

    // ---------- ĐỌC KHÔNG THỜI TỪ TRANG LIÊN HOA ----------
    function docTrangThai() {
        const act = document.querySelector('.tab-panel.active');
        const id = act && act.id === 'panel2' ? 'result2' : 'result1';
        const a = document.getElementById(id);
        if (!a || !a.classList.contains('visible') || !Array.isArray(a._results) || !a._results.length) return null;
        return { nguon: id, results: a._results, soKT: a._results.length };
    }

    // Dụng = vị trí quái đơn động của quẻ Chính: hào 4–6 → thượng, hào 1–3 → hạ.
    function theDung(q, thuong, ha) {
        const dungViTri = q.hao >= 4 ? 'thuong' : 'ha';
        const theViTri = dungViTri === 'thuong' ? 'ha' : 'thuong';
        const so = vt => vt === 'thuong' ? thuong : ha;
        return {
            dungViTri: dungViTri, theViTri: theViTri,
            the: { viTri: theViTri, so: so(theViTri) }, dung: { viTri: dungViTri, so: so(dungViTri) },
            chieuMacDinh: theViTri === 'thuong' ? 'P1' : 'P2'      // Thượng = Thể → P1 ; Thượng = Dụng → P2
        };
    }
    function bo3(q) {
        return [
            { vt: 'chinh', role: 'Chính', thuong: q.thuong, ha: q.ha },
            { vt: 'ho', role: 'Hỗ', thuong: q.hoThuong, ha: q.hoHa },
            { vt: 'bien', role: 'Biến', thuong: q.bienThuong, ha: q.bienHa }
        ].map(x => Object.assign(x, theDung(q, x.thuong, x.ha)));
    }
    async function getKhongThoi(i) {
        if (!cur || !cur.results[i - 1]) return { loi: 'Không có Không Thời ' + i + '.' };
        const q = cur.results[i - 1];
        const cap = bo3(q);
        const ques = await Promise.all(cap.map(x => getByPair(x.thuong, x.ha)));
        return { kt: i, hao: q.hao, dungViTri: q.hao >= 4 ? 'thuong' : 'ha',
                 cap: cap.map((x, j) => Object.assign({}, x, ques[j].loi ? { loi: ques[j].loi } : { que: ques[j] })) };
    }
    async function getAllKhongThoi() {
        if (!cur) return [];
        return Promise.all(cur.results.map((q, i) => getKhongThoi(i + 1)));
    }

    // ---------- TRẠNG THÁI GIAO DIỆN ----------
    let cur = null, curSig = '', ktSel = 1;
    let tick = [];
    const chieuSel = {};            // 'kt:vt' -> mảng ['P1','P2'] đang bật (chưa có = dùng đề xuất)
    const thuGon = {};
    let ids = [];
    const listeners = [];
    let bodyEl = null, ketQuaEl = null;

    function docLuu() {
        try {
            const v = JSON.parse(root.localStorage.getItem(CONFIG.khoa) || '[]');
            return Array.isArray(v) ? v.filter(x => MUC.some(m => m.key === x)) : [];
        } catch (e) { return []; }
    }
    function ghiLuu() { try { root.localStorage.setItem(CONFIG.khoa, JSON.stringify(tick)); } catch (e) {} }

    function themCss() {
        if (document.getElementById('tdCss')) return;
        const st = document.createElement('style');
        st.id = 'tdCss';
        st.textContent =
            '.td-box{margin-top:24px;border-top:1px solid var(--border,#5c3d1e);padding-top:20px}' +
            '.td-title{font-family:"Cinzel Decorative",serif;font-size:.95rem;color:var(--gold-light,#e8b84b);margin-bottom:12px}' +
            '.td-empty{font-size:.85rem;color:#888;text-align:center}' +
            '.td-lbl{font-size:.7rem;font-weight:600;color:#aaa;text-transform:uppercase;margin:12px 0 6px}' +
            '.td-nums{display:flex;flex-wrap:wrap;gap:6px}' +
            '.td-n{min-width:42px;padding:8px 6px;background:transparent;color:var(--gold-light,#e8b84b);border:1px solid var(--gold,#c9922a);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer}' +
            '.td-n.on{background:var(--gold,#c9922a);color:#000}' +
            '.td-info{font-size:.78rem;color:var(--text,#e8d9c0);line-height:1.6;margin:10px 0 0;padding:8px 10px;background:rgba(0,0,0,.25);border:1px solid rgba(92,61,30,.5);border-radius:6px}' +
            '.td-info b{color:var(--gold-light,#e8b84b)}' +
            '.td-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}' +
            '.td-chip{padding:9px 3px;background:#252525;color:#bbb;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:.74rem;line-height:1.2;text-align:center;cursor:pointer;min-height:38px;display:flex;align-items:center;justify-content:center}' +
            '.td-chip.on{background:var(--gold,#c9922a);color:#000;border-color:var(--gold,#c9922a);font-weight:700}' +
            '.td-tools{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}' +
            '.td-mini{padding:6px 10px;background:transparent;color:var(--gold,#c9922a);border:1px solid #555;border-radius:8px;font-family:inherit;font-size:.72rem;cursor:pointer}' +
            '.td-dem{font-size:.7rem;color:#888;margin-left:auto}' +
            '.td-note{font-size:.7rem;color:#c9a14a;margin-top:8px;line-height:1.4}' +
            '.td-stat{font-size:.7rem;color:#8a7a65;margin-top:8px}' +
            '.td-panel{margin-top:10px;border:1px solid var(--gold,#c9922a);border-radius:10px;overflow:hidden;background:#201a14}' +
            '.td-ph{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:#2a2118;color:var(--gold-light,#e8b84b);font-weight:600;font-size:.9rem}' +
            '.td-ph span:last-child,.td-sh span:last-child{font-size:.68rem;font-weight:400;color:#aaa;white-space:nowrap}' +
            '.td-pb{padding:6px 8px 8px}' +
            '.td-meta{font-size:.7rem;color:#9aa;margin:2px 2px 4px;line-height:1.5}' +
            '.td-de{font-size:.74rem;color:#6fdc9a;margin:2px 2px 8px;line-height:1.5}' +
            '.td-ch{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 6px}' +
            '.td-chb{flex:1;min-width:120px;padding:8px 6px;background:transparent;color:#6fdc9a;border:1px solid #2e5e45;border-radius:8px;font-family:inherit;font-size:.72rem;font-weight:600;line-height:1.3;cursor:pointer}' +
            '.td-chb.on{background:#2e5e45;color:#fff}' +
            '.td-gl{font-size:.68rem;font-weight:700;color:#6fdc9a;text-transform:uppercase;margin:12px 2px 2px}' +
            '.td-sub{margin-top:6px;border:1px solid #3a3a3a;border-radius:8px;overflow:hidden;background:#1a1612}' +
            '.td-sh{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;background:#2c2620;color:#e8d48a;font-size:.82rem;font-weight:600}' +
            '.td-sb{padding:8px 10px;font-size:.82rem;line-height:1.55;color:#eee}' +
            '.td-p{margin:0 0 6px 0;word-break:break-word}' +
            '.td-h{margin:10px 0 4px 0;font-weight:700;color:var(--gold-light,#e8b84b);word-break:break-word}' +
            '.td-yh{margin:0 0 8px 0;padding:6px 8px;border-left:2px solid #6fdc9a;background:#211d18;color:#cfe9d9;font-size:.8rem;font-style:italic;word-break:break-word}' +
            '.td-li{margin:0 0 4px 0;padding-left:14px;position:relative;word-break:break-word}' +
            '.td-li::before{content:"•";position:absolute;left:0;color:var(--gold,#c9922a)}' +
            '.td-rong{font-size:.8rem;color:#e08a73;font-style:italic}' +
            '.td-miss{font-size:.78rem;color:#e08a8a;font-style:italic;padding:6px 4px}' +
            '.td-collapsed>.td-pb,.td-collapsed>.td-sb{display:none}' +
            '@media(max-width:340px){.td-grid{grid-template-columns:repeat(2,1fr)}}';
        document.head.appendChild(st);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
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
            const d = el('div', b.t === 'h' ? 'td-h' : b.t === 'li' ? 'td-li' : 'td-p');
            veInline(d, b.x);
            parent.appendChild(d);
        });
    }
    function veMuc(parent, sec, hienTieuDe) {
        if (!coBlocks(sec)) { parent.appendChild(el('div', 'td-rong', 'Rỗng')); return; }
        if (hienTieuDe && sec.tieuDe) { const h = el('div', 'td-yh'); veInline(h, sec.tieuDe); parent.appendChild(h); }
        veBlocks(parent, sec.blocks);
    }

    function khoiGap(loai, id, tieu, phu, noiDung) {
        ids.push(id);
        const box = el('div', loai === 'q' ? 'td-panel' : 'td-sub');
        if (thuGon[id]) box.classList.add('td-collapsed');
        const h = el('div', loai === 'q' ? 'td-ph' : 'td-sh');
        h.appendChild(el('span', null, tieu));
        const mui = el('span', null, (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn'));
        h.appendChild(mui);
        h.onclick = function () {
            thuGon[id] = !thuGon[id];
            box.classList.toggle('td-collapsed', !!thuGon[id]);
            mui.textContent = (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn');
        };
        const b = el('div', loai === 'q' ? 'td-pb' : 'td-sb');
        noiDung(b);
        box.appendChild(h); box.appendChild(b);
        return box;
    }

    const VT = { thuong: 'thượng', ha: 'hạ' };

    function chieuDangBat(x) {
        const k = ktSel + ':' + x.vt;
        return chieuSel[k] || [x.chieuMacDinh];
    }

    function taoPanel(x) {
        const que = _dataLast.byPair[x.thuong + '-' + x.ha];
        const khoa = ktSel + ':' + x.vt;
        const tieu = x.role + ': ' + (que ? que.ten : tenQ(x.thuong) + '/' + tenQ(x.ha));
        return khoiGap('q', 'p:' + khoa, tieu, que ? 'Quẻ ' + que.so : 'chưa nạp', function (b) {
            if (!que) {
                b.appendChild(el('div', 'td-miss', 'Chưa nạp quẻ ' + tenQ(x.thuong) + ' thượng - ' + tenQ(x.ha) + ' hạ trong ' + CONFIG.dataUrl + '.'));
                return;
            }
            b.appendChild(el('div', 'td-meta', tenQ(x.thuong) + ' thượng - ' + tenQ(x.ha) + ' hạ' + (que.quai ? ' (' + que.quai + ')' : '')));
            b.appendChild(el('div', 'td-de', 'Đề xuất: Thể = ' + tenQ(x.the.so) + ' (' + VT[x.the.viTri] + ') · Dụng = ' + tenQ(x.dung.so) +
                ' (' + VT[x.dung.viTri] + ', vị trí quái động) → chiều ' + x.chieuMacDinh));

            // nút chọn chiều Thể–Dụng
            const bat = chieuDangBat(x);
            const hang = el('div', 'td-ch');
            [['P1', 'P1 · Thượng = Thể, Hạ = Dụng'], ['P2', 'P2 · Thượng = Dụng, Hạ = Thể']].forEach(c => {
                const bt = el('button', 'td-chb' + (bat.indexOf(c[0]) > -1 ? ' on' : ''), c[1] + (c[0] === x.chieuMacDinh ? ' ★' : ''));
                bt.type = 'button';
                bt.onclick = function () {
                    const cu = chieuDangBat(x).slice();
                    const i = cu.indexOf(c[0]);
                    if (i > -1) cu.splice(i, 1); else cu.push(c[0]);
                    chieuSel[khoa] = ['P1', 'P2'].filter(v => cu.indexOf(v) > -1);
                    veKetQua();
                };
                hang.appendChild(bt);
            });
            b.appendChild(hang);

            const chon = MUC.filter(m => tick.indexOf(m.key) > -1);
            if (!chon.length) { b.appendChild(el('div', 'td-miss', 'Hãy tích chọn ít nhất một mục ở lưới phía trên.')); return; }

            const ve = (m, sec, chieu) => {
                const dem = coBlocks(sec) ? '' : 'Rỗng';
                const id = 's:' + khoa + ':' + (chieu || '-') + ':' + m.key;
                b.appendChild(khoiGap('f', id, (chieu ? chieu + ' · ' : '') + m.ngan, dem, function (sb) { veMuc(sb, sec, m.key !== 'soluoc' && m.key !== 'chung' && m.key !== 'nhandien'); }));
            };
            const chung = chon.filter(m => m.key === 'chung')[0];
            if (chung) ve(chung, que.chung, null);
            if (!bat.length && chon.some(m => ['soluoc', 'y1', 'y2', 'y3'].indexOf(m.key) > -1))
                b.appendChild(el('div', 'td-miss', 'Chưa chọn chiều P1 hoặc P2.'));
            bat.forEach(ch => {
                const cd = que[ch];
                const muc = chon.filter(m => ['soluoc', 'y1', 'y2', 'y3'].indexOf(m.key) > -1);
                if (!muc.length) return;
                b.appendChild(el('div', 'td-gl', ch + ' · ' + (cd ? cd.tieu : 'chưa có')));
                muc.forEach(m => ve(m, cd ? cd[m.key] : null, ch));
            });
            const nd = chon.filter(m => m.key === 'nhandien')[0];
            if (nd) ve(nd, que.nhanDien, null);
        });
    }

    function datTatCa(v) {
        ids.forEach(id => { thuGon[id] = v; });
        veKetQua();
    }

    function veKetQua() {
        if (!ketQuaEl) return;
        ketQuaEl.innerHTML = '';
        ids = [];
        if (!_dataLast) { ketQuaEl.appendChild(el('div', 'td-note', 'Đang tải ' + CONFIG.dataUrl + '…')); return; }
        if (!_dataLast.ok) { ketQuaEl.appendChild(el('div', 'td-miss', _dataLast.loi)); return; }
        const tools = el('div', 'td-tools');
        const g = el('button', 'td-mini', 'Thu gọn tất cả'); g.type = 'button';
        const m = el('button', 'td-mini', 'Mở rộng tất cả'); m.type = 'button';
        g.onclick = function () { datTatCa(true); };
        m.onclick = function () { datTatCa(false); };
        tools.appendChild(g); tools.appendChild(m);
        ketQuaEl.appendChild(tools);
        bo3(cur.results[ktSel - 1]).forEach(x => ketQuaEl.appendChild(taoPanel(x)));
    }

    function datTick(ds) {
        tick = MUC.filter(m => ds.indexOf(m.key) > -1).map(m => m.key);
        ghiLuu(); render();
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        ketQuaEl = null;
        if (!cur) { bodyEl.appendChild(el('div', 'td-empty', 'Chưa lập quẻ. Hãy nhập số và bấm "Lập Quẻ" ở phía trên.')); return; }

        const n = cur.soKT, q = cur.results[ktSel - 1];
        bodyEl.appendChild(el('div', 'td-lbl', 'Chọn Không Thời (' + n + ' Không Thời)'));
        const nums = el('div', 'td-nums');
        for (let i = 1; i <= n; i++) {
            const b = el('button', 'td-n' + (i === ktSel ? ' on' : ''), String(i));
            b.type = 'button';
            b.onclick = function () { ktSel = i; render(); emit(); };
            nums.appendChild(b);
        }
        bodyEl.appendChild(nums);

        const dung = q.hao >= 4 ? 'thượng' : 'hạ', the = q.hao >= 4 ? 'hạ' : 'thượng';
        const info = el('div', 'td-info');
        info.innerHTML = '<b>Không Thời ' + ktSel + (ktSel === 1 ? ' (quẻ chính)' : '') + '</b> · hào động ' + q.hao +
            '<br>Quái động ở <b>' + dung + '</b> → Dụng = quái ' + dung + ', Thể = quái ' + the +
            ' (chiều đề xuất: ' + (the === 'thượng' ? 'P1' : 'P2') + ')';
        bodyEl.appendChild(info);

        bodyEl.appendChild(el('div', 'td-lbl', 'Tích chọn mục cần xem'));
        const g = el('div', 'td-grid');
        MUC.forEach(m => {
            const c = el('button', 'td-chip' + (tick.indexOf(m.key) > -1 ? ' on' : ''), m.ngan);
            c.type = 'button';
            c.title = m.ten;
            c.onclick = function () {
                const i = tick.indexOf(m.key);
                if (i > -1) tick.splice(i, 1); else tick.push(m.key);
                ghiLuu(); c.classList.toggle('on', tick.indexOf(m.key) > -1); capDem(); veKetQua();
            };
            g.appendChild(c);
        });
        bodyEl.appendChild(g);
        const tl = el('div', 'td-tools');
        const a = el('button', 'td-mini', 'Chọn tất cả'); a.type = 'button';
        a.onclick = function () { datTick(MUC.map(m => m.key)); };
        const b2 = el('button', 'td-mini', 'Bỏ chọn'); b2.type = 'button';
        b2.onclick = function () { datTick([]); };
        const dem = el('span', 'td-dem');
        const capDem = function () { dem.textContent = 'Đã chọn: ' + tick.length + '/' + MUC.length; };
        tl.appendChild(a); tl.appendChild(b2); tl.appendChild(dem);
        bodyEl.appendChild(tl);
        capDem();

        if (_dataLast && _dataLast.ok) {
            bodyEl.appendChild(el('div', 'td-stat', 'ℹ ' + _dataLast.thongKe));
            if (_dataLast.issues.length) {
                const k = _dataLast.issues.length;
                bodyEl.appendChild(el('div', 'td-note', '⚠ Dữ liệu có ' + k + ' điểm cần xem: ' + _dataLast.issues.slice(0, 3).join(' ; ') + (k > 3 ? ' …' : '')));
            }
        }

        ketQuaEl = el('div');
        bodyEl.appendChild(ketQuaEl);
        veKetQua();
    }

    function emit() {
        listeners.forEach(fn => { try { fn(cur); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('thedung:change', { detail: { state: cur, kt: ktSel } })); } catch (e) {}
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? st.nguon + '#' + st.results.map(q => [q.thuong, q.ha, q.hao, q.hoThuong, q.hoHa, q.bienThuong, q.bienHa].join(',')).join('|') : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        ktSel = 1;
        Object.keys(chieuSel).forEach(k => { delete chieuSel[k]; });      // lập quẻ mới -> về chiều đề xuất
        render();
        emit();
    }

    // ---------- GẮN VÀO TRANG LIÊN HOA ----------
    function bao(ten) {
        if (typeof root[ten] !== 'function' || root[ten].__td) return;
        const goc = root[ten];
        const w = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        w.__td = true;
        root[ten] = w;
    }

    function khoiTao() {
        if (document.getElementById('tdBody')) return;
        themCss();
        tick = docLuu();
        const box = el('div', 'td-box');
        box.innerHTML = '<div class="td-title">' + CONFIG.tieuDe + '</div><div id="tdBody"></div>';
        (document.querySelector('.container') || document.body).appendChild(box);
        bodyEl = document.getElementById('tdBody');
        ['renderResults', 'clearAll', 'switchTab'].forEach(bao);
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            ['result1', 'result2'].forEach(id => {
                const a = document.getElementById(id);
                if (a) mo.observe(a, { attributes: true, attributeFilter: ['class'], childList: true });
            });
        } catch (e) {}
        capNhat(true);
        root.TheDung.ready.then(d => { _dataLast = d; render(); });
    }

    root.TheDung = {
        version: '1.0', CONFIG: CONFIG, MUC: MUC,
        ready: load(), load: load,
        getAll: getAll, getQue: getQue, getByPair: getByPair,
        getKhongThoi: getKhongThoi, getAllKhongThoi: getAllKhongThoi,
        section: section, plain: plain,
        getState: function () { return cur ? { nguon: cur.nguon, results: cur.results, soKT: cur.soKT, kt: ktSel } : null; },
        selectKT: function (i) { if (cur && i >= 1 && i <= cur.soKT) { ktSel = i; render(); emit(); } },
        getTicked: function () { return tick.slice(); },
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parse: parse, layKho: layKho, theDung: theDung }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);
