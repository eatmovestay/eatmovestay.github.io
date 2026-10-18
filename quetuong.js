// =========================================================
//  QUETUONG.JS — Module "Quẻ Tượng" (bản sơ khởi v0.1)
//
//  Chức năng:
//   • Tự lấy quẻ chủ / quẻ biến / hào động mà người dùng đã nhập ở total.html.
//   • Hiển thị: "Hỏa Địa Tấn động hào 3 biến Hỏa Sơn Lữ".
//   • Dưới mỗi quẻ có 2 nút quẻ đơn (thượng / hạ). Bấm nút -> lấy phần dữ liệu
//     của quẻ đơn đó từ quetuong.html và hiển thị (có thu gọn / mở rộng).
//   • Quẻ đơn trùng giữa quẻ chủ và quẻ biến chỉ hiện 1 lần, chọn 1 lần.
//
//  Phụ thuộc: chỉ cần total.html (dataDich, selectedDong, bienQueGiam,
//  moduleSlot, #selectCung, #selectQue). KHÔNG phụ thuộc m01–m60.js, nên
//  m09.js … m60.js có hay không đều không ảnh hưởng.
//
//  Liên thông với module khác (window.QueTuong):
//    QueTuong.getState()        -> { chu, bien, hao, text } hoặc null
//    QueTuong.getOpened()       -> mảng mã quẻ đơn đang mở, vd ['ly','khon']
//    QueTuong.getTuong('ly')    -> Promise<{text}|{loi}>  (nhận 'Ly','ly','Cấn','can_cau','Can2'…)
//    QueTuong.onChange(fn)      -> gọi fn(state) mỗi khi quẻ thay đổi
//    sự kiện document 'quetuong:change' (detail = state)
//    QueTuong.CONFIG.dataUrl    -> đổi đường dẫn file dữ liệu nếu cần
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'quetuong.html', tieuDe: 'Quẻ Tượng' };

    // Quẻ đơn đọc từ 3 hào, viết từ TRÊN xuống DƯỚI (khớp chuỗi c trong dataDich)
    const QUAI = { '111':'Càn','011':'Đoài','101':'Ly','001':'Chấn','110':'Tốn','010':'Khảm','100':'Cấn','000':'Khôn' };
    // Mã dùng trong quetuong.html: data-que="..." (cùng quy ước với 8quedon.html)
    const KEY_OF = { 'Càn':'can','Đoài':'doai','Ly':'ly','Chấn':'chan','Tốn':'ton','Khảm':'kham','Cấn':'can_cau','Khôn':'khon' };
    const TEN_OF = {}; Object.keys(KEY_OF).forEach(t => { TEN_OF[KEY_OF[t]] = t; });

    function chuanHoaKey(x) {
        const s = String(x == null ? '' : x).trim();
        if (KEY_OF[s]) return KEY_OF[s];              // 'Ly', 'Cấn', 'Càn'...
        const l = s.toLowerCase();
        if (l === 'can2') return 'can_cau';           // mã Cấn trong dataDich
        return TEN_OF[l] ? l : null;                  // 'ly', 'can', 'can_cau'...
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

    // ---------- LẤY DỮ LIỆU TỪ quetuong.html ----------
    let _docP = null;
    const _cache = {};
    function taiDoc() {
        if (!_docP) {
            _docP = fetch(CONFIG.dataUrl, { cache: 'no-cache' })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
                .then(t => new DOMParser().parseFromString(t, 'text/html'));
            _docP.catch(() => { _docP = null; });      // cho phép thử lại lần sau
        }
        return _docP;
    }

    async function getTuong(keyIn) {
        const key = chuanHoaKey(keyIn);
        if (!key) return { loi: 'Quẻ đơn không hợp lệ: ' + keyIn };
        if (_cache[key]) return _cache[key];
        let res;
        try {
            const doc = await taiDoc();
            let el = doc.querySelector('[data-que="' + key + '"]') || doc.getElementById('que-' + key);
            if (el) { const pre = el.querySelector('pre'); if (pre) el = pre; }
            const text = el ? String(el.textContent || '').replace(/\r/g, '').trim() : '';
            if (!el || !text || /^input here$/i.test(text)) res = { loi: 'Chưa có dữ liệu quẻ ' + TEN_OF[key] + ' trong ' + CONFIG.dataUrl + '.' };
            else res = { text: text };
        } catch (e) {
            res = { loi: 'Không tải được ' + CONFIG.dataUrl + ' (' + e.message + ').' };
        }
        if (!res.loi) _cache[key] = res;
        return res;
    }

    // ---------- GIAO DIỆN ----------
    let cur = null;            // trạng thái hiện tại
    let curSig = '';
    let opened = [];           // thứ tự các quẻ đơn đã mở (mã)
    const collapsed = {};      // key -> true nếu đang thu gọn
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
            '.qt-note{font-size:.7rem;color:#888;margin-top:6px}' +
            '.qt-panel{margin-top:10px;border:1px solid var(--gold,#d4af37);border-radius:10px;overflow:hidden;background:#252525}' +
            '.qt-ph{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;cursor:pointer;background:#2a2a2a;color:var(--gold,#d4af37);font-weight:600;font-size:.9rem}' +
            '.qt-pb{padding:10px 12px;font-size:.85rem;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#eee}' +
            '.qt-pb.loi{color:#e08a8a}' +
            '.qt-panel.qt-collapsed .qt-pb{display:none}';
        document.head.appendChild(st);
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

    function cacQuai(q) {   // danh sách quẻ đơn của 1 quẻ: [{ten, nhan}]
        if (!q.thuong || !q.ha) return [];
        if (q.thuong === q.ha) return [{ ten: q.thuong, nhan: q.thuong + ' (thượng & hạ)' }];
        return [{ ten: q.thuong, nhan: q.thuong + ' thượng' }, { ten: q.ha, nhan: q.ha + ' hạ' }];
    }

    function taoPanel(key) {
        const p = document.createElement('div');
        p.className = 'qt-panel' + (collapsed[key] ? ' qt-collapsed' : '');
        p.setAttribute('data-qt-panel', key);
        const h = document.createElement('div');
        h.className = 'qt-ph';
        const t = document.createElement('span'); t.textContent = 'Quẻ ' + TEN_OF[key];
        const m = document.createElement('span'); m.textContent = collapsed[key] ? '▼ mở rộng' : '▲ thu gọn';
        h.appendChild(t); h.appendChild(m);
        h.onclick = function () {
            collapsed[key] = !collapsed[key];
            p.classList.toggle('qt-collapsed', !!collapsed[key]);
            m.textContent = collapsed[key] ? '▼ mở rộng' : '▲ thu gọn';
        };
        const b = document.createElement('div');
        b.className = 'qt-pb';
        b.textContent = _cache[key] ? _cache[key].text : 'Đang tải…';
        p.appendChild(h); p.appendChild(b);
        if (!_cache[key]) {
            getTuong(key).then(r => {
                const el = bodyEl && bodyEl.querySelector('[data-qt-panel="' + key + '"] .qt-pb');
                if (!el) return;
                el.textContent = r.loi || r.text;
                el.classList.toggle('loi', !!r.loi);
            });
        }
        return p;
    }

    function taoMuc(tieuDe, q, shownKeys, ownerKeys) {
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

        // quẻ đơn đang mở nhưng đã hiển thị ở mục phía trên -> chỉ ghi chú
        const trung = ds.filter(d => opened.indexOf(KEY_OF[d.ten]) > -1 && shownKeys.indexOf(KEY_OF[d.ten]) > -1);
        if (trung.length) {
            const n = document.createElement('div');
            n.className = 'qt-note';
            n.textContent = trung.map(d => d.ten).join(', ') + ': đang xem ở Quẻ chủ phía trên (chọn 1 lần).';
            sec.appendChild(n);
        }
        // panel của các quẻ đơn thuộc mục này và chưa hiển thị
        opened.forEach(key => {
            if (ds.some(d => KEY_OF[d.ten] === key) && shownKeys.indexOf(key) === -1) {
                sec.appendChild(taoPanel(key));
                shownKeys.push(key);
            }
        });
        return sec;
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
        // giữ lại các quẻ đơn còn liên quan, bỏ các quẻ không còn trong quẻ mới
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
        // Dự phòng: theo dõi thay đổi kết quả của total.html
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
        version: '0.1', CONFIG: CONFIG,
        getState: function () { return cur; },
        getOpened: function () { return opened.slice(); },
        getTuong: getTuong,
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);
