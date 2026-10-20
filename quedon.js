// =========================================================
//  QUEDON.JS — Module "Quẻ Đơn" (v1.0)
//  Lấy thông tin 8 quẻ đơn từ 8quedon.html (data v2.0, 29 mục / quẻ).
//
//  Cách dùng trên trang:
//   • Tự lấy quẻ chủ / quẻ biến / hào động từ total.html (giống quetuong.js).
//   • Có 3 nút quẻ đơn: 2 quái của quẻ chủ + quái ĐƯỢC BIẾN của quẻ biến
//     (quái không biến trùng quẻ chủ nên không lặp lại).
//   • Lưới 29 ô tên mục: chạm để tích chọn.
//   • Bấm nút quẻ đơn -> hiện các mục đã tích của quẻ đó (có thu gọn / mở rộng).
//
//  Phụ thuộc: chỉ total.html (dataDich, selectedDong, bienQueGiam, moduleSlot,
//  #selectCung, #selectQue). Không phụ thuộc m01–m60.js.
//
//  Cho module khác dùng (window.QueDon) — lấy TOÀN BỘ dữ liệu, không cần tích chọn:
//    QueDon.ready                    -> Promise: dữ liệu đã tải xong ({ok, que} | {ok:false, loi})
//    QueDon.getQue('can' | 'Càn' | 'Can2'…)  -> Promise<{key,ten,coDuLieu,muc,thuTu,thieu,la,trung}|{loi}>
//         muc['Nhân vật'].items = ['Trời','Lãnh đạo',…]
//    QueDon.getMuc('Càn','Nhân vật') -> Promise<string[]|{loi}>
//    QueDon.getAll()                 -> Promise<{can:…, doai:…, …}|{loi}>
//    QueDon.MUC                      -> danh sách 29 mục (ten, ngan)
//    QueDon.getState(), QueDon.getButtons(), QueDon.getTicked(), QueDon.setTicked([...])
//    QueDon.onChange(fn), sự kiện document 'quedon:change'
//    QueDon.CONFIG.dataUrl           -> đường dẫn file dữ liệu
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: '8quedon.html', tieuDe: 'Quẻ Đơn', khoaLuu: 'qd_muc_chon' };

    // 29 mục chuẩn (ten = tên trong dữ liệu, ngan = tên rút gọn trên lưới)
    const MUC = [
        ['Đức','Đức'], ['Phương vị','Phương vị'], ['Ngũ hành','Ngũ hành'], ['Số','Số'], ['Đồ vật','Đồ vật'],
        ['Màu sắc','Màu sắc'], ['Mùa','Mùa'], ['Ngũ tình','Ngũ tình'], ['Khí - Sắc - Vị','Khí·Sắc·Vị'], ['Phẩm chất','Phẩm chất'],
        ['Đặc tính','Đặc tính'], ['Quan hệ','Quan hệ'], ['Ý tượng','Ý tượng'], ['Nhân vật','Nhân vật'], ['Tính cách','Tính cách'],
        ['Tiêu cực','Tiêu cực'], ['Thể tượng','Thể tượng'], ['Nhân thể','Nhân thể'], ['Tật bệnh','Tật bệnh'], ['Thiên tượng','Thiên tượng'],
        ['Vật tượng','Vật tượng'], ['Động vật','Động vật'], ['Nơi chốn kiến trúc','Nơi chốn'], ['Thời gian có lợi','T.gian có lợi'],
        ['Thời gian bất lợi','T.gian bất lợi'], ['Phương vị có lợi','P.vị có lợi'], ['Phương vị bất lợi','P.vị bất lợi'],
        ['Màu sắc có lợi','Màu có lợi'], ['Màu sắc không lợi','Màu không lợi']
    ].map(a => ({ ten: a[0], ngan: a[1] }));

    const QUAI = { '111':'Càn','011':'Đoài','101':'Ly','001':'Chấn','110':'Tốn','010':'Khảm','100':'Cấn','000':'Khôn' };
    const KEY_OF = { 'Càn':'can','Đoài':'doai','Ly':'ly','Chấn':'chan','Tốn':'ton','Khảm':'kham','Cấn':'can_cau','Khôn':'khon' };
    const TEN_OF = {}; Object.keys(KEY_OF).forEach(t => { TEN_OF[KEY_OF[t]] = t; });

    function chuanHoaKey(x) {
        const s = String(x == null ? '' : x).trim().normalize('NFC');
        if (KEY_OF[s]) return KEY_OF[s];
        const l = s.toLowerCase();
        if (l === 'can2') return 'can_cau';
        return TEN_OF[l] ? l : null;
    }
    function tachQuai(code) {
        if (!code || code.length !== 6) return { thuong: null, ha: null };
        return { thuong: QUAI[code.slice(0, 3)] || null, ha: QUAI[code.slice(3)] || null };
    }

    // ---------- NHẬN DIỆN TÊN MỤC ----------
    function boDau(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    function normKey(s) {
        return String(s || '').normalize('NFC').toLowerCase()
            .replace(/\s*[-–—]\s*/g, '-').replace(/\s+/g, ' ').replace(/[\s:.]+$/, '').trim();
    }
    const MUC_KEY = {};
    MUC.forEach(m => { MUC_KEY[normKey(m.ten)] = m.ten; });

    // Trả về tên mục chuẩn hoặc null. "Thời gian có lợi - Năm tháng ngày giờ" -> "Thời gian có lợi"
    function nhanMuc(heading) {
        const n = normKey(heading);
        if (MUC_KEY[n]) return MUC_KEY[n];
        let best = null;
        Object.keys(MUC_KEY).forEach(k => {
            if (n.indexOf(k + '-') === 0 || n.indexOf(k + ' (') === 0) { if (!best || k.length > best.length) best = k; }
        });
        if (best) return MUC_KEY[best];
        const nb = boDau(n);
        const c = Object.keys(MUC_KEY).filter(k => boDau(k) === nb);
        return c.length === 1 ? MUC_KEY[c[0]] : null;
    }
    function nhanMucNgan(x) {   // chấp nhận cả tên rút gọn trên lưới
        const m = nhanMuc(x);
        if (m) return m;
        const f = MUC.filter(a => normKey(a.ngan) === normKey(x));
        return f.length ? f[0].ten : null;
    }

    // ---------- PHÂN TÍCH 1 VÙNG QUẺ ----------
    function lamSachY(s) {
        return String(s).replace(/\s+/g, ' ').trim().replace(/\.+$/, '').trim()
            .replace(/(^|[^\p{L}])Tị(?![\p{L}])/gu, '$1Tỵ');
    }
    function themY(cur, s) {
        const y = lamSachY(s);
        if (y && cur && cur.ten) cur.items.push(y);
    }

    function parseRegion(text) {
        const res = { muc: {}, thuTu: [], la: [], trung: [], thieu: [], coDuLieu: false };
        const t = String(text || '').replace(/\r/g, '').trim();
        if (!t || /^input here$/i.test(t)) return res;
        res.coDuLieu = true;
        let cur = null, dauKhoi = true;
        t.split('\n').forEach(raw => {
            const l = raw.trim();
            if (/^\*{3,}$/.test(l)) { cur = null; dauKhoi = true; return; }
            if (!l) return;
            const m = l.match(/^([^:]{1,60}?)\s*:\s*(.*)$/);
            let canon = null, laTieuDe = false;
            if (m) { canon = nhanMuc(m[1]); laTieuDe = !!canon || dauKhoi; }
            if (laTieuDe) {
                dauKhoi = false;
                if (canon) {
                    if (res.muc[canon]) { res.trung.push(canon); cur = { ten: null, items: [] }; }
                    else { cur = { ten: canon, items: [] }; res.muc[canon] = cur; res.thuTu.push(canon); }
                } else { res.la.push(m[1].trim()); cur = { ten: null, items: [] }; }
                if (m[2].trim()) themY(cur, m[2]);
                return;
            }
            dauKhoi = false;
            themY(cur, l);
        });
        res.thieu = MUC.filter(a => !res.muc[a.ten]).map(a => a.ten);
        return res;
    }

    // ---------- TẢI 8quedon.html ----------
    let _loadP = null;
    let _dataLast = null;     // kết quả tải gần nhất ({ok,...}); null = đang tải/chưa tải

    function load() {
        if (_loadP) return _loadP;
        _loadP = fetch(CONFIG.dataUrl, { cache: 'no-cache' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const que = {};
                Object.keys(TEN_OF).forEach(key => {
                    let el = doc.querySelector('pre[data-que="' + key + '"]') || doc.querySelector('[data-que="' + key + '"]');
                    if (el && el.tagName !== 'PRE') { const pre = el.querySelector('pre'); if (pre) el = pre; }
                    const p = parseRegion(el ? el.textContent : '');
                    p.key = key; p.ten = TEN_OF[key]; p.coVung = !!el;
                    que[key] = p;
                });
                return { ok: true, que: que };
            })
            .catch(e => { _loadP = null; return { ok: false, loi: 'Không tải được ' + CONFIG.dataUrl + ' (' + e.message + ').' }; });
        return _loadP;
    }

    async function getQue(keyIn) {
        const key = chuanHoaKey(keyIn);
        if (!key) return { loi: 'Quẻ đơn không hợp lệ: ' + keyIn };
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return d.que[key];
    }
    async function getMuc(keyIn, mucIn) {
        const muc = nhanMucNgan(mucIn);
        if (!muc) return { loi: 'Mục không hợp lệ: ' + mucIn };
        const q = await getQue(keyIn);
        if (q.loi) return q;
        if (!q.coDuLieu) return { loi: 'Chưa có dữ liệu quẻ ' + q.ten + ' trong ' + CONFIG.dataUrl + '.' };
        if (!q.muc[muc]) return { loi: 'Quẻ ' + q.ten + ' chưa có mục "' + muc + '".' };
        return q.muc[muc].items.slice();
    }
    async function getAll() {
        const d = await load();
        return d.ok ? d.que : { loi: d.loi };
    }

    // ---------- ĐỌC TRẠNG THÁI TỪ total.html ----------
    function docTrangThai() {
        const selCung = document.getElementById('selectCung');
        const selQue = document.getElementById('selectQue');
        if (!selCung || !selQue || !selCung.value || !selQue.value) return null;
        if (typeof dataDich === 'undefined') return null;
        const cung = dataDich[selCung.value];
        const q = cung && cung.quẻ && cung.quẻ[selQue.value];
        if (!q) return null;
        const chu = Object.assign({ ten: selQue.value, cung: cung.name }, tachQuai(q.c));
        let hao = [];
        try { if (typeof selectedDong !== 'undefined') hao = selectedDong.slice(); } catch (e) {}
        let bien = null;
        if (hao.length) {
            try {
                if (typeof bienQueGiam !== 'undefined' && bienQueGiam && bienQueGiam.data) {
                    bien = Object.assign({ ten: bienQueGiam.name, cung: bienQueGiam.cung && bienQueGiam.cung.name },
                                         tachQuai(bienQueGiam.data.c));
                }
            } catch (e) {}
        }
        let text = chu.ten;
        if (hao.length) text += ' động hào ' + hao.join(', ') + (bien ? ' biến ' + bien.ten : '');
        else text += ' (quẻ tĩnh)';
        return { chu: chu, bien: bien, hao: hao, text: text };
    }

    // 2 quái của quẻ chủ + quái ĐƯỢC BIẾN của quẻ biến; quái trùng gộp thành 1 nút
    function tinhNut(st) {
        if (!st) return [];
        const m = {}, ds = [];
        function them(ten, vaiTro) {
            const key = KEY_OF[ten];
            if (!key) return;
            if (!m[key]) { m[key] = { key: key, ten: ten, vaiTro: [] }; ds.push(m[key]); }
            if (m[key].vaiTro.indexOf(vaiTro) < 0) m[key].vaiTro.push(vaiTro);
        }
        them(st.chu.thuong, 'chủ thượng');
        them(st.chu.ha, 'chủ hạ');
        if (st.bien) {
            if (st.hao.some(h => h >= 4)) them(st.bien.thuong, 'biến thượng');
            if (st.hao.some(h => h <= 3)) them(st.bien.ha, 'biến hạ');
        }
        return ds;
    }

    // ---------- TRẠNG THÁI GIAO DIỆN ----------
    let cur = null, curSig = '', nuts = [];
    let opened = [];
    const thuGon = {};                 // 'q:key' | 'f:key:muc' -> true nếu đang thu gọn
    let ticked = [];                   // tên mục (chuẩn) đã tích
    const listeners = [];
    let bodyEl = null, ketQuaEl = null, demEl = null, luoiEl = null;

    function docLuu() {
        try {
            const v = JSON.parse(root.localStorage.getItem(CONFIG.khoaLuu) || '[]');
            return Array.isArray(v) ? v.filter(x => MUC.some(m => m.ten === x)) : [];
        } catch (e) { return []; }
    }
    function ghiLuu() { try { root.localStorage.setItem(CONFIG.khoaLuu, JSON.stringify(ticked)); } catch (e) {} }

    function themCss() {
        if (document.getElementById('qdCss')) return;
        const st = document.createElement('style');
        st.id = 'qdCss';
        st.textContent =
            '.qd-line{font-size:1rem;font-weight:600;color:var(--gold,#d4af37);text-align:center;margin-bottom:12px;line-height:1.4}' +
            '.qd-empty{font-size:.85rem;color:#888;text-align:center}' +
            '.qd-lbl{font-size:.7rem;font-weight:600;color:#aaa;text-transform:uppercase;margin:12px 0 6px}' +
            '.qd-btns{display:flex;gap:8px;flex-wrap:wrap}' +
            '.qd-btn{flex:1;min-width:96px;padding:9px 6px;background:transparent;color:var(--gold,#d4af37);border:1px solid var(--gold,#d4af37);border-radius:8px;font-family:inherit;cursor:pointer;line-height:1.25}' +
            '.qd-btn b{display:block;font-size:.95rem}.qd-btn small{display:block;font-size:.62rem;opacity:.85;font-weight:400}' +
            '.qd-btn.on{background:var(--gold,#d4af37);color:#000}' +
            '.qd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}' +
            '.qd-chip{padding:8px 3px;background:#252525;color:#bbb;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:.72rem;line-height:1.2;text-align:center;cursor:pointer;min-height:34px;display:flex;align-items:center;justify-content:center}' +
            '.qd-chip.on{background:var(--gold,#d4af37);color:#000;border-color:var(--gold,#d4af37);font-weight:700}' +
            '.qd-tools{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}' +
            '.qd-mini{padding:6px 10px;background:transparent;color:var(--gold,#d4af37);border:1px solid #555;border-radius:8px;font-family:inherit;font-size:.72rem;cursor:pointer}' +
            '.qd-dem{font-size:.7rem;color:#888;margin-left:auto}' +
            '.qd-note{font-size:.7rem;color:#c9a14a;margin-top:8px;line-height:1.4}' +
            '.qd-panel{margin-top:10px;border:1px solid var(--gold,#d4af37);border-radius:10px;overflow:hidden;background:#252525}' +
            '.qd-ph{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:#2a2a2a;color:var(--gold,#d4af37);font-weight:600;font-size:.9rem}' +
            '.qd-ph span:last-child{font-size:.7rem;font-weight:400;color:#aaa;white-space:nowrap}' +
            '.qd-pb{padding:6px 8px 8px}' +
            '.qd-sub{margin-top:6px;border:1px solid #3a3a3a;border-radius:8px;overflow:hidden;background:#1f1f1f}' +
            '.qd-sh{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;background:#2c2c2c;color:#6fdc9a;font-size:.82rem;font-weight:600}' +
            '.qd-sh span:last-child{font-size:.66rem;font-weight:400;color:#999;white-space:nowrap}' +
            '.qd-sb{padding:8px 10px;font-size:.82rem;line-height:1.5;color:#eee}' +
            '.qd-it{margin:0 0 3px 0;padding-left:12px;position:relative;word-break:break-word}' +
            '.qd-it::before{content:"•";position:absolute;left:0;color:var(--gold,#d4af37)}' +
            '.qd-miss{font-size:.78rem;color:#e08a8a;font-style:italic}' +
            '.qd-collapsed>.qd-pb,.qd-collapsed>.qd-sb{display:none}' +
            '@media(max-width:340px){.qd-grid{grid-template-columns:repeat(2,1fr)}}';
        document.head.appendChild(st);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    // Khối có tiêu đề bấm để thu gọn / mở rộng
    function khoiGap(loai, id, tieu, phu, noiDung) {
        const box = el('div', loai === 'q' ? 'qd-panel' : 'qd-sub');
        if (thuGon[id]) box.classList.add('qd-collapsed');
        const h = el('div', loai === 'q' ? 'qd-ph' : 'qd-sh');
        h.appendChild(el('span', null, tieu));
        const mui = el('span', null, (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn'));
        h.appendChild(mui);
        h.onclick = function () {
            thuGon[id] = !thuGon[id];
            box.classList.toggle('qd-collapsed', !!thuGon[id]);
            mui.textContent = (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn');
        };
        const b = el('div', loai === 'q' ? 'qd-pb' : 'qd-sb');
        noiDung(b);
        box.appendChild(h); box.appendChild(b);
        return box;
    }

    function taoPanelQue(n) {
        const d = _dataLast.que[n.key];
        const phu = n.vaiTro.join(' & ');
        return khoiGap('q', 'q:' + n.key, 'Quẻ ' + n.ten, phu, function (b) {
            if (!d || !d.coDuLieu) { b.appendChild(el('div', 'qd-miss', 'Chưa có dữ liệu quẻ ' + n.ten + ' trong ' + CONFIG.dataUrl + '.')); return; }
            const chon = MUC.filter(m => ticked.indexOf(m.ten) > -1);
            if (!chon.length) { b.appendChild(el('div', 'qd-miss', 'Hãy tích chọn ít nhất một mục ở lưới phía trên.')); return; }
            chon.forEach(m => {
                const mm = d.muc[m.ten];
                const dem = mm ? mm.items.length : 0;
                b.appendChild(khoiGap('f', 'f:' + n.key + ':' + m.ten, m.ten, mm ? dem + ' ý' : 'thiếu', function (sb) {
                    if (!mm) { sb.appendChild(el('div', 'qd-miss', 'Quẻ ' + n.ten + ' chưa có mục "' + m.ten + '".')); return; }
                    if (!dem) { sb.appendChild(el('div', 'qd-miss', 'Mục này đang trống.')); return; }
                    mm.items.forEach(y => sb.appendChild(el('div', 'qd-it', y)));
                }));
            });
        });
    }

    function ghiChuDuLieu() {
        if (!_dataLast || !_dataLast.ok) return null;
        const dong = [];
        Object.keys(_dataLast.que).forEach(k => {
            const q = _dataLast.que[k];
            if (!q.coDuLieu) return;
            if (q.la.length) dong.push('Quẻ ' + q.ten + ': mục lạ chưa nhận diện: ' + q.la.join(', ') + '.');
            if (q.trung.length) dong.push('Quẻ ' + q.ten + ': mục bị trùng: ' + q.trung.join(', ') + '.');
            if (q.thieu.length) dong.push('Quẻ ' + q.ten + ': thiếu ' + q.thieu.length + ' mục (' + q.thieu.join(', ') + ').');
        });
        return dong.length ? '⚠ ' + dong.join(' ') : null;
    }

    function veKetQua() {
        if (!ketQuaEl) return;
        ketQuaEl.innerHTML = '';
        const ds = nuts.filter(n => opened.indexOf(n.key) > -1);
        if (!ds.length) return;
        if (!_dataLast) { ketQuaEl.appendChild(el('div', 'qd-note', 'Đang tải ' + CONFIG.dataUrl + '…')); return; }
        if (!_dataLast.ok) { ketQuaEl.appendChild(el('div', 'qd-miss', _dataLast.loi + ' Bấm lại nút quẻ để thử lại.')); return; }
        const tools = el('div', 'qd-tools');
        const g = el('button', 'qd-mini', 'Thu gọn tất cả'); g.type = 'button';
        const m = el('button', 'qd-mini', 'Mở rộng tất cả'); m.type = 'button';
        function datTatCa(v) {
            ds.forEach(n => ticked.forEach(t => { thuGon['f:' + n.key + ':' + t] = v; }));
            veKetQua();
        }
        g.onclick = function () { datTatCa(true); };
        m.onclick = function () { datTatCa(false); };
        tools.appendChild(g); tools.appendChild(m);
        ketQuaEl.appendChild(tools);
        ds.forEach(n => ketQuaEl.appendChild(taoPanelQue(n)));
    }

    function capNhatDem() { if (demEl) demEl.textContent = 'Đã chọn: ' + ticked.length + '/' + MUC.length; }

    function datTicked(ds) {
        ticked = MUC.filter(m => ds.indexOf(m.ten) > -1).map(m => m.ten);
        ghiLuu();
        if (luoiEl) Array.prototype.forEach.call(luoiEl.children, function (c) { c.classList.toggle('on', ticked.indexOf(c.getAttribute('data-muc')) > -1); });
        capNhatDem();
        veKetQua();
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        ketQuaEl = demEl = luoiEl = null;
        if (!cur) { bodyEl.appendChild(el('div', 'qd-empty', 'Chưa chọn quẻ chủ ở phần trên.')); return; }

        bodyEl.appendChild(el('div', 'qd-line', cur.text));

        // 3 nút quẻ đơn
        const bt = el('div', 'qd-btns');
        nuts.forEach(n => {
            const b = el('button', 'qd-btn' + (opened.indexOf(n.key) > -1 ? ' on' : ''));
            b.type = 'button';
            b.appendChild(el('b', null, n.ten));
            b.appendChild(el('small', null, n.vaiTro.join(' & ')));
            b.onclick = function () {
                const i = opened.indexOf(n.key);
                if (i > -1) opened.splice(i, 1); else opened.push(n.key);
                if (_dataLast && !_dataLast.ok) { _dataLast = null; load().then(d => { _dataLast = d; render(); }); }
                render();
            };
            bt.appendChild(b);
        });
        bodyEl.appendChild(bt);

        // lưới 29 mục
        bodyEl.appendChild(el('div', 'qd-lbl', 'Tích chọn mục cần xem'));
        luoiEl = el('div', 'qd-grid');
        MUC.forEach(m => {
            const c = el('button', 'qd-chip' + (ticked.indexOf(m.ten) > -1 ? ' on' : ''), m.ngan);
            c.type = 'button';
            c.setAttribute('data-muc', m.ten);
            c.title = m.ten;
            c.onclick = function () {
                const i = ticked.indexOf(m.ten);
                if (i > -1) ticked.splice(i, 1); else ticked.push(m.ten);
                datTicked(ticked.slice());
            };
            luoiEl.appendChild(c);
        });
        bodyEl.appendChild(luoiEl);

        const tools = el('div', 'qd-tools');
        const a = el('button', 'qd-mini', 'Chọn tất cả'); a.type = 'button';
        a.onclick = function () { datTicked(MUC.map(m => m.ten)); };
        const b2 = el('button', 'qd-mini', 'Bỏ chọn'); b2.type = 'button';
        b2.onclick = function () { datTicked([]); };
        demEl = el('span', 'qd-dem');
        tools.appendChild(a); tools.appendChild(b2); tools.appendChild(demEl);
        bodyEl.appendChild(tools);
        capNhatDem();

        const gc = ghiChuDuLieu();
        if (gc) bodyEl.appendChild(el('div', 'qd-note', gc));

        ketQuaEl = el('div');
        bodyEl.appendChild(ketQuaEl);
        veKetQua();
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? JSON.stringify([st.chu.ten, st.bien && st.bien.ten, st.hao]) : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        nuts = tinhNut(st);
        const con = nuts.map(n => n.key);
        opened = opened.filter(k => con.indexOf(k) > -1);
        render();
        listeners.forEach(fn => { try { fn(st); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('quedon:change', { detail: st })); } catch (e) {}
    }

    // ---------- GẮN VÀO total.html ----------
    function hookProcessDich() {
        if (typeof root.processDich !== 'function' || root.processDich.__qd) return;
        const goc = root.processDich;
        const bao = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        bao.__qd = true;
        root.processDich = bao;
    }

    function khoiTao() {
        if (document.getElementById('qdBody')) return;
        themCss();
        ticked = docLuu();
        const html =
            '<div class="header" style="border-bottom:1px solid var(--gold);padding:5px 0 10px 0;margin-bottom:15px;">' +
            '<h1 style="font-size:1.1rem;">' + CONFIG.tieuDe + '</h1></div><div id="qdBody"></div>';
        if (typeof root.moduleSlot === 'function') root.moduleSlot(html);
        else {
            const d = document.createElement('div');
            d.className = 'box module-container';
            d.innerHTML = html;
            (document.getElementById('module-slots') || document.body).appendChild(d);
        }
        bodyEl = document.getElementById('qdBody');
        hookProcessDich();
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            const rg = document.getElementById('resultGrid');
            if (rg) mo.observe(rg, { childList: true, subtree: true, characterData: true, attributes: true });
            ['selectCung', 'selectQue'].forEach(id => {
                const e = document.getElementById(id);
                if (e) e.addEventListener('change', function () { setTimeout(capNhat, 0); });
            });
        } catch (e) {}
        capNhat(true);
        root.QueDon.ready.then(d => { _dataLast = d; render(); });
    }

    root.QueDon = {
        version: '1.0', CONFIG: CONFIG, MUC: MUC,
        ready: load(),
        load: load,
        getQue: getQue, getMuc: getMuc, getAll: getAll,
        getState: function () { return cur; },
        getButtons: function () { return nuts.slice(); },
        getTicked: function () { return ticked.slice(); },
        setTicked: function (ds) { datTicked((ds || []).map(nhanMucNgan).filter(Boolean)); },
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parseRegion: parseRegion, nhanMuc: nhanMuc, tinhNut: tinhNut }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);
