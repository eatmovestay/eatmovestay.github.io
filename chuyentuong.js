// =========================================================
//  QUETUONGPLUS.JS — Module "Quẻ Tượng · Chuyển Tượng theo Không Thời" (v1.0)
//  Bản của quetuong.js dành cho trang Liên Hoa Độn Pháp.
//  Dữ liệu lấy từ quetuong.html (cùng thư mục): PART 1 = quẻ tượng cô đọng của quẻ đơn,
//  PART 2 = các mục "CHUYỂN HÓA : X ➔ Y.".
//
//  Cách hoạt động:
//   • Tự lấy các Không Thời từ trang Liên Hoa (kết quả "Lập Quẻ"): 5 / 9 / 13 Không Thời.
//   • Mỗi Không Thời có đúng 1 hào động -> 1 quái đơn động:
//       hào 1–3 = Hạ quái động, hào 4–6 = Thượng quái động.
//       Chuyển Tượng = quái đơn của Chính ➔ quái đơn được biến ở quẻ Biến.
//   • Nút "🔎 Tìm Chuyển Tượng": liệt kê Chuyển Tượng của TỪNG Không Thời, mỗi Không Thời một khung
//     (thu gọn / mở rộng). Lấy dữ liệu bên dưới "CHUYỂN HÓA : X ➔ Y." trong PART 2 của quẻ X,
//     gặp mục CHUYỂN HÓA kế tiếp thì dừng.
//   • Trong mỗi khung có 2 nút quẻ đơn (X và Y) để xem thêm quẻ tượng PART 1 (dừng khi gặp PART 2).
//
//  Phụ thuộc: chỉ trang Liên Hoa (renderResults, clearAll, switchTab, #result1, #result2).
//  Không phụ thuộc các module khác.
//
//  Cho module khác dùng (window.QueTuongPlus):
//    QueTuongPlus.getState()            -> { nguon, results, soKT } hoặc null
//    QueTuongPlus.getChuyenList()       -> [{ kt, hao, vi, tu, den, tuTen, denTen }]  (mỗi Không Thời 1 mục)
//    QueTuongPlus.getChuyenKT(i)        -> Promise<{ kt, vi, tu, den, text | loi }>
//    QueTuongPlus.getAllChuyenKT()      -> Promise<mảng như trên cho mọi Không Thời>
//    QueTuongPlus.getChuyenHoa(1, 3)    -> Promise<{text}|{loi}>   (nhận số 1–8, hoặc tên Kiền/Càn/Ly…)
//    QueTuongPlus.getTuong(3)           -> Promise<{text}|{loi}>   (PART 1)
//    QueTuongPlus.onChange(fn), sự kiện document 'quetuongplus:change'
//    QueTuongPlus.CONFIG.dataUrl        -> đường dẫn file dữ liệu
//  Quái đơn đánh số như trang Liên Hoa: 1 Kiền(Càn), 2 Đoài, 3 Ly, 4 Chấn, 5 Tốn, 6 Khảm, 7 Cấn, 8 Khôn.
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'quetuong.html', tieuDe: 'Quẻ Tượng · Chuyển Tượng' };

    // Tên trang Liên Hoa (1–8) và tên trong dữ liệu quetuong.html
    const TEN_LH = ['', 'Kiền', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'];
    const TEN_DL = ['', 'Càn', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'];
    const KEY_OF = { 'Càn':'can','Kiền':'can','Đoài':'doai','Ly':'ly','Chấn':'chan','Tốn':'ton','Khảm':'kham','Cấn':'can_cau','Khôn':'khon' };
    const TEN_OF = { can:'Càn', doai:'Đoài', ly:'Ly', chan:'Chấn', ton:'Tốn', kham:'Khảm', can_cau:'Cấn', khon:'Khôn' };
    const NUM_KEY = [null, 'can', 'doai', 'ly', 'chan', 'ton', 'kham', 'can_cau', 'khon'];
    const tenQ = n => TEN_LH[n] || '?';

    function chuanHoaKey(x) {
        if (typeof x === 'number' || /^\d$/.test(String(x))) return NUM_KEY[+x] || null;
        const s = String(x == null ? '' : x).trim().normalize('NFC');
        if (KEY_OF[s]) return KEY_OF[s];
        const l = s.toLowerCase();
        if (l === 'can2') return 'can_cau';
        if (l === 'kiền') return 'can';
        return TEN_OF[l] ? l : null;
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
        if (b === 'càn' && a === 'kiền') return true;     // trang Liên Hoa gọi Càn là Kiền
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


    // ---------- ĐỌC KHÔNG THỜI TỪ TRANG LIÊN HOA ----------
    // results[i] = { thuong, ha, hao, hoThuong, hoHa, bienThuong, bienHa } (1 Không Thời)
    function docTrangThai() {
        const act = document.querySelector('.tab-panel.active');
        const id = act && act.id === 'panel2' ? 'result2' : 'result1';
        const a = document.getElementById(id);
        if (!a || !a.classList.contains('visible') || !Array.isArray(a._results) || !a._results.length) return null;
        return { nguon: id, results: a._results, soKT: a._results.length };
    }

    // Mỗi Không Thời: quái đơn động của Chính ➔ quái đơn được biến.
    function tinhChuyen(st) {
        if (!st) return [];
        return st.results.map((q, i) => {
            const thuong = q.hao >= 4;     // hào 4–6 động -> quái thượng; hào 1–3 -> quái hạ
            const tu = thuong ? q.thuong : q.ha;
            const den = thuong ? q.bienThuong : q.bienHa;
            return { kt: i + 1, hao: q.hao, vi: thuong ? 'Thượng quái' : 'Hạ quái', loai: thuong ? 'thuong' : 'ha',
                     tu: tu, den: den, tuTen: tenQ(tu), denTen: tenQ(den) };
        });
    }

    async function getChuyenKT(i) {
        const ds = tinhChuyen(cur);
        const c = ds[i - 1];
        if (!c) return { loi: 'Không có Không Thời ' + i + '.' };
        const r = await getChuyenHoa(c.tu, c.den);
        return Object.assign({ kt: c.kt, hao: c.hao, vi: c.vi, tu: c.tu, den: c.den }, r);
    }
    async function getAllChuyenKT() {
        const ds = tinhChuyen(cur);
        return Promise.all(ds.map(c => getChuyenKT(c.kt)));
    }

    // ---------- TRẠNG THÁI GIAO DIỆN ----------
    let cur = null, curSig = '';
    let chuyenOn = false;
    const collapsed = {};      // panelId -> true/false (chưa có = mặc định)
    const p1Open = {};         // panelId -> mảng mã quẻ đơn đang xem PART 1
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


    function themCssPlus() {
        if (document.getElementById('qtpCss')) return;
        const st = document.createElement('style');
        st.id = 'qtpCss';
        st.textContent =
            '.qtp-box{margin-top:24px;border-top:1px solid var(--border,#5c3d1e);padding-top:20px}' +
            '.qtp-title{font-family:"Cinzel Decorative",serif;font-size:.95rem;color:var(--gold-light,#e8b84b);margin-bottom:12px}' +
            '.qtp-btns{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 2px}' +
            '.qtp-mini{flex:1;min-width:110px;padding:8px 6px;background:transparent;color:#6fdc9a;border:1px solid #2e5e45;border-radius:8px;font-family:inherit;font-size:.75rem;font-weight:600;cursor:pointer}' +
            '.qtp-mini.on{background:#2e5e45;color:#fff}' +
            '.qtp-tools{display:flex;gap:8px;margin:10px 0 0}' +
            '.qtp-tool{padding:6px 10px;background:transparent;color:var(--gold,#c9922a);border:1px solid #555;border-radius:8px;font-family:inherit;font-size:.72rem;cursor:pointer}' +
            '.qtp-p1{margin-top:8px;padding:8px 10px;border:1px solid #3a3a3a;border-radius:8px;background:#1f1f1f}' +
            '.qtp-p1 .qtp-p1t{font-size:.7rem;font-weight:700;color:var(--gold,#c9922a);margin-bottom:6px;text-transform:uppercase}' +
            '.qtp-p1 .qt-pb{padding:0;background:transparent}' +
            '.qtp-tag{font-size:.78rem;color:#6fdc9a;font-weight:700;margin-bottom:8px}';
        document.head.appendChild(st);
    }

    function macDinhThuGon(c) { return c.kt !== 1; }   // KT1 mở sẵn, các KT khác thu gọn
    function dangThuGon(id, c) { return id in collapsed ? collapsed[id] : macDinhThuGon(c); }

    // Khung của 1 Không Thời
    function taoKhungKT(c) {
        const id = 'kt:' + c.kt + ':' + c.tu + '>' + c.den;
        const ten = tenQ(c.tu) + ' ➔ ' + tenQ(c.den);
        const p = document.createElement('div');
        p.className = 'qt-panel cv' + (dangThuGon(id, c) ? ' qt-collapsed' : '');
        p.setAttribute('data-qt-panel', id);
        const h = document.createElement('div');
        h.className = 'qt-ph';
        const t = document.createElement('span');
        t.textContent = 'KT' + c.kt + ' · ' + c.vi + ' động (hào ' + c.hao + '): ' + ten;
        const m = document.createElement('span');
        const dat = () => { m.textContent = dangThuGon(id, c) ? '▼ mở rộng' : '▲ thu gọn'; };
        dat();
        h.appendChild(t); h.appendChild(m);
        h.onclick = function () {
            collapsed[id] = !dangThuGon(id, c);
            p.classList.toggle('qt-collapsed', collapsed[id]);
            dat();
        };
        const b = document.createElement('div');
        b.className = 'qt-pb';

        const cv = document.createElement('div');
        cv.className = 'qtp-cv';
        const cacheKey = 'cv:' + chuanHoaKey(c.tu) + '>' + chuanHoaKey(c.den);
        if (_res[cacheKey]) veNoiDung(cv, _res[cacheKey]);
        else {
            cv.textContent = 'Đang tải…';
            getChuyenHoa(c.tu, c.den).then(r => { veNoiDung(cv, r); });
        }
        b.appendChild(cv);

        // 2 nút xem quẻ tượng PART 1 của quái đơn X và Y
        const nut = document.createElement('div');
        nut.className = 'qtp-btns';
        const vung = document.createElement('div');
        const xem = p1Open[id] || (p1Open[id] = []);
        const veP1 = function () {
            vung.innerHTML = '';
            xem.forEach(so => {
                const box = document.createElement('div');
                box.className = 'qtp-p1';
                const tt = document.createElement('div');
                tt.className = 'qtp-p1t';
                tt.textContent = 'Quẻ tượng ' + tenQ(so);
                const pb = document.createElement('div');
                pb.className = 'qt-pb';
                pb.textContent = 'Đang tải…';
                box.appendChild(tt); box.appendChild(pb);
                vung.appendChild(box);
                getTuong(so).then(r => veNoiDung(pb, r));
            });
        };
        const quai = c.tu === c.den ? [c.tu] : [c.tu, c.den];
        quai.forEach(so => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'qtp-mini' + (xem.indexOf(so) > -1 ? ' on' : '');
            btn.textContent = 'Xem quẻ tượng ' + tenQ(so);
            btn.onclick = function () {
                const i = xem.indexOf(so);
                if (i > -1) xem.splice(i, 1); else xem.push(so);
                btn.classList.toggle('on', xem.indexOf(so) > -1);
                veP1();
            };
            nut.appendChild(btn);
        });
        b.appendChild(nut);
        b.appendChild(vung);
        veP1();

        p.appendChild(h); p.appendChild(b);
        return p;
    }

    function datTatCa(v) {
        tinhChuyen(cur).forEach(c => { collapsed['kt:' + c.kt + ':' + c.tu + '>' + c.den] = v; });
        render();
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        if (!cur) {
            const e = document.createElement('div');
            e.className = 'qt-empty';
            e.textContent = 'Chưa lập quẻ. Hãy nhập số và bấm "Lập Quẻ" ở phía trên.';
            bodyEl.appendChild(e);
            return;
        }
        const q1 = cur.results[0];
        const line = document.createElement('div');
        line.className = 'qt-line';
        line.textContent = cur.soKT + ' Không Thời · quẻ chính ' + tenQ(q1.thuong) + '/' + tenQ(q1.ha) + ' · hào động ' + q1.hao;
        bodyEl.appendChild(line);

        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'qt-btn big' + (chuyenOn ? ' on' : '');
        b.textContent = '🔎 Tìm Chuyển Tượng';
        b.onclick = function () { chuyenOn = !chuyenOn; render(); };
        bodyEl.appendChild(b);

        if (!chuyenOn) {
            const n = document.createElement('div');
            n.className = 'qt-note';
            n.style.textAlign = 'center';
            n.textContent = 'Bấm để xem Chuyển Tượng (quái đơn động ➔ quái đơn được biến) của từng Không Thời.';
            bodyEl.appendChild(n);
            return;
        }

        const tools = document.createElement('div');
        tools.className = 'qtp-tools';
        const g = document.createElement('button'); g.type = 'button'; g.className = 'qtp-tool'; g.textContent = 'Thu gọn tất cả';
        const m = document.createElement('button'); m.type = 'button'; m.className = 'qtp-tool'; m.textContent = 'Mở rộng tất cả';
        g.onclick = function () { datTatCa(true); };
        m.onclick = function () { datTatCa(false); };
        tools.appendChild(g); tools.appendChild(m);
        bodyEl.appendChild(tools);

        tinhChuyen(cur).forEach(c => bodyEl.appendChild(taoKhungKT(c)));
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? st.nguon + '#' + st.results.map(q => [q.thuong, q.ha, q.hao, q.bienThuong, q.bienHa].join(',')).join('|') : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        Object.keys(collapsed).forEach(k => { delete collapsed[k]; });     // lập quẻ mới -> trả về mặc định
        Object.keys(p1Open).forEach(k => { delete p1Open[k]; });
        render();
        listeners.forEach(fn => { try { fn(st); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('quetuongplus:change', { detail: st })); } catch (e) {}
    }

    // ---------- GẮN VÀO TRANG LIÊN HOA ----------
    function bao(ten) {
        if (typeof root[ten] !== 'function' || root[ten].__qtp) return;
        const goc = root[ten];
        const w = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        w.__qtp = true;
        root[ten] = w;
    }

    function khoiTao() {
        if (document.getElementById('qtpBody')) return;
        themCss();
        themCssPlus();
        const box = document.createElement('div');
        box.className = 'qtp-box';
        box.innerHTML = '<div class="qtp-title">' + CONFIG.tieuDe + '</div><div id="qtpBody"></div>';
        (document.querySelector('.container') || document.body).appendChild(box);
        bodyEl = document.getElementById('qtpBody');
        ['renderResults', 'clearAll', 'switchTab'].forEach(bao);
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            ['result1', 'result2'].forEach(id => {
                const a = document.getElementById(id);
                if (a) mo.observe(a, { attributes: true, attributeFilter: ['class'], childList: true });
            });
        } catch (e) {}
        capNhat(true);
    }

    root.QueTuongPlus = {
        version: '1.0', CONFIG: CONFIG,
        getState: function () { return cur; },
        getChuyenList: function () { return tinhChuyen(cur); },
        getChuyenKT: getChuyenKT,
        getAllChuyenKT: getAllChuyenKT,
        getChuyenHoa: getChuyenHoa,
        getTuong: getTuong,
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parsePart1: parsePart1, parseChuyenHoa: parseChuyenHoa, tinhChuyen: tinhChuyen }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);