// =========================================================
//  QUETUONG.JS — Module "Quẻ Tượng" (v0.2 – thực chiến)
//
//  Chức năng:
//   • Tự lấy quẻ chủ / quẻ biến / hào động từ total.html và hiển thị:
//       "Hỏa Địa Tấn động hào 3 biến Hỏa Sơn Lữ"
//   • Dưới mỗi quẻ có 2 nút quẻ đơn (thượng / hạ). Bấm nút -> lấy PART 1 của
//     quẻ đơn đó trong quetuong.html (dừng khi gặp "PART 2").
//   • Nút "Tìm Chuyển Tượng": xác định quái nào động (thượng/hạ), quái đơn của
//     quẻ chủ ➔ quái đơn của quẻ biến, rồi tìm trong PART 2 của quetuong.html
//     mục "CHUYỂN HÓA : X ➔ Y." và lấy dữ liệu bên dưới (dừng khi gặp mục
//     "CHUYỂN HÓA" kế tiếp).
//   • Quẻ đơn trùng giữa quẻ chủ và quẻ biến chỉ hiện 1 lần, chọn 1 lần.
//
//  Phụ thuộc: chỉ total.html (dataDich, selectedDong, bienQueGiam, moduleSlot,
//  #selectCung, #selectQue). KHÔNG phụ thuộc m01–m60.js.
//
//  Liên thông với module khác (window.QueTuong):
//    QueTuong.getState()            -> { chu, bien, hao, text } hoặc null
//    QueTuong.getOpened()           -> mã quẻ đơn đang mở, vd ['ly','khon']
//    QueTuong.getTuong('ly')        -> Promise<{text}|{loi}>   (PART 1)
//    QueTuong.getChuyenHoa('Càn','Ly') -> Promise<{text}|{loi}> (PART 2)
//    QueTuong.getChuyenList()       -> [{vi,tu,den,hao}] của quẻ hiện tại
//    QueTuong.onChange(fn), sự kiện document 'quetuong:change'
//    QueTuong.CONFIG.dataUrl        -> đường dẫn file dữ liệu
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'quetuong.html', tieuDe: 'Quẻ Tượng' };

    // Quẻ đơn đọc từ 3 hào, viết từ TRÊN xuống DƯỚI (khớp chuỗi c trong dataDich)
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

    // Quái nào động? hào 1-3 = hạ quái, 4-6 = thượng quái.
    function tinhChuyen(st) {
        if (!st || !st.bien) return [];
        const ds = [];
        const haoThuong = st.hao.filter(h => h >= 4), haoHa = st.hao.filter(h => h <= 3);
        if (haoThuong.length && st.chu.thuong && st.bien.thuong)
            ds.push({ vi: 'Thượng quái', loai: 'thuong', tu: st.chu.thuong, den: st.bien.thuong, hao: haoThuong });
        if (haoHa.length && st.chu.ha && st.bien.ha)
            ds.push({ vi: 'Hạ quái', loai: 'ha', tu: st.chu.ha, den: st.bien.ha, hao: haoHa });
        return ds;
    }

    // ---------- PHÂN TÍCH VĂN BẢN quetuong.html ----------
    function boDau(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    function dongList(text) { return String(text || '').replace(/\r/g, '').split('\n').map(l => l.trim()); }
    const ARROW = /\s*(?:➔|→|➜|⟶|⇒|->|=>)\s*/;
    function laMucChuyenHoa(l) { return /^CHUYEN\s*HOA\s*:/.test(boDau(l).toUpperCase()); }   // chịu cả "HÓA" lẫn "HOÁ"
    function laPart(l, n) { return new RegExp('^PART\\s*' + n + '\\s*:?$', 'i').test(l); }
    function laDauQue(l) { return /^QU[EẺ]\s*:/i.test(boDau(l)) || /^QUẺ\s*:/i.test(l); }

    function tachTenChuyenHoa(l) {   // "CHUYỂN HÓA : CÀN ➔ LY." -> {x:'CÀN', y:'LY'}
        const i = l.indexOf(':');
        if (i < 0) return null;
        const p = l.slice(i + 1).trim().split(ARROW);
        if (p.length < 2) return null;
        const sach = s => s.replace(/[.\s]+$/, '').trim();
        return { x: sach(p[0]), y: sach(p[1]) };
    }
    function trungQuai(tenTrongFile, tenChuan) {
        const a = String(tenTrongFile).normalize('NFC').trim().toLowerCase();
        const b = String(tenChuan).normalize('NFC').toLowerCase();
        if (a === b) return true;
        const x = boDau(a), y = boDau(b);
        return x === y && y !== 'can';          // Càn/Cấn khác nhau chỉ ở dấu -> phải khớp đúng dấu
    }

    // PART 1: từ sau dòng "PART 1" cho tới khi gặp "PART 2" (hoặc mục CHUYỂN HÓA) thì dừng.
    function parsePart1(text) {
        const L = dongList(text);
        let i = L.findIndex(l => laPart(l, 1));
        i = i < 0 ? 0 : i + 1;
        const out = [];
        for (; i < L.length; i++) {
            const l = L[i];
            if (laPart(l, 2) || laMucChuyenHoa(l)) break;
            if (i === 0 && laDauQue(l)) continue;
            if (laDauQue(l)) continue;
            if (l) out.push(l);
        }
        return out.join('\n');
    }

    // PART 2: tìm mục "CHUYỂN HÓA : X ➔ Y." rồi lấy dòng bên dưới tới khi gặp mục CHUYỂN HÓA kế tiếp.
    function parseChuyenHoa(text, tuTen, denTen) {
        const L = dongList(text);
        let i = L.findIndex(l => laPart(l, 2));
        i = i < 0 ? 0 : i + 1;
        for (; i < L.length; i++) {
            if (!laMucChuyenHoa(L[i])) continue;
            const t = tachTenChuyenHoa(L[i]);
            if (!t || !trungQuai(t.x, tuTen) || !trungQuai(t.y, denTen)) continue;
            const out = [];
            for (let j = i + 1; j < L.length; j++) {
                const l = L[j];
                if (laMucChuyenHoa(l) || laPart(l, 1) || laPart(l, 2) || laDauQue(l)) break;   // sang mục khác -> dừng
                if (l) out.push(l);
            }
            return out.join('\n');
        }
        return '';
    }

    // ---------- LẤY DỮ LIỆU TỪ quetuong.html ----------
    let _docP = null;
    const _raw = {};      // key -> văn bản thô của vùng quẻ đơn
    const _res = {};      // cacheId -> kết quả thành công

    function taiDoc() {
        if (!_docP) {
            _docP = fetch(CONFIG.dataUrl, { cache: 'no-cache' })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
                .then(t => new DOMParser().parseFromString(t, 'text/html'));
            _docP.catch(() => { _docP = null; });
        }
        return _docP;
    }

    async function layRaw(key) {
        if (_raw[key]) return { text: _raw[key] };
        try {
            const doc = await taiDoc();
            let el = doc.querySelector('[data-que="' + key + '"]') || doc.getElementById('que-' + key);
            if (el) { const pre = el.querySelector('pre'); if (pre) el = pre; }
            const text = el ? String(el.textContent || '').replace(/\r/g, '').trim() : '';
            if (!el || !text || /^input here$/i.test(text))
                return { loi: 'Chưa có dữ liệu quẻ ' + TEN_OF[key] + ' trong ' + CONFIG.dataUrl + '.' };
            _raw[key] = text;
            return { text: text };
        } catch (e) {
            return { loi: 'Không tải được ' + CONFIG.dataUrl + ' (' + e.message + ').' };
        }
    }

    // PART 1 của 1 quẻ đơn
    async function getTuong(keyIn) {
        const key = chuanHoaKey(keyIn);
        if (!key) return { loi: 'Quẻ đơn không hợp lệ: ' + keyIn };
        const id = 'p1:' + key;
        if (_res[id]) return _res[id];
        const r = await layRaw(key);
        if (r.loi) return r;
        const t = parsePart1(r.text);
        if (!t) return { loi: 'Quẻ ' + TEN_OF[key] + ' chưa có nội dung PART 1.' };
        return (_res[id] = { text: t });
    }

    // PART 2: mục CHUYỂN HÓA : tu ➔ den  (nằm trong vùng của quẻ đơn "tu")
    async function getChuyenHoa(tuIn, denIn) {
        const kt = chuanHoaKey(tuIn), kd = chuanHoaKey(denIn);
        if (!kt || !kd) return { loi: 'Quẻ đơn không hợp lệ: ' + tuIn + ' ➔ ' + denIn };
        const id = 'cv:' + kt + '>' + kd;
        if (_res[id]) return _res[id];
        const r = await layRaw(kt);
        if (r.loi) return r;
        const t = parseChuyenHoa(r.text, TEN_OF[kt], TEN_OF[kd]);
        if (!t) return { loi: 'Chưa có mục "CHUYỂN HÓA : ' + TEN_OF[kt].toUpperCase() + ' ➔ ' + TEN_OF[kd].toUpperCase() + '." trong PART 2 của quẻ ' + TEN_OF[kt] + '.' };
        return (_res[id] = { text: t });
    }

    // ---------- GIAO DIỆN ----------
    let cur = null, curSig = '';
    let opened = [];
    let chuyenOn = false;
    const collapsed = {};
    const listeners = [];
    let bodyEl = null;

    function themCss() {
        if (document.getElementById('qtCss')) return;
        const st = document.createElement('style');
        st.id = 'qtCss';
        st.textContent =
            '.qt-line{font-size:1rem;font-weight:600;color:var(--gold,#d4af37);text-align:center;margin-bottom:12px;line-height:1.4}' +
            '.qt-empty{font-size:.85rem;color:#888;text-align:center}' +
            '.qt-sec{margin-top:12px;padding-top:10px;border-top:1px dashed #444}' +
            '.qt-sec-t{font-size:.7rem;font-weight:600;color:#aaa;text-transform:uppercase;margin-bottom:8px}' +
            '.qt-btns{display:flex;gap:8px;flex-wrap:wrap}' +
            '.qt-btn{flex:1;min-width:110px;padding:10px 8px;background:transparent;color:var(--gold,#d4af37);border:1px solid var(--gold,#d4af37);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:600;cursor:pointer}' +
            '.qt-btn.on{background:var(--gold,#d4af37);color:#000}' +
            '.qt-btn.big{width:100%;flex:none;padding:12px}' +
            '.qt-note{font-size:.7rem;color:#888;margin-top:6px}' +
            '.qt-panel{margin-top:10px;border:1px solid var(--gold,#d4af37);border-radius:10px;overflow:hidden;background:#252525}' +
            '.qt-panel.cv{border-color:#27ae60}' +
            '.qt-ph{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:#2a2a2a;color:var(--gold,#d4af37);font-weight:600;font-size:.9rem}' +
            '.qt-panel.cv .qt-ph{color:#6fdc9a}' +
            '.qt-ph span:last-child{font-size:.7rem;font-weight:400;color:#aaa;white-space:nowrap}' +
            '.qt-pb{padding:10px 12px;font-size:.85rem;line-height:1.55;word-break:break-word;color:#eee}' +
            '.qt-pb.loi{color:#e08a8a}' +
            '.qt-ln{margin:0 0 8px 0}.qt-ln:last-child{margin-bottom:0}' +
            '.qt-ln b{color:var(--gold,#d4af37)}' +
            '.qt-panel.cv .qt-ln b{color:#6fdc9a}' +
            '.qt-panel.qt-collapsed .qt-pb{display:none}';
        document.head.appendChild(st);
    }

    // Hiển thị từng dòng; "Nhãn : nội dung" -> nhãn in đậm
    function veNoiDung(el, r) {
        el.innerHTML = '';
        if (r.loi) { el.classList.add('loi'); el.textContent = r.loi; return; }
        el.classList.remove('loi');
        r.text.split('\n').forEach(l => {
            const d = document.createElement('div');
            d.className = 'qt-ln';
            const m = l.match(/^([^:]{1,40}?)\s*:\s*([\s\S]*)$/);
            if (m) {
                const b = document.createElement('b'); b.textContent = m[1] + ' :';
                d.appendChild(b); d.appendChild(document.createTextNode(' ' + m[2]));
            } else d.textContent = l;
            el.appendChild(d);
        });
    }

    // Khung có thu gọn / mở rộng. loadFn trả Promise<{text}|{loi}>
    function taoKhung(panelId, cacheId, tieuDe, loadFn, laChuyen) {
        const p = document.createElement('div');
        p.className = 'qt-panel' + (laChuyen ? ' cv' : '') + (collapsed[panelId] ? ' qt-collapsed' : '');
        p.setAttribute('data-qt-panel', panelId);
        const h = document.createElement('div');
        h.className = 'qt-ph';
        const t = document.createElement('span'); t.textContent = tieuDe;
        const m = document.createElement('span'); m.textContent = collapsed[panelId] ? '▼ mở rộng' : '▲ thu gọn';
        h.appendChild(t); h.appendChild(m);
        h.onclick = function () {
            collapsed[panelId] = !collapsed[panelId];
            p.classList.toggle('qt-collapsed', !!collapsed[panelId]);
            m.textContent = collapsed[panelId] ? '▼ mở rộng' : '▲ thu gọn';
        };
        const b = document.createElement('div');
        b.className = 'qt-pb';
        p.appendChild(h); p.appendChild(b);
        if (_res[cacheId]) veNoiDung(b, _res[cacheId]);
        else {
            b.textContent = 'Đang tải…';
            loadFn().then(r => {
                const el = bodyEl && bodyEl.querySelector('[data-qt-panel="' + panelId + '"] .qt-pb');
                if (el) veNoiDung(el, r);
            });
        }
        return p;
    }

    function nutQuai(ten, nhan) {
        const key = KEY_OF[ten];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'qt-btn' + (opened.indexOf(key) > -1 ? ' on' : '');
        b.textContent = nhan;
        b.onclick = function () {
            const i = opened.indexOf(key);
            if (i > -1) opened.splice(i, 1); else opened.push(key);
            render();
        };
        return b;
    }

    function cacQuai(q) {
        if (!q.thuong || !q.ha) return [];
        if (q.thuong === q.ha) return [{ ten: q.thuong, nhan: q.thuong + ' (thượng & hạ)' }];
        return [{ ten: q.thuong, nhan: q.thuong + ' thượng' }, { ten: q.ha, nhan: q.ha + ' hạ' }];
    }

    function taoMuc(tieuDe, q, shownKeys) {
        const sec = document.createElement('div');
        sec.className = 'qt-sec';
        const t = document.createElement('div');
        t.className = 'qt-sec-t';
        t.textContent = tieuDe + ': ' + q.ten;
        sec.appendChild(t);
        const bt = document.createElement('div');
        bt.className = 'qt-btns';
        const ds = cacQuai(q);
        ds.forEach(d => bt.appendChild(nutQuai(d.ten, d.nhan)));
        sec.appendChild(bt);

        const trung = ds.filter(d => opened.indexOf(KEY_OF[d.ten]) > -1 && shownKeys.indexOf(KEY_OF[d.ten]) > -1);
        if (trung.length) {
            const n = document.createElement('div');
            n.className = 'qt-note';
            n.textContent = trung.map(d => d.ten).join(', ') + ': đang xem ở Quẻ chủ phía trên (chọn 1 lần).';
            sec.appendChild(n);
        }
        opened.forEach(key => {
            if (ds.some(d => KEY_OF[d.ten] === key) && shownKeys.indexOf(key) === -1) {
                sec.appendChild(taoKhung('p1:' + key, 'p1:' + key, 'Quẻ ' + TEN_OF[key], () => getTuong(key), false));
                shownKeys.push(key);
            }
        });
        return sec;
    }

    function taoChuyen() {
        const wrap = document.createElement('div');
        const ds = tinhChuyen(cur);
        if (!ds.length) {
            const n = document.createElement('div');
            n.className = 'qt-note';
            n.textContent = 'Không xác định được quái động.';
            wrap.appendChild(n);
            return wrap;
        }
        ds.forEach(c => {
            const tieu = c.vi + ' động (hào ' + c.hao.join(', ') + '): ' + c.tu + ' ➔ ' + c.den;
            wrap.appendChild(taoKhung('cvp:' + c.loai + ':' + c.tu + '>' + c.den, 'cv:' + KEY_OF[c.tu] + '>' + KEY_OF[c.den],
                tieu, () => getChuyenHoa(c.tu, c.den), true));
        });
        return wrap;
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        if (!cur) {
            const e = document.createElement('div');
            e.className = 'qt-empty';
            e.textContent = 'Chưa chọn quẻ chủ ở phần trên.';
            bodyEl.appendChild(e);
            return;
        }
        const line = document.createElement('div');
        line.className = 'qt-line';
        line.textContent = cur.text;
        bodyEl.appendChild(line);

        if (cur.bien) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'qt-btn big' + (chuyenOn ? ' on' : '');
            b.textContent = '🔎 Tìm Chuyển Tượng';
            b.onclick = function () { chuyenOn = !chuyenOn; render(); };
            bodyEl.appendChild(b);
            if (chuyenOn) bodyEl.appendChild(taoChuyen());
        } else if (!cur.hao.length) {
            const n = document.createElement('div');
            n.className = 'qt-note';
            n.style.textAlign = 'center';
            n.textContent = 'Quẻ tĩnh: không có hào động nên không có Chuyển Tượng.';
            bodyEl.appendChild(n);
        }

        const shown = [];
        bodyEl.appendChild(taoMuc('Quẻ chủ', cur.chu, shown));
        if (cur.bien) bodyEl.appendChild(taoMuc('Quẻ biến', cur.bien, shown));
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? JSON.stringify([st.chu.ten, st.bien && st.bien.ten, st.hao]) : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        const con = [];
        if (st) [st.chu, st.bien].forEach(q => { if (q) cacQuai(q).forEach(d => con.push(KEY_OF[d.ten])); });
        opened = opened.filter(k => con.indexOf(k) > -1);
        render();
        listeners.forEach(fn => { try { fn(st); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('quetuong:change', { detail: st })); } catch (e) {}
    }

    // ---------- GẮN VÀO total.html ----------
    function hookProcessDich() {
        if (typeof root.processDich !== 'function' || root.processDich.__qt) return;
        const goc = root.processDich;
        const bao = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        bao.__qt = true;
        root.processDich = bao;
    }

    function khoiTao() {
        if (document.getElementById('qtBody')) return;
        themCss();
        const html =
            '<div class="header" style="border-bottom:1px solid var(--gold);padding:5px 0 10px 0;margin-bottom:15px;">' +
            '<h1 style="font-size:1.1rem;">' + CONFIG.tieuDe + '</h1></div><div id="qtBody"></div>';
        if (typeof root.moduleSlot === 'function') root.moduleSlot(html);
        else {
            const d = document.createElement('div');
            d.className = 'box module-container';
            d.innerHTML = html;
            (document.getElementById('module-slots') || document.body).appendChild(d);
        }
        bodyEl = document.getElementById('qtBody');
        hookProcessDich();
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            const rg = document.getElementById('resultGrid');
            if (rg) mo.observe(rg, { childList: true, subtree: true, characterData: true, attributes: true });
            ['selectCung', 'selectQue'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', function () { setTimeout(capNhat, 0); });
            });
        } catch (e) {}
        capNhat(true);
    }

    root.QueTuong = {
        version: '0.2', CONFIG: CONFIG,
        getState: function () { return cur; },
        getOpened: function () { return opened.slice(); },
        getTuong: getTuong,
        getChuyenHoa: getChuyenHoa,
        getChuyenList: function () { return tinhChuyen(cur); },
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parsePart1: parsePart1, parseChuyenHoa: parseChuyenHoa, tinhChuyen: tinhChuyen }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);
