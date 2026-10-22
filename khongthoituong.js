// =========================================================
//  KHONGTHOI.JS — Module "Không Thời · Tượng Đơn" (v1.0)
//  Dùng cho trang Liên Hoa Độn Pháp (Mai Hoa chẻ nhỏ thành nhiều Không Thời).
//  Dữ liệu tượng lấy từ tuongdonplus.html (khối <script id="td-data">), cùng thư mục.
//
//  Cách hoạt động:
//   • Tự lấy các Không Thời từ trang Liên Hoa (kết quả của "Lập Quẻ"): 5 / 9 / 13 Không Thời.
//   • Có bao nhiêu Không Thời thì có bấy nhiêu nút số (1, 2, 3 … 5 … 9 … 13).
//   • Chọn 1 Không Thời -> hiện 5 nút đơn quái của Không Thời đó:
//       Chính thượng · Chính hạ · Hỗ thượng · Hỗ hạ · Biến (chỉ quái được biến;
//       quái không biến đã trùng với Chính nên bỏ ra).
//   • Lưới 9 tầng thông tin + nút "Dụng Tượng" (20 mục ứng dụng) để tích chọn.
//   • Bấm nút đơn quái -> hiện các mục đã tích (thu gọn / mở rộng).
//
//  Phụ thuộc: chỉ trang Liên Hoa (renderResults, clearAll, switchTab, #result1, #result2).
//  Không phụ thuộc tuongdonplus.js hay các module khác.
//
//  Cho module khác dùng (window.KhongThoi):
//    KhongThoi.getState()        -> { nguon, results, soKT, kt, quai:[5 đơn quái] } hoặc null
//    KhongThoi.getKhongThoi(i)   -> { kt, hao, chinh:{thuong,ha}, ho:{thuong,ha}, bien:{thuong,ha}, quai:[…] }
//    KhongThoi.getAllKhongThoi()  -> mảng tất cả Không Thời
//    KhongThoi.selectKT(i)       -> chọn Không Thời i
//    KhongThoi.getOpened(), KhongThoi.getTicked9(), KhongThoi.getTicked20()
//    KhongThoi.getQue('Càn'|1) / getSection('Càn','C') / getUngDung('Càn',5) / getAll()   (Promise, toàn bộ dữ liệu)
//    KhongThoi.ready, KhongThoi.MUC9, KhongThoi.MUC20, KhongThoi.onChange(fn), sự kiện 'khongthoi:change'
//    KhongThoi.CONFIG.dataUrl
//  Quái đơn đánh số như trang Liên Hoa: 1 Kiền, 2 Đoài, 3 Ly, 4 Chấn, 5 Tốn, 6 Khảm, 7 Cấn, 8 Khôn
//  (trùng ID 1–8 trong tuongdonplus.html).
// =========================================================
(function (root) {
    'use strict';

    const CONFIG = { dataUrl: 'tuongdonplus.html', tieuDe: 'Không Thời · Tượng Đơn', khoa9: 'kt_muc9', khoa20: 'kt_ud20' };
    const EMPTY = 'Không Có !';
    const REF = /^[A-I]\d{2}$/;
    const NOTE = /^không có tượng riêng$/i;

    // 9 tầng thông tin
    const MUC9 = [
        { sec: 'A_DINH_DANH', ma: 'A', ngan: 'Định danh', ten: 'Định danh' },
        { sec: 'B_TUONG_TONG_QUAT', ma: 'B', ngan: 'Tượng tổng quát', ten: 'Tượng tổng quát' },
        { sec: 'C_NHAN_VAT', ma: 'C', ngan: 'Nhân vật', ten: 'Nhân vật' },
        { sec: 'D_TINH_CACH', ma: 'D', ngan: 'Tính cách', ten: 'Tính cách' },
        { sec: 'E_NHAN_THE_TAT_BENH', ma: 'E', ngan: 'Nhân thể, tật bệnh', ten: 'Nhân thể và tật bệnh' },
        { sec: 'F_THIEN_TUONG', ma: 'F', ngan: 'Thiên tượng', ten: 'Thiên tượng' },
        { sec: 'G_VAT_TUONG', ma: 'G', ngan: 'Vật tượng', ten: 'Vật tượng' },
        { sec: 'H_DONG_VAT_NOI_CHON', ma: 'H', ngan: 'Động vật, nơi chốn', ten: 'Động vật và nơi chốn' },
        { sec: 'I_THOI_GIAN_PHUONG_VI_MAU_SAC', ma: 'I', ngan: 'Thời gian, phương vị, màu', ten: 'Thời gian, phương vị, màu sắc' }
    ];
    const SEC_M = 'M_MAP_20_MUC';

    // 20 mục ứng dụng (tên rút gọn cho lưới; tên đầy đủ lấy từ M##.TEN trong dữ liệu)
    const MUC20 = ['Công việc', 'Sự nghiệp', 'Học hành', 'Tình cảm', 'Tiền bạc', 'Quyền lợi, nợ', 'Hợp tác', 'Địa lý', 'Khởi sự', 'Gia đình',
        'Sức khỏe', 'Cầu an', 'Phong thủy', 'Kiện tụng', 'Thời tiết', 'Vật nuôi, cây', 'An ninh', 'Pháp luật', 'Ăn uống', 'Thời điểm']
        .map((n, i) => ({ ma: 'M' + String(i + 1).padStart(2, '0'), ngan: n }));

    const QUAI = { '111':'Càn','011':'Đoài','101':'Ly','001':'Chấn','110':'Tốn','010':'Khảm','100':'Cấn','000':'Khôn' };
    const KEY_OF = { 'Càn':'can','Đoài':'doai','Ly':'ly','Chấn':'chan','Tốn':'ton','Khảm':'kham','Cấn':'can_cau','Khôn':'khon' };
    const TEN_OF = {}; Object.keys(KEY_OF).forEach(t => { TEN_OF[KEY_OF[t]] = t; });
    const ID_OF = { 'Càn':1,'Đoài':2,'Ly':3,'Chấn':4,'Tốn':5,'Khảm':6,'Cấn':7,'Khôn':8 };

    function tachQuai(code) {
        if (!code || code.length !== 6) return { thuong: null, ha: null };
        return { thuong: QUAI[code.slice(0, 3)] || null, ha: QUAI[code.slice(3)] || null };
    }

    // ---------- NHÃN TÊN KHÓA ----------
    const TEN_KHOA = {
        DUC:'Đức', VAT_TUONG_CHINH:'Vật tượng chính', THE_TUONG_CHINH:'Thể tượng chính', QUAN_HE_CHINH:'Quan hệ chính', MUA:'Mùa',
        NGU_TINH:'Ngũ tình', KHI:'Khí', SAC:'Sắc', VI:'Vị', SO:'Số', NGU_HANH:'Ngũ hành', PHUONG_VI_GOC:'Phương vị gốc', MAU_GOC:'Màu gốc',
        TUONG_DAC_BIET:'Tượng đặc biệt', HINH_DANG:'Hình dáng', NHAN_TUONG_CHUNG:'Nhân tượng chung', TRANG_THAI:'Trạng thái',
        HINH_VAT:'Hình vật', MAU_CUC_THINH:'Màu cực thịnh', HANH_VI_TICH_CUC:'Hành vi tích cực', HANH_VI_TRUNG_TINH_HAI_MAT:'Hành vi trung tính / hai mặt',
        HANH_VI_TIEU_CUC:'Hành vi tiêu cực', GHI_CHU:'Ghi chú', TUONG_CAU_NOI:'Tượng câu nói', BAN_CHAT:'Bản chất',
        TUONG_Y_TICH_CUC:'Tượng ý tích cực', TUONG_Y_TRUNG_TINH_HAI_MAT:'Tượng ý trung tính / hai mặt', TUONG_Y_TIEU_CUC:'Tượng ý tiêu cực',
        TUONG_Y_GHI_CHU:'Ghi chú tượng ý', NGUYEN_TAC:'Nguyên tắc', TICH_CUC:'Tích cực', GIOI_HAN:'Giới hạn', TIEU_CUC:'Tiêu cực',
        BO_PHAN:'Bộ phận', THE_CHAT:'Thể chất', THOI_TIET:'Thời tiết', DONG_VAT:'Động vật',
        THOI_GIAN_LOI:'Thời gian lợi', THOI_GIAN_BAT_LOI_NANG:'Thời gian bất lợi nặng', THOI_GIAN_BAT_LOI_NHE:'Thời gian bất lợi nhẹ',
        PHUONG_VI_LOI:'Phương vị lợi', PHUONG_VI_KY_NANG:'Phương vị kỵ nặng', PHUONG_VI_KY_NHE:'Phương vị kỵ nhẹ',
        MAU_LOI:'Màu lợi', MAU_KY_NANG:'Màu kỵ nặng', MAU_KY_NHE:'Màu kỵ nhẹ', KHONG_PHAN_MUC:'Chưa phân mục',
        NHAN_VAT_LIEN_QUAN:'Nhân vật liên quan', REF:'Tham chiếu',
        TINH_YEU_TICH_CUC:'Tình yêu – tích cực', TINH_YEU_TIEU_CUC:'Tình yêu – tiêu cực', HON_NHAN_TICH_CUC:'Hôn nhân – tích cực',
        HON_NHAN_TIEU_CUC:'Hôn nhân – tiêu cực', QUAN_HE_KHAC_TICH_CUC:'Quan hệ khác – tích cực', QUAN_HE_KHAC_TIEU_CUC:'Quan hệ khác – tiêu cực',
        DOI_NO_TICH_CUC:'Đòi nợ – tích cực', DOI_NO_TIEU_CUC:'Đòi nợ – tiêu cực', CHO_MUON_TICH_CUC:'Cho mượn – tích cực',
        CHO_MUON_TIEU_CUC:'Cho mượn – tiêu cực', ONG_BA:'Ông bà', CHA_ME:'Cha mẹ', VO_CHONG:'Vợ chồng', CON_CHAU:'Con cháu',
        TAT_BENH:'Tật bệnh', QUY_NHAN:'Quý nhân', THAY_THUOC:'Thầy thuốc', CAU_AN:'Cầu an', LUU_Y:'Lưu ý', PHONG_THUY:'Phong thủy',
        TAM_LINH:'Tâm linh', TON_GIAO:'Tôn giáo', RUI_RO:'Rủi ro', VAT_NUOI:'Vật nuôi', CAY_TRAI:'Cây trái', MUA_MANG:'Mùa màng',
        THUAN_LOI:'Thuận lợi', KHO_KHAN_NANG:'Khó khăn nặng', KHO_KHAN_NHE:'Khó khăn nhẹ',
        // --- tầng B ---
        TUONG_AM_THANH_HOAT_DONG:'Tượng âm thanh, hoạt động', TUONG_KHAC_DAU_QUE:'Tượng khác (đầu quẻ)', LOAI_SU_VAT_THUOC_KHON:'Loại sự vật thuộc Khôn',
        // --- tầng C ---
        CAP_TREN_QUYEN_LUC:'Cấp trên, quyền lực', QUAN_CHUC_THANH_NHAN:'Quan chức, thánh nhân', GIA_DINH:'Gia đình', GIA_DINH_NU:'Gia đình (nữ)',
        GIA_DINH_NAM:'Gia đình (nam)', GIA_DINH_PHU_NU:'Gia đình, phụ nữ', PHAP_LUAT_AN_NINH:'Pháp luật, an ninh', KINH_TE_TIEN_BAC:'Kinh tế, tiền bạc',
        HANH_CHINH:'Hành chính', DANH_VONG_CHUYEN_MON:'Danh vọng, chuyên môn', BIEN_THE_QUA_MUC:'Biến thể quá mức', BIEN_THE_THIEU_MUC:'Biến thể thiếu mức',
        BAN_BE_QUAN_HE:'Bạn bè, quan hệ', NGHE_MANG_TINH_VUI_VE:'Nghề mang tính vui vẻ', NGHE_MANG_TINH_PHA_HOAI:'Nghề mang tính phá hoại',
        GIAO_DUC_DIEN_THUYET:'Giáo dục, diễn thuyết', Y_TE:'Y tế', THUC_PHAM_DICH_VU_KIM_KHI:'Thực phẩm, dịch vụ, kim khí',
        HANH_CHINH_TRUYEN_DAT:'Hành chính, truyền đạt', VE_SINH:'Vệ sinh', QUAN_LAI_HINH_PHAP:'Quan lại, hình pháp', NHAN_CACH_TIEU_CUC:'Nhân cách tiêu cực',
        NHAN_CACH_TICH_CUC:'Nhân cách tích cực', VAN_HOA:'Văn hóa', THAN_THE:'Thân thể', QUAN_SU_AN_NINH:'Quân sự, an ninh', CHI_HUY_DAU_NAO:'Chỉ huy, đầu não',
        PHUC_VU_HANH_CHINH:'Phục vụ, hành chính', TAM_LINH_TON_GIAO:'Tâm linh, tôn giáo', THUONG_MAI_GIAO_TE:'Thương mại, giao tế',
        CHUYEN_MON_KY_THUAT:'Chuyên môn, kỹ thuật', VAN_CHUONG:'Văn chương', DAC_DIEM_NGOAI_HINH_TINH_THAN:'Đặc điểm ngoại hình, tinh thần',
        GIANG_HO_THUY:'Giang hồ, thủy', TRI_THUC_SANG_TAO:'Tri thức, sáng tạo', DICH_VU_KY_THUAT_AN_NINH:'Dịch vụ, kỹ thuật, an ninh',
        HOAN_CANH_KHO_KHAN:'Hoàn cảnh khó khăn', BENH_TAT_NGHIEN:'Bệnh tật, nghiện', CANH_GAC_DAN_DAU:'Canh gác, dẫn đầu',
        QUAN_CHUC_QUAN_CHUNG:'Quan chức, quần chúng', NGHE_NGHIEP:'Nghề nghiệp', AM_SU:'Âm sự', CHI_HUY:'Chỉ huy',
        // --- tầng E ---
        TAT_BENH_VUNG:'Tật bệnh theo vùng', TAT_BENH_TINH_CHAT:'Tật bệnh theo tính chất', TAT_BENH_MIENG_HO_HAP:'Tật bệnh miệng, hô hấp',
        TAT_BENH_THAN_SINH_DUC_HAU_MON:'Tật bệnh thận, sinh dục, hậu môn', TAT_BENH_MAU:'Tật bệnh máu', TAT_BENH_NGOAI_THUONG:'Tật bệnh ngoại thương',
        TAT_BENH_MAT_TIM_MAU:'Tật bệnh mắt, tim, máu', TAT_BENH_NHIET_VIEM:'Tật bệnh nhiệt, viêm', TAT_BENH_TUYEN_PHU_KHOA:'Tật bệnh tuyến, phụ khoa',
        TAT_BENH_VUNG_CO_THE:'Tật bệnh vùng cơ thể', TAT_BENH_THAN_KINH_TINH_THAN:'Tật bệnh thần kinh, tinh thần', TRIEU_CHUNG:'Triệu chứng',
        TAT_BENH_PHONG_HAN_HO_HAP:'Tật bệnh phong hàn, hô hấp', TAT_BENH_THAN_KINH:'Tật bệnh thần kinh', TINH_CHAT:'Tính chất',
        TAT_BENH_THAN_TIET_NIEU:'Tật bệnh thận, tiết niệu', TAT_BENH_MAU_MIEN_DICH:'Tật bệnh máu, miễn dịch', TAT_BENH_SINH_DUC:'Tật bệnh sinh dục',
        TAT_BENH_KHAC:'Tật bệnh khác', TAT_BENH_TIEU_HOA:'Tật bệnh tiêu hóa', TAT_BENH_TAY_CHAN_KHOP_MUI:'Tật bệnh tay, chân, khớp, mũi',
        TAT_BENH_KHI_HUYET:'Tật bệnh khí huyết',
        // --- tầng G ---
        KIM_LOAI_QUY:'Kim loại quý', BAO_VAT_CO_VAT:'Bảo vật, cổ vật', TIEN_BAC:'Tiền bạc', VAT_DUNG_CAO_CAP:'Vật dụng cao cấp', PHUONG_TIEN:'Phương tiện',
        MAY_MOC_KIM_LOAI:'Máy móc, kim loại', HINH_TRON_THUC_VAT:'Hình tròn, thực vật', TUONG:'Tượng', AN_UONG_DUNG_CU_NUOC:'Ăn uống, dụng cụ, nước',
        KIM_LOAI:'Kim loại', DO_CHOI_NHAC_CU:'Đồ chơi, nhạc cụ', DO_MIENG_MO:'Đồ miệng mở', HU_HONG_KHIEM_KHUYET:'Hư hỏng, khiếm khuyết',
        THUC_VAT:'Thực vật', DONG_HO:'Đồng hồ', VAN_HOC_NGHE_THUAT_SACH:'Văn học, nghệ thuật, sách', GIAY_TO_PHAP_LY_TAI_CHINH:'Giấy tờ, pháp lý, tài chính',
        TRANG_TRI_QUANG_CAO:'Trang trí, quảng cáo', DIEN_LUA_NHIET:'Điện, lửa, nhiệt', VU_KHI_LUA:'Vũ khí lửa', THUC_PHAM:'Thực phẩm', DO_CHUA_KINH:'Đồ chứa, kính',
        AM_THANH:'Âm thanh', VU_KHI:'Vũ khí', QUAN_AO:'Quần áo', KHAC:'Khác', GO_SOI:'Gỗ, sợi', VAT_DAI_ONG_MONG:'Vật dài, ống, mỏng',
        VU_KHI_CONG_CU:'Vũ khí, công cụ', GIO_THONG_KHI:'Gió, thông khí', BUU_CHINH:'Bưu chính', THUC_VAT_HUONG_LIEU:'Thực vật, hương liệu',
        QUA_HAT:'Quả, hạt', DO_UONG_CHAT_LONG:'Đồ uống, chất lỏng', HOA_CHAT_DUOC:'Hóa chất, dược', TUU_CU:'Tửu cụ', THIET_BI_NUOC:'Thiết bị nước',
        XE_CUNG:'Xe, cung', PHAP_LUAT_HINH_PHAT:'Pháp luật, hình phạt', CONG_NGHE:'Công nghệ', AM_THUC:'Ẩm thực', MAU_DEN:'Màu đen',
        DA_GO_CUNG:'Đá, gỗ cứng', NOI_THAT:'Nội thất', KIEN_TRUC_CUA:'Kiến trúc, cửa', DO_DUNG:'Đồ dùng', TAI_CHINH_CAT_GIU:'Tài chính, cất giữ',
        AM_PHAN_GO:'Âm phần, gò', DAT_DAI_KHU_VUC:'Đất đai, khu vực', HINH_THE_CHAT:'Hình thể, chất', VAI_VOC_DO_DUNG:'Vải vóc, đồ dùng',
        CHUA_DUNG_PHUONG_TIEN:'Chứa đựng, phương tiện', VAT_LIEU_XAY_DUNG:'Vật liệu xây dựng', NONG_SAN_THUC_PHAM:'Nông sản, thực phẩm',
        // --- tầng H ---
        KIEN_TRUC_QUYEN_LUC:'Kiến trúc quyền lực', KIEN_TRUC_VAN_HOA_TON_GIAO:'Kiến trúc văn hóa, tôn giáo', GIAO_THONG_DIA_HINH:'Giao thông, địa hình',
        DAT_NUOC_TRUNG:'Đất, nước, trũng', AM_THUC_GIAI_TRI:'Ẩm thực, giải trí', HOI_HOP_QUAN_HE:'Hội họp, quan hệ', KIEN_TRUC_GIAO_LO:'Kiến trúc, giao lộ',
        RAC_PHE_THAI:'Rác, phế thải', HANG_DONG_AM_PHAN:'Hang động, âm phần', NHA_CU:'Nhà cũ', DONG_VAT_CHIM:'Động vật – chim',
        DONG_VAT_CA_BO_SAT:'Động vật – cá, bò sát', DONG_VAT_VO_CUNG_COT_TRUNG:'Động vật – vỏ cứng, côn trùng', DIA_THE_THANH_DIA:'Địa thế, thánh địa',
        VAN_HOA_GIAO_DUC:'Văn hóa, giáo dục', TAI_CHINH:'Tài chính', NANG_LUONG_Y_TE_NHIET:'Năng lượng, y tế, nhiệt', KIEN_TRUC_GIAO_THONG:'Kiến trúc, giao thông',
        QUAN_SU_PHAP_LUAT:'Quân sự, pháp luật', SAN_BAN_CAU_CA:'Săn bắn, câu cá', TU_NHIEN:'Tự nhiên', NHA_O:'Nhà ở',
        AM_NHAC_VAN_HOA_THUONG_MAI:'Âm nhạc, văn hóa, thương mại', DO_THI_ON_AO:'Đô thị, ồn ào', GIAO_THONG:'Giao thông', DONG_VAT_GIA_CAM:'Động vật – gia cầm',
        DONG_VAT_KHAC:'Động vật – khác', TU_NHIEN_DUONG:'Tự nhiên, đường', THONG_DAO_KY_THUAT:'Thông đạo, kỹ thuật', BUU_CANG_GIAO_THONG:'Bưu cảng, giao thông',
        CONG_NGHE_THIET_KE:'Công nghệ, thiết kế', NUOC_TU_NHIEN:'Nước tự nhiên', CONG_NGHIEP_NUOC:'Công nghiệp nước', TOI_AM_HAM:'Tối, ẩm, hầm',
        GIAM_GIU_DEN:'Giam giữ', DONG_VAT_RANG_SUNG:'Động vật răng, sừng', DONG_VAT_MO:'Động vật mỏ', DIA_HINH:'Địa hình', TON_GIAO_AM_PHAN:'Tôn giáo, âm phần',
        KIEN_TRUC:'Kiến trúc', KHO_NGAN_HANG:'Kho, ngân hàng', KHU_VUC_DAT_DAI:'Khu vực đất đai', KIEN_TRUC_NHA_O:'Kiến trúc, nhà ở',
        KHO_THI_TRUONG:'Kho, thị trường', CHAN_NUOI_CHE_BIEN:'Chăn nuôi, chế biến'
    };
    function nhanTruong(name) {
        if (TEN_KHOA[name]) return TEN_KHOA[name];
        if (/^LY_GIAI_\d+$/.test(name)) return 'Lý giải';
        const hoa = s => s.charAt(0).toUpperCase() + s.slice(1);
        const th = s => s.replace(/_/g, ' ').toLowerCase();
        if (name.indexOf('TUONG_CAU_NOI_') === 0) {
            const hau = { DAT:'đất', KHAC:'khác', NGUOI:'người', CAY:'cây', NGUA:'ngựa', TRONG_TROT:'trồng trọt', XE:'xe' };
            const k = name.slice(14);
            return 'Tượng câu nói – ' + (hau[k] || th(k));
        }
        return hoa(th(name));
    }

    // ---------- PHÂN TÍCH DỮ LIỆU ----------
    function tachGiaTri(v) {
        return String(v).split('|').map(s => s.trim()).filter(s => s && !NOTE.test(s));
    }

    function parseData(text) {
        const issues = [], ques = [];
        let cur = null, sec = null;
        String(text).replace(/\r/g, '').split('\n').forEach(raw => {
            const l = raw.normalize('NFC').trim();
            if (!l || l.indexOf('```') === 0) return;
            if (l === '[QUE]') { cur = { meta: {}, secs: {}, list: [], byCode: {}, end: null }; sec = null; ques.push(cur); return; }
            if (!cur) return;
            if (/^\[HET_/.test(l)) { cur.end = l; cur = null; sec = null; return; }
            let m = l.match(/^\[([A-Z0-9_]+)\]$/);
            if (m) { sec = m[1]; cur.secs[sec] = []; return; }
            m = l.match(/^([A-Z]\d{2})\.([A-Z0-9_]+)=(.*)$/);
            if (m && sec) {
                const vals = tachGiaTri(m[3]);
                const e = { sec: sec, code: m[1], name: m[2], label: nhanTruong(m[2]), vals: vals,
                            isRef: vals.length > 0 && vals.every(x => REF.test(x)) };
                cur.secs[sec].push(e); cur.list.push(e);
                if (sec !== SEC_M) (cur.byCode[e.code] = cur.byCode[e.code] || []).push(e);
                return;
            }
            m = l.match(/^([A-Z_]+)=(.*)$/);
            if (m && !sec) cur.meta[m[1]] = m[2].trim();
        });

        ques.forEach(q => {
            q.id = parseInt(q.meta.ID, 10);
            q.ten = q.meta.TEN || '';
            const tag = 'Quẻ ' + (q.ten || '?');
            if (isNaN(q.id)) issues.push(tag + ': thiếu ID');
            if (!q.end) issues.push(tag + ': thiếu dòng [HET_QUE_…]');
            MUC9.concat([{ sec: SEC_M }]).forEach(s => { if (!q.secs[s.sec]) issues.push(tag + ': thiếu tầng [' + s.sec + ']'); });
            q.list.forEach(e => {
                if (e.isRef) e.vals.forEach(c => { if (!q.byCode[c]) issues.push(tag + ': ' + e.code + '.' + e.name + ' trỏ tới mã không có ' + c); });
            });
        });
        if (ques.length && ques.length !== 8) issues.push('Có ' + ques.length + ' quẻ, cần 8');
        return { ok: true, ques: ques, issues: issues };
    }

    // ---------- TẢI tuongdonplus.html ----------
    let _loadP = null;
    let _dataLast = null;

    function load() {
        if (_loadP) return _loadP;
        _loadP = fetch(CONFIG.dataUrl, { cache: 'no-cache' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const blk = doc.getElementById('td-data');
                if (!blk) throw new Error('không thấy khối td-data');
                return parseData(blk.textContent);
            })
            .catch(e => { _loadP = null; return { ok: false, loi: 'Không tải được ' + CONFIG.dataUrl + ' (' + e.message + ').' }; });
        return _loadP;
    }

    function timQue(d, x) {
        const s = String(x == null ? '' : x).normalize('NFC').trim();
        if (/^\d+$/.test(s)) return d.ques.find(q => q.id === +s) || null;
        let ten = s;
        const l = s.toLowerCase();
        if (TEN_OF[l]) ten = TEN_OF[l];
        if (l === 'can2') ten = 'Cấn';
        const t = ten.toLowerCase();
        return d.ques.find(q => q.ten.toLowerCase() === t || String(q.meta.TEN_KHAC || '').toLowerCase() === t) || null;
    }
    function timTang(x) {
        const s = String(x == null ? '' : x).normalize('NFC').trim().toLowerCase();
        return MUC9.find(m => m.sec.toLowerCase() === s || m.ma.toLowerCase() === s || m.ten.toLowerCase() === s || m.ngan.toLowerCase() === s) || null;
    }
    function timUngDung(x) {
        const s = String(x == null ? '' : x).normalize('NFC').trim().toLowerCase();
        if (/^\d+$/.test(s)) return MUC20[+s - 1] || null;
        return MUC20.find(m => m.ma.toLowerCase() === s || m.ngan.toLowerCase() === s) || null;
    }

    async function getQue(x) {
        const d = await load();
        if (!d.ok) return { loi: d.loi };
        return timQue(d, x) || { loi: 'Chưa có dữ liệu quẻ ' + x + ' trong ' + CONFIG.dataUrl + '.' };
    }
    async function getSection(qx, tx) {
        const q = await getQue(qx);
        if (q.loi) return q;
        const t = timTang(tx);
        if (!t) return { loi: 'Tầng không hợp lệ: ' + tx };
        return { ten: q.ten, sec: t.sec, title: t.ten, entries: (q.secs[t.sec] || []).slice() };
    }
    async function getValue(qx, code) {
        const q = await getQue(qx);
        if (q.loi) return q;
        return q.byCode[code] ? q.byCode[code].slice() : { loi: 'Quẻ ' + q.ten + ' không có mã ' + code + '.' };
    }
    function trichUngDung(q, ma) {
        const es = (q.secs[SEC_M] || []).filter(e => e.code === ma);
        if (!es.length) return null;
        const ten = es.find(e => e.name === 'TEN');
        return {
            ma: ma, ten: ten && ten.vals[0] ? ten.vals[0] : ma,
            truong: es.filter(e => e.name !== 'TEN').map(e => ({
                name: e.name, label: e.label, vals: e.vals, isRef: e.isRef,
                refs: e.isRef ? e.vals.map(c => ({ code: c, entries: q.byCode[c] || [] })) : []
            }))
        };
    }
    async function getUngDung(qx, mx) {
        const q = await getQue(qx);
        if (q.loi) return q;
        const m = timUngDung(mx);
        if (!m) return { loi: 'Mục ứng dụng không hợp lệ: ' + mx };
        return trichUngDung(q, m.ma) || { loi: 'Quẻ ' + q.ten + ' chưa có mục ' + m.ma + '.' };
    }
    async function getAll() {
        const d = await load();
        return d.ok ? d.ques : { loi: d.loi };
    }


    // ---------- TÊN QUÁI ĐƠN THEO TRANG LIÊN HOA ----------
    const TEN_LH = ['', 'Kiền', 'Đoài', 'Ly', 'Chấn', 'Tốn', 'Khảm', 'Cấn', 'Khôn'];
    const tenQ = n => TEN_LH[n] || '?';

    // ---------- ĐỌC KHÔNG THỜI TỪ TRANG LIÊN HOA ----------
    // Mỗi phần tử results[i] = { thuong, ha, hao, hoThuong, hoHa, bienThuong, bienHa } (1 Không Thời)
    function tinhQuai(q) {
        const bienThuongDoi = q.hao >= 4;       // hào 4–6 động -> quái thượng biến; hào 1–3 -> quái hạ biến
        return [
            { pos: 'ct', so: q.thuong, vaiTro: 'Chính thượng' },
            { pos: 'ch', so: q.ha, vaiTro: 'Chính hạ' },
            { pos: 'ht', so: q.hoThuong, vaiTro: 'Hỗ thượng' },
            { pos: 'hh', so: q.hoHa, vaiTro: 'Hỗ hạ' },
            bienThuongDoi ? { pos: 'bien', so: q.bienThuong, vaiTro: 'Biến thượng' }
                          : { pos: 'bien', so: q.bienHa, vaiTro: 'Biến hạ' }
        ].map(x => Object.assign(x, { ten: tenQ(x.so) }));
    }
    function moTaKT(i, q) {
        return {
            kt: i + 1, hao: q.hao,
            chinh: { thuong: q.thuong, ha: q.ha },
            ho: { thuong: q.hoThuong, ha: q.hoHa },
            bien: { thuong: q.bienThuong, ha: q.bienHa },
            quai: tinhQuai(q)
        };
    }

    function docTrangThai() {
        const act = document.querySelector('.tab-panel.active');
        const id = act && act.id === 'panel2' ? 'result2' : 'result1';
        const a = document.getElementById(id);
        if (!a || !a.classList.contains('visible') || !Array.isArray(a._results) || !a._results.length) return null;
        return { nguon: id, results: a._results, soKT: a._results.length };
    }

    // ---------- TRẠNG THÁI GIAO DIỆN ----------
    let cur = null, curSig = '';
    let ktSel = 1;
    let opened = [];
    const thuGon = {};
    let tick9 = [], tick20 = [], udMo = false;
    const listeners = [];
    let bodyEl = null, ketQuaEl = null;

    function docLuu(khoa, hopLe) {
        try {
            const v = JSON.parse(root.localStorage.getItem(khoa) || '[]');
            return Array.isArray(v) ? v.filter(x => hopLe.indexOf(x) > -1) : [];
        } catch (e) { return []; }
    }
    function ghiLuu(khoa, v) { try { root.localStorage.setItem(khoa, JSON.stringify(v)); } catch (e) {} }

    function themCss() {
        if (document.getElementById('tdpCss')) return;
        const st = document.createElement('style');
        st.id = 'tdpCss';
        st.textContent =
            '.tdp-line{font-size:1rem;font-weight:600;color:var(--gold,#d4af37);text-align:center;margin-bottom:12px;line-height:1.4}' +
            '.tdp-empty{font-size:.85rem;color:#888;text-align:center}' +
            '.tdp-lbl{font-size:.7rem;font-weight:600;color:#aaa;text-transform:uppercase;margin:12px 0 6px}' +
            '.tdp-btns{display:flex;gap:8px;flex-wrap:wrap}' +
            '.tdp-btn{flex:1;min-width:96px;padding:9px 6px;background:transparent;color:var(--gold,#d4af37);border:1px solid var(--gold,#d4af37);border-radius:8px;font-family:inherit;cursor:pointer;line-height:1.25}' +
            '.tdp-btn b{display:block;font-size:.95rem}.tdp-btn small{display:block;font-size:.62rem;opacity:.85;font-weight:400}' +
            '.tdp-btn.on{background:var(--gold,#d4af37);color:#000}' +
            '.tdp-ud{width:100%;margin-top:12px;padding:11px;background:transparent;color:var(--gold,#d4af37);border:1px solid var(--gold,#d4af37);border-radius:10px;font-family:inherit;font-size:.85rem;font-weight:700;cursor:pointer}' +
            '.tdp-ud.on{background:var(--gold,#d4af37);color:#000}' +
            '.tdp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}' +
            '.tdp-chipg{padding:8px 3px;background:#252525;color:#bbb;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:.72rem;line-height:1.2;text-align:center;cursor:pointer;min-height:36px;display:flex;align-items:center;justify-content:center}' +
            '.tdp-chipg.on{background:var(--gold,#d4af37);color:#000;border-color:var(--gold,#d4af37);font-weight:700}' +
            '.tdp-tools{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}' +
            '.tdp-mini{padding:6px 10px;background:transparent;color:var(--gold,#d4af37);border:1px solid #555;border-radius:8px;font-family:inherit;font-size:.72rem;cursor:pointer}' +
            '.tdp-dem{font-size:.7rem;color:#888;margin-left:auto}' +
            '.tdp-note{font-size:.7rem;color:#c9a14a;margin-top:8px;line-height:1.4}' +
            '.tdp-panel{margin-top:10px;border:1px solid var(--gold,#d4af37);border-radius:10px;overflow:hidden;background:#252525}' +
            '.tdp-ph{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;background:#2a2a2a;color:var(--gold,#d4af37);font-weight:600;font-size:.9rem}' +
            '.tdp-ph span:last-child,.tdp-sh span:last-child{font-size:.68rem;font-weight:400;color:#aaa;white-space:nowrap}' +
            '.tdp-pb{padding:6px 8px 8px}' +
            '.tdp-gl{font-size:.68rem;font-weight:700;color:#6fdc9a;text-transform:uppercase;margin:10px 2px 2px}' +
            '.tdp-sub{margin-top:6px;border:1px solid #3a3a3a;border-radius:8px;overflow:hidden;background:#1f1f1f}' +
            '.tdp-sub.ud{border-color:#2e5e45}' +
            '.tdp-sh{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;background:#2c2c2c;color:#e8d48a;font-size:.82rem;font-weight:600}' +
            '.tdp-sub.ud .tdp-sh{color:#6fdc9a}' +
            '.tdp-sb{padding:8px 10px;font-size:.82rem;line-height:1.5;color:#eee}' +
            '.tdp-row{padding:7px 0;border-top:1px solid #333}.tdp-row:first-child{border-top:0;padding-top:0}' +
            '.tdp-k{font-size:.72rem;color:#9aa;margin-bottom:4px}.tdp-k b{color:var(--gold,#d4af37);margin-right:5px}' +
            '.tdp-chips{display:flex;flex-wrap:wrap;gap:5px}' +
            '.tdp-chip{background:#333;color:#eee;padding:3px 9px;border-radius:7px;font-size:.8rem;border:1px solid transparent;font-family:inherit;line-height:1.35;text-align:left}' +
            '.tdp-chip.empty{background:#3a2520;color:#e08a73}' +
            'button.tdp-chip.ref{background:transparent;border-color:#6fdc9a;color:#6fdc9a;cursor:pointer}' +
            'button.tdp-chip.ref.on{background:#6fdc9a;color:#000}' +
            '.tdp-bl{margin:0 0 3px 0;padding-left:12px;position:relative;word-break:break-word}' +
            '.tdp-bl::before{content:"•";position:absolute;left:0;color:var(--gold,#d4af37)}' +
            '.tdp-refx{display:none;margin-top:6px;padding:6px 8px;border-left:2px solid #6fdc9a;background:#262626;border-radius:4px}' +
            '.tdp-refitem{margin-bottom:6px}.tdp-refitem:last-child{margin-bottom:0}' +
            '.tdp-miss{font-size:.78rem;color:#e08a8a;font-style:italic}' +
            '.tdp-collapsed>.tdp-pb,.tdp-collapsed>.tdp-sb{display:none}' +
            '@media(max-width:340px){.tdp-grid{grid-template-columns:repeat(2,1fr)}}';
        document.head.appendChild(st);
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function khoiGap(loai, id, tieu, phu, cls, noiDung) {
        const box = el('div', (loai === 'q' ? 'tdp-panel' : 'tdp-sub') + (cls ? ' ' + cls : ''));
        if (thuGon[id]) box.classList.add('tdp-collapsed');
        const h = el('div', loai === 'q' ? 'tdp-ph' : 'tdp-sh');
        h.appendChild(el('span', null, tieu));
        const mui = el('span', null, (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn'));
        h.appendChild(mui);
        h.onclick = function () {
            thuGon[id] = !thuGon[id];
            box.classList.toggle('tdp-collapsed', !!thuGon[id]);
            mui.textContent = (phu ? phu + ' · ' : '') + (thuGon[id] ? '▼ mở' : '▲ gọn');
        };
        const b = el('div', loai === 'q' ? 'tdp-pb' : 'tdp-sb');
        noiDung(b);
        box.appendChild(h); box.appendChild(b);
        return box;
    }

    // ---------- VẼ GIÁ TRỊ MỘT MỤC ----------
    function veNhan(e) {
        const k = el('div', 'tdp-k');
        k.appendChild(el('b', null, e.code));
        k.appendChild(document.createTextNode(e.label));
        return k;
    }
    function veChips(parent, e) {
        const c = el('div', 'tdp-chips');
        if (!e.vals.length) c.appendChild(el('span', 'tdp-chip empty', EMPTY));
        e.vals.forEach(v => c.appendChild(el('span', 'tdp-chip', v)));
        parent.appendChild(c);
    }
    function veBullets(parent, e) {
        if (!e.vals.length) { parent.appendChild(el('span', 'tdp-chip empty', EMPTY)); return; }
        e.vals.forEach(v => parent.appendChild(el('div', 'tdp-bl', v)));
    }
    function veRef(parent, q, e) {
        const row = el('div', 'tdp-chips');
        const mo = {};
        const box = el('div', 'tdp-refx');
        function veBox() {
            box.innerHTML = '';
            Object.keys(mo).filter(k => mo[k]).forEach(code => {
                const ds = q.byCode[code];
                if (!ds) { box.appendChild(el('div', 'tdp-miss', 'Quẻ ' + q.ten + ' không có mã ' + code + '.')); return; }
                ds.forEach(t => {
                    const it = el('div', 'tdp-refitem');
                    it.appendChild(veNhan(t));
                    veGiaTri(it, q, t, 'chip');
                    box.appendChild(it);
                });
            });
            box.style.display = box.childNodes.length ? 'block' : 'none';
        }
        e.vals.forEach(code => {
            const ds = q.byCode[code];
            const c = el('button', 'tdp-chip ref', code + ' ' + (ds ? ds[0].label : '?'));
            c.type = 'button';
            c.onclick = function () { mo[code] = !mo[code]; c.classList.toggle('on', !!mo[code]); veBox(); };
            row.appendChild(c);
        });
        parent.appendChild(row);
        parent.appendChild(box);
    }
    function veGiaTri(parent, q, e, kieu) {
        if (e.isRef) veRef(parent, q, e);
        else if (kieu === 'bullet') veBullets(parent, e);
        else veChips(parent, e);
    }

    // ---------- PANEL QUẺ ĐƠN ----------
    function veTang(b, q, t) {
        const es = q.secs[t.sec] || [];
        if (!es.length) { b.appendChild(el('div', 'tdp-miss', 'Quẻ ' + q.ten + ' chưa có dữ liệu tầng này.')); return es; }
        es.forEach(e => {
            const r = el('div', 'tdp-row');
            r.appendChild(veNhan(e));
            veGiaTri(r, q, e, 'chip');
            b.appendChild(r);
        });
        return es;
    }
    function veUngDung(b, q, ma) {
        const u = trichUngDung(q, ma);
        if (!u) { b.appendChild(el('div', 'tdp-miss', 'Quẻ ' + q.ten + ' chưa có mục ' + ma + '.')); return null; }
        const es = (q.secs[SEC_M] || []).filter(e => e.code === ma && e.name !== 'TEN');
        es.forEach(e => {
            const r = el('div', 'tdp-row');
            const k = el('div', 'tdp-k'); k.appendChild(el('b', null, e.label)); r.appendChild(k);
            veGiaTri(r, q, e, 'bullet');
            b.appendChild(r);
        });
        return u;
    }

    function ghiChuDuLieu() {
        if (!_dataLast || !_dataLast.ok || !_dataLast.issues.length) return null;
        const n = _dataLast.issues.length;
        return '⚠ Dữ liệu có ' + n + ' điểm cần xem: ' + _dataLast.issues.slice(0, 3).join(' ; ') + (n > 3 ? ' …' : '');
    }

    // ---------- LƯỚI CHỌN ----------
    function taoLuoi(ds, daChon, laChon, toggle) {
        const g = el('div', 'tdp-grid');
        ds.forEach(m => {
            const c = el('button', 'tdp-chipg' + (daChon(m) ? ' on' : ''), m.ngan);
            c.type = 'button';
            if (m.ten) c.title = m.ten;
            c.onclick = function () { toggle(m); c.classList.toggle('on', daChon(m)); };
            g.appendChild(c);
        });
        return g;
    }


    function themCssKT() {
        if (document.getElementById('ktCss')) return;
        const st = document.createElement('style');
        st.id = 'ktCss';
        st.textContent =
            '.kt-box{margin-top:24px;border-top:1px solid var(--border,#5c3d1e);padding-top:20px}' +
            '.kt-title{font-family:"Cinzel Decorative",serif;font-size:.95rem;color:var(--gold-light,#e8b84b);margin-bottom:12px}' +
            '.kt-nums{display:flex;flex-wrap:wrap;gap:6px}' +
            '.kt-n{min-width:42px;padding:8px 6px;background:transparent;color:var(--gold-light,#e8b84b);border:1px solid var(--gold,#c9922a);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer}' +
            '.kt-n.on{background:var(--gold,#c9922a);color:#000}' +
            '.kt-info{font-size:.78rem;color:var(--text,#e8d9c0);line-height:1.6;margin:10px 0 0;padding:8px 10px;background:rgba(0,0,0,.25);border:1px solid rgba(92,61,30,.5);border-radius:6px}' +
            '.kt-info b{color:var(--gold-light,#e8b84b)}';
        document.head.appendChild(st);
    }

    function taoPanelQue(n) {
        const q = _dataLast.ques.find(x => x.id === n.so);
        const khoa = n.pos + ':' + n.so;
        return khoiGap('q', 'q:' + khoa, 'Quẻ ' + n.ten + (q && q.meta.KY_HIEU ? ' ' + q.meta.KY_HIEU : ''), 'KT' + ktSel + ' · ' + n.vaiTro, '', function (b) {
            if (!q) { b.appendChild(el('div', 'tdp-miss', 'Chưa có dữ liệu quẻ ' + n.ten + ' trong ' + CONFIG.dataUrl + '.')); return; }
            const t9 = MUC9.filter(m => tick9.indexOf(m.sec) > -1);
            const t20 = MUC20.filter(m => tick20.indexOf(m.ma) > -1);
            if (!t9.length && !t20.length) { b.appendChild(el('div', 'tdp-miss', 'Hãy tích chọn ít nhất một mục ở các lưới phía trên.')); return; }
            t9.forEach(t => {
                const dem = (q.secs[t.sec] || []).length;
                b.appendChild(khoiGap('f', 's:' + khoa + ':' + t.ma, t.ten, dem ? dem + ' mục' : 'trống', '', function (sb) { veTang(sb, q, t); }));
            });
            if (t20.length) {
                b.appendChild(el('div', 'tdp-gl', 'Dụng tượng'));
                t20.forEach(m => {
                    const u = trichUngDung(q, m.ma);
                    b.appendChild(khoiGap('f', 'u:' + khoa + ':' + m.ma, m.ma + ' · ' + (u ? u.ten : m.ngan), u ? u.truong.length + ' trường' : 'thiếu', 'ud',
                        function (sb) { veUngDung(sb, q, m.ma); }));
                });
            }
        });
    }

    function quaiHienTai() {
        if (!cur) return [];
        return tinhQuai(cur.results[ktSel - 1]);
    }

    function veKetQua() {
        if (!ketQuaEl) return;
        ketQuaEl.innerHTML = '';
        const ds = quaiHienTai().filter(n => opened.indexOf(n.pos) > -1);
        if (!ds.length) return;
        if (!_dataLast) { ketQuaEl.appendChild(el('div', 'tdp-note', 'Đang tải ' + CONFIG.dataUrl + '…')); return; }
        if (!_dataLast.ok) { ketQuaEl.appendChild(el('div', 'tdp-miss', _dataLast.loi + ' Bấm lại nút đơn quái để thử lại.')); return; }
        const tools = el('div', 'tdp-tools');
        const g = el('button', 'tdp-mini', 'Thu gọn tất cả'); g.type = 'button';
        const m = el('button', 'tdp-mini', 'Mở rộng tất cả'); m.type = 'button';
        function datTatCa(v) {
            ds.forEach(n => {
                const khoa = n.pos + ':' + n.so;
                tick9.forEach(sec => { const t = MUC9.find(x => x.sec === sec); if (t) thuGon['s:' + khoa + ':' + t.ma] = v; });
                tick20.forEach(ma => { thuGon['u:' + khoa + ':' + ma] = v; });
            });
            veKetQua();
        }
        g.onclick = function () { datTatCa(true); };
        m.onclick = function () { datTatCa(false); };
        tools.appendChild(g); tools.appendChild(m);
        ketQuaEl.appendChild(tools);
        ds.forEach(n => ketQuaEl.appendChild(taoPanelQue(n)));
    }

    function render() {
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        ketQuaEl = null;
        if (!cur) { bodyEl.appendChild(el('div', 'tdp-empty', 'Chưa lập quẻ. Hãy nhập số và bấm "Lập Quẻ" ở phía trên.')); return; }

        const n = cur.soKT;
        const q = cur.results[ktSel - 1];

        // --- nút Không Thời ---
        bodyEl.appendChild(el('div', 'tdp-lbl', 'Chọn Không Thời (' + n + ' Không Thời)'));
        const nums = el('div', 'kt-nums');
        for (let i = 1; i <= n; i++) {
            const b = el('button', 'kt-n' + (i === ktSel ? ' on' : ''), String(i));
            b.type = 'button';
            b.onclick = function () { ktSel = i; render(); emit(); };
            nums.appendChild(b);
        }
        bodyEl.appendChild(nums);

        const info = el('div', 'kt-info');
        info.innerHTML = '<b>Không Thời ' + ktSel + (ktSel === 1 ? ' (quẻ chính)' : '') + '</b> · hào động ' + q.hao +
            '<br>Chính ' + tenQ(q.thuong) + '/' + tenQ(q.ha) + ' · Hỗ ' + tenQ(q.hoThuong) + '/' + tenQ(q.hoHa) +
            ' · Biến ' + tenQ(q.bienThuong) + '/' + tenQ(q.bienHa) + ' <small>(thượng/hạ)</small>';
        bodyEl.appendChild(info);

        // --- 5 nút đơn quái ---
        bodyEl.appendChild(el('div', 'tdp-lbl', '5 đơn quái của Không Thời ' + ktSel));
        const bt = el('div', 'tdp-btns');
        quaiHienTai().forEach(x => {
            const b = el('button', 'tdp-btn' + (opened.indexOf(x.pos) > -1 ? ' on' : ''));
            b.type = 'button';
            b.appendChild(el('b', null, x.ten));
            b.appendChild(el('small', null, x.vaiTro));
            b.onclick = function () {
                const i = opened.indexOf(x.pos);
                if (i > -1) opened.splice(i, 1); else opened.push(x.pos);
                if (_dataLast && !_dataLast.ok) { _dataLast = null; load().then(d => { _dataLast = d; render(); }); }
                render();
            };
            bt.appendChild(b);
        });
        bodyEl.appendChild(bt);

        // --- 9 tầng thông tin ---
        bodyEl.appendChild(el('div', 'tdp-lbl', 'Tích chọn tầng thông tin'));
        const dem9 = el('span', 'tdp-dem');
        const cap9 = function () { dem9.textContent = 'Đã chọn: ' + tick9.length + '/9'; };
        const g9 = taoLuoi(MUC9, m => tick9.indexOf(m.sec) > -1, null, function (m) {
            const i = tick9.indexOf(m.sec);
            if (i > -1) tick9.splice(i, 1); else tick9.push(m.sec);
            ghiLuu(CONFIG.khoa9, tick9); cap9(); veKetQua();
        });
        bodyEl.appendChild(g9);
        const t9 = el('div', 'tdp-tools');
        const a9 = el('button', 'tdp-mini', 'Chọn tất cả'); a9.type = 'button';
        a9.onclick = function () { datTick9(MUC9.map(m => m.sec)); };
        const b9 = el('button', 'tdp-mini', 'Bỏ chọn'); b9.type = 'button';
        b9.onclick = function () { datTick9([]); };
        t9.appendChild(a9); t9.appendChild(b9); t9.appendChild(dem9);
        bodyEl.appendChild(t9);
        cap9();

        // --- Dụng Tượng (20 mục ứng dụng) ---
        const ud = el('button', 'tdp-ud' + (udMo ? ' on' : ''), '🎯 Dụng Tượng (' + tick20.length + '/20)');
        ud.type = 'button';
        ud.onclick = function () { udMo = !udMo; render(); };
        bodyEl.appendChild(ud);
        if (udMo) {
            const g20 = taoLuoi(MUC20, m => tick20.indexOf(m.ma) > -1, null, function (m) {
                const i = tick20.indexOf(m.ma);
                if (i > -1) tick20.splice(i, 1); else tick20.push(m.ma);
                ghiLuu(CONFIG.khoa20, tick20);
                ud.textContent = '🎯 Dụng Tượng (' + tick20.length + '/20)';
                veKetQua();
            });
            g20.style.marginTop = '8px';
            bodyEl.appendChild(g20);
            const t20 = el('div', 'tdp-tools');
            const a20 = el('button', 'tdp-mini', 'Chọn tất cả'); a20.type = 'button';
            a20.onclick = function () { datTick20(MUC20.map(m => m.ma)); };
            const b20 = el('button', 'tdp-mini', 'Bỏ chọn'); b20.type = 'button';
            b20.onclick = function () { datTick20([]); };
            t20.appendChild(a20); t20.appendChild(b20);
            bodyEl.appendChild(t20);
        }

        const gc = ghiChuDuLieu();
        if (gc) bodyEl.appendChild(el('div', 'tdp-note', gc));

        ketQuaEl = el('div');
        bodyEl.appendChild(ketQuaEl);
        veKetQua();
    }

    function datTick9(ds) {
        tick9 = MUC9.filter(m => ds.indexOf(m.sec) > -1).map(m => m.sec);
        ghiLuu(CONFIG.khoa9, tick9); render();
    }
    function datTick20(ds) {
        tick20 = MUC20.filter(m => ds.indexOf(m.ma) > -1).map(m => m.ma);
        ghiLuu(CONFIG.khoa20, tick20); render();
    }

    function emit() {
        listeners.forEach(fn => { try { fn(cur); } catch (e) { console.error(e); } });
        try { document.dispatchEvent(new CustomEvent('khongthoi:change', { detail: { state: cur, kt: ktSel } })); } catch (e) {}
    }

    function capNhat(ep) {
        let st = null;
        try { st = docTrangThai(); } catch (e) { st = null; }
        const sig = st ? st.nguon + '#' + st.results.map(q => [q.thuong, q.ha, q.hao, q.hoThuong, q.hoHa, q.bienThuong, q.bienHa].join(',')).join('|') : '';
        if (!ep && sig === curSig) return;
        curSig = sig;
        cur = st;
        ktSel = 1;                       // lập quẻ mới -> quay về Không Thời 1
        render();
        emit();
    }

    // ---------- GẮN VÀO TRANG LIÊN HOA ----------
    function bao(ten) {
        if (typeof root[ten] !== 'function' || root[ten].__kt) return;
        const goc = root[ten];
        const w = function () {
            const r = goc.apply(this, arguments);
            try { capNhat(); } catch (e) { console.error(e); }
            return r;
        };
        w.__kt = true;
        root[ten] = w;
    }

    function khoiTao() {
        if (document.getElementById('ktBody')) return;
        themCss();
        themCssKT();
        tick9 = docLuu(CONFIG.khoa9, MUC9.map(m => m.sec));
        tick20 = docLuu(CONFIG.khoa20, MUC20.map(m => m.ma));
        const box = document.createElement('div');
        box.className = 'kt-box';
        box.innerHTML = '<div class="kt-title">' + CONFIG.tieuDe + '</div><div id="ktBody"></div>';
        (document.querySelector('.container') || document.body).appendChild(box);
        bodyEl = document.getElementById('ktBody');
        ['renderResults', 'clearAll', 'switchTab'].forEach(bao);
        try {
            const mo = new MutationObserver(function () { capNhat(); });
            ['result1', 'result2'].forEach(id => {
                const a = document.getElementById(id);
                if (a) mo.observe(a, { attributes: true, attributeFilter: ['class'], childList: true });
            });
        } catch (e) {}
        capNhat(true);
        root.KhongThoi.ready.then(d => { _dataLast = d; render(); });
    }

    root.KhongThoi = {
        version: '1.0', CONFIG: CONFIG, MUC9: MUC9, MUC20: MUC20,
        ready: load(), load: load,
        getQue: getQue, getSection: getSection, getUngDung: getUngDung, getAll: getAll,
        getState: function () { return cur ? { nguon: cur.nguon, results: cur.results, soKT: cur.soKT, kt: ktSel, quai: quaiHienTai() } : null; },
        getKhongThoi: function (i) { return cur && cur.results[i - 1] ? moTaKT(i - 1, cur.results[i - 1]) : null; },
        getAllKhongThoi: function () { return cur ? cur.results.map((q, i) => moTaKT(i, q)) : []; },
        selectKT: function (i) { if (cur && i >= 1 && i <= cur.soKT) { ktSel = i; render(); emit(); } },
        getOpened: function () { return opened.slice(); },
        getTicked9: function () { return tick9.slice(); },
        getTicked20: function () { return tick20.slice(); },
        onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
        refresh: function () { capNhat(true); },
        _test: { parseData: parseData, tinhQuai: tinhQuai }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiTao);
    else khoiTao();
})(window);