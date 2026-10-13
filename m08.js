/* =========================================================================
 * m08.js — MODULE 8: THẾ & DỤNG THẦN
 * Kinh Dịch Lục Hào — dựa trên tài liệu "Thế và Dụng Thần" (docx) do user
 * cung cấp. Mã hoá ĐÚNG NGUYÊN VĂN mọi case đã nêu trong tài liệu — không
 * tự chế thêm diễn giải ở những tổ hợp tài liệu KHÔNG đề cập (những chỗ đó
 * được đánh dấu rõ "[Chưa có diễn giải chính thức...]" thay vì bịa văn bản).
 *
 * PHẦN "PHÁT TRIỂN THÊM" đã làm: tài liệu chỉ minh hoạ bằng 1 Dụng Thần ví
 * dụ (Tử Tôn). Module này TỔNG QUÁT HOÁ công thức Nguyên/Kỵ/Cừu/Tiết Thần
 * (đã cho sẵn trong tài liệu, mục Quy luật Sinh/Khắc Lục Thân) để tự động
 * phân loại đúng 1 trong 5 case A-E (Thế lâm Nguyên/Kỵ/Cừu/Tiết Thần, hoặc
 * Dụng Thần trì Thế) cho BẤT KỲ cặp Thế-Dụng nào, không chỉ ví dụ Tử Tôn.
 *
 * Tự động lấy: Thế hào (từ code nền), hào mang Dụng Thần đã chọn (từ code
 * nền, xử lý cả trường hợp trùng lục thân nhiều hào), Vượng/Suy theo Nhật-
 * Nguyệt (từ VUONG_SUY_TABLE code nền), Tuần Không (từ m01.js), Nhập Mộ
 * (từ m03.js nếu đã chạy). Phần không thể tự suy (mốc thời gian xung Mộ/
 * xung Không đã qua chưa, Thế có "quá vượng" không, người hỏi đang lo lắng
 * hay bình thường...) để user xác nhận tay qua form.
 *
 * Có nút Sao Chép text thuần + nút Thu/Mở rộng (mẫu dùng lại cho m09 trở đi).
 * Expose window.M08_DATA cho module sau.
 * ========================================================================= */
(function () {
	"use strict";

	const LUC_THAN_LIST = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];
	const SINH_LT = { "Phụ Mẫu": "Huynh Đệ", "Huynh Đệ": "Tử Tôn", "Tử Tôn": "Thê Tài", "Thê Tài": "Quan Quỷ", "Quan Quỷ": "Phụ Mẫu" };
	const KHAC_LT = { "Phụ Mẫu": "Tử Tôn", "Tử Tôn": "Quan Quỷ", "Quan Quỷ": "Huynh Đệ", "Huynh Đệ": "Thê Tài", "Thê Tài": "Phụ Mẫu" };

	function layNguyenThan(lt) { for (const k in SINH_LT) if (SINH_LT[k] === lt) return k; return null; }
	function layKyThan(lt) { for (const k in KHAC_LT) if (KHAC_LT[k] === lt) return k; return null; }
	function layTietThan(lt) { return SINH_LT[lt] || null; }
	function layCuuThan(lt) { return KHAC_LT[lt] || null; }

	// Phân loại Thế so với Dụng Thần đã chọn -> 1 trong 5 case A-E
	function phanLoaiTheDung(theLT, dungLT) {
    	if (theLT === dungLT) return 'E';
    	if (SINH_LT[theLT] === dungLT) return 'A'; // Thế sinh Dụng => Thế là Nguyên Thần của Dụng
    	if (KHAC_LT[theLT] === dungLT) return 'B'; // Thế khắc Dụng => Thế là Kỵ Thần của Dụng
    	if (SINH_LT[dungLT] === theLT) return 'D'; // Dụng sinh Thế => Thế là Tiết Thần của Dụng
    	if (KHAC_LT[dungLT] === theLT) return 'C'; // Dụng khắc Thế => Thế là Cừu Thần của Dụng
    	return null;
	}
	const TEN_CASE = {
    	A: "Thế lâm Nguyên Thần của Dụng Thần",
    	B: "Thế lâm Kỵ Thần của Dụng Thần",
    	C: "Thế lâm Cừu Thần của Dụng Thần",
    	D: "Thế lâm Tiết Thần của Dụng Thần",
    	E: "Dụng Thần trì Thế"
	};

	// Chi/Hành liên quan Hợp-Xung (bảng riêng của module, không phụ thuộc module khác)
	const CHI_HANH_MAP = {
    	"Tý":"Thủy","Sửu":"Thổ","Dần":"Mộc","Mão":"Mộc","Thìn":"Thổ","Tỵ":"Hỏa",
    	"Ngọ":"Hỏa","Mùi":"Thổ","Thân":"Kim","Dậu":"Kim","Tuất":"Thổ","Hợi":"Thủy"
	};
	const CHI_XUNG_MAP = {
    	"Tý":"Ngọ","Ngọ":"Tý","Sửu":"Mùi","Mùi":"Sửu","Dần":"Thân","Thân":"Dần",
    	"Mão":"Dậu","Dậu":"Mão","Thìn":"Tuất","Tuất":"Thìn","Tỵ":"Hợi","Hợi":"Tỵ"
	};
	const CHI_LUCHOP_MAP = {
    	"Tý":"Sửu","Sửu":"Tý","Dần":"Hợi","Hợi":"Dần","Mão":"Tuất","Tuất":"Mão",
    	"Thìn":"Dậu","Dậu":"Thìn","Tỵ":"Thân","Thân":"Tỵ","Ngọ":"Mùi","Mùi":"Ngọ"
	};
	const HANH_SINH_MAP = { "Kim":"Thủy","Thủy":"Mộc","Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim" };
	const HANH_KHAC_MAP = { "Kim":"Mộc","Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim" };

	function tachLucThan(napString) {
    	const clean = napString.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
    	return clean.split(/\s+/).slice(0, -2).join(" ");
	}

	// Rút gọn chuỗi Vượng Suy đầy đủ (vd "Vượng + Xung Nhật") về Vượng/Suy nhị phân
	// theo đúng khung "vượng/suy" mà tài liệu nền dùng (không chia 5 cấp Hưu/Tù/Tử).
	function rutGonVuongSuy(chuoi) {
    	if (!chuoi) return null;
    	if (chuoi.includes("Vượng") || chuoi.includes("Tướng")) return "Vuong";
    	return "Suy"; // Hưu/Tù/Tử đều gộp về Suy theo khung nhị phân của tài liệu này
	}
	function layVuongSuy(chi, chiTru, tenTru) {
    	if (typeof VUONG_SUY_TABLE === "undefined" || !VUONG_SUY_TABLE[chi] || !VUONG_SUY_TABLE[chi][chiTru]) return { chuoi: null, nhiPhan: null };
    	const raw = VUONG_SUY_TABLE[chi][chiTru];
    	const chuoi = (typeof resolveVuongSuy === "function") ? resolveVuongSuy(raw, tenTru) : raw;
    	return { chuoi, nhiPhan: rutGonVuongSuy(chuoi) };
	}

	/* ------------------------------------------------------------------
 	* CASE LOGIC — mã hoá nguyên văn tài liệu, theo từng category A-E
 	* ------------------------------------------------------------------ */
	function xetNguyenThan(p) { // Category A
    	const kq = [];
    	if (p.kyThanDongHoaDungThan) {
        	kq.push({ case: 'A_KYTHAN_DONG_HOA_DUNG', ghiChu: 'Kỵ Thần (của Dụng Thần) động hoá ra đúng Dụng Thần — hiểu là "vì nhường người mà thành việc": hào động không khắc được hào Biến, và Dụng Thần nằm ở quẻ Ngoại nên không mang tính thực tại (việc thành nhưng không trực tiếp thuộc về mình).' });
        	return kq;
    	}
    	if (p.theLaPha) {
        	if (p.coDungThanKhacDong) {
            	if (p.dungThanKhacHoaDungThanSuy) {
                	kq.push({ case: 'A_PHA_HAOKHAC_HOA_DUNG_SUY', ketLuan: 'TAI_HOA', ghiChu: 'Thế (Nguyên Thần) bị Phá, có hào mang Dụng Thần khác động, hoá ra Dụng Thần mà Dụng Thần đó Suy — xem như tai hoạ, "ăn một bát cháo chạy ba quãng đồng".' });
            	} else {
                	kq.push({ case: 'A_PHA_HAOKHAC_DONG', ketLuan: 'BAT_THANH_DAUMOI_NOI_KHAC', ghiChu: 'Thế (Nguyên Thần) bị Phá nhưng có hào Dụng Thần KHÁC lại động — việc mình hỏi bất thành, đầu mối nằm ở nơi khác (tuỳ tình huống cụ thể mà xét).' });
            	}
        	} else {
            	kq.push({ case: 'A_PHA_GHI_NHAN', ghiChu: 'Thế (Nguyên Thần) đang ở trạng thái Phá — tài liệu nền không có diễn giải riêng khi không có hào Dụng Thần khác động kèm theo; ghi nhận dữ kiện thô.' });
        	}
        	return kq;
    	}
    	if (p.vThe === 'Suy' && p.vDung === 'Vuong' && p.coHaoDongKhacSinhThe) {
        	kq.push({ case: 'A_SUY_VUONG_COCUU_GIA', ghiChu: 'Thế Suy, Dụng Thần Vượng, có hào Động khác sinh Thế — ĐỪNG hiểu là được trợ: hào động đó thực chất đóng vai Kỵ Thần của Dụng Thần (động) — "Làm để người khác hưởng công", tốn công nhiều mệt mỏi thiệt thòi.' });
        	return kq;
    	}
    	if (p.vDung === 'Vuong' && p.vThe === 'Suy') {
        	kq.push({ case: 'A_DUNGVUONG_THESUY', ghiChu: 'Dụng Thần Vượng, Thế Suy — bỏ công bỏ sức mệt mỏi mà ra việc.' });
        	if (p.dungLT === 'Phụ Mẫu') kq.push({ case: 'A_DUNGVUONG_THESUY_PHUMAU', ketLuan: 'HONG', ghiChu: 'Dụng Thần là Phụ Mẫu (giấy tờ, tin tức) trong case này — HỎNG.' });
        	if (p.dungThanDong) kq.push({ case: 'A_DUNGVUONG_THESUY_DUNGDONG', ketLuan: 'TAI_HOA_LUY_VIEC', ghiChu: 'Dụng Thần ĐỘNG trong case này — tai hoạ luỵ vì chính việc hỏi (Dụng Thần động thì tiết khí Thế, Thế vốn đã suy lại càng kiệt — ví như tiền đã ít còn phải mang cho người).' });
    	} else if (p.vDung === 'Suy') {
        	kq.push({ case: 'A_DUNGSUY', ketLuan: 'HONG', ghiChu: p.vThe === 'Vuong' ? 'Dụng Thần Suy — việc hỏng, Thế Vượng mấy cũng chỉ tốn công vô ích.' : 'Dụng Thần Suy, Thế cũng Suy — "ăn mày không đòi xôi gấc được".' });
    	} else if (p.vDung === 'Vuong' && p.vThe === 'Vuong') {
        	kq.push({ case: 'A_VUONG_VUONG_CHUA_RO', ghiChu: '[Chưa có diễn giải chính thức cho tổ hợp Thế Vượng + Dụng Thần Vượng trong tài liệu nền — ghi nhận dữ kiện thô, cần bổ sung case cụ thể.]' });
    	}
    	return kq;
	}

	function xetKyThan(p) { // Category B
    	const kq = [];
    	if (p.theDong && p.theHoaRaDungThan) {
        	if (p.dungLT === 'Quan Quỷ') {
            	kq.push({ case: 'B_DONG_HOA_QUANQUY', ghiChu: 'Thế động hoá ra Quan Quỷ (Dụng Thần) — gặp tai hoạ nhưng vì hoá ra Quan Quỷ nên vẫn sẽ THÀNH trước, sau đó mới gặp hoạ.' });
        	} else if (p.dungLT === 'Phụ Mẫu' && p.theLaTheTaiHoaPhuMau) {
            	kq.push({ case: 'B_THETAI_HOA_PHUMAU', ghiChu: 'Thế là Thê Tài động hoá Phụ Mẫu (Dụng Thần) — nếu không chịu tổn thất mà nên việc thì việc cũng chỉ tạm thời, không kéo dài lâu; tuỳ tình huống sự việc mong cầu cụ thể mà xét thêm.' });
        	} else {
            	kq.push({ case: 'B_DONG_HOA_DUNGTHAN_CHUNG', ghiChu: 'Thế động hoá ra đúng Dụng Thần — theo nguyên lý chung, KHÔNG bắt buộc Dụng Thần phải Vượng mới thành (ngoại lệ). Tài liệu chỉ có diễn giải chi tiết riêng cho Dụng Thần=Quan Quỷ hoặc Thế=Thê Tài hoá Phụ Mẫu; các Dụng Thần khác dùng chung nguyên lý "không cần Dụng Thần vượng" nhưng CHƯA có diễn giải chi tiết riêng — ghi nhận để bổ sung sau.' });
        	}
        	return kq;
    	}
    	if (p.theNhapMo) {
        	if (p.moCoXungChua === 'truoc' && p.vDung === 'Vuong') {
            	if (p.theQuaVuong) {
                	kq.push({ case: 'B_MO_QUAVUONG', ketLuan: 'THANH_NHUNG_QUA_TAI', ghiChu: 'Thế lâm Kỵ Thần Nhập Mộ, độ Vượng ở mức CỰC VƯỢNG, trước thời điểm xung Mộ, Dụng Thần Vượng — việc cũng thành, nhưng bản thân quá tải chẳng biết đi đường nào, như người lạc trong rừng, vô tình thoát được trước khi chết.' });
            	} else {
                	kq.push({ case: 'B_MO_BINH_THUONG', ketLuan: 'THANH_TRONG_BONG_TOI', ghiChu: 'Thế lâm Kỵ Thần Nhập Mộ, trước thời điểm xung Mộ, Dụng Thần Vượng — việc sẽ thành nhưng trong bóng tối, nôm na là gặp may.' });
            	}
            	kq.push({ case: 'B_MO_CANH_BAO', ghiChu: 'Theo dõi sát đúng thời điểm xung Mộ — đây là mốc quyết định diễn biến tiếp theo.' });
            	return kq;
        	}
    	}
    	if (p.theTuanKhong && p.khongCoXungChua === 'truoc' && p.vDung === 'Vuong') {
        	kq.push({ case: 'B_TUAN_KHONG', ketLuan: 'THANH_TRUOC_KHI_GAP_HOA', ghiChu: 'Thế lâm Tuần Không, trước thời điểm Xung Không/Thực Không, Dụng Thần Vượng — việc cũng sẽ thành. Lưu ý riêng cho Công Danh: thường báo tin được việc nhưng SAU ĐÓ gặp hoạ mà chết, ứng đúng lúc Thực Không/Xung Không.' });
        	kq.push({ case: 'B_TUAN_KHONG_CANH_BAO', ghiChu: 'Theo dõi sát đúng thời điểm Xung Không / Thực Không.' });
        	return kq;
    	}
    	if (p.vThe === 'Vuong' && p.vDung === 'Suy') kq.push({ case: 'B_VUONG_SUY', ghiChu: 'Thế Vượng, Dụng Thần Suy — bản thân có năng lực nhưng không hợp thời.' });
    	else if (p.vThe === 'Suy' && p.vDung === 'Vuong') kq.push({ case: 'B_SUY_VUONG', ghiChu: 'Thế Suy, Dụng Thần Vượng — bản thân vừa bất tài lại còn sai đường cho một việc có tiềm năng.' });
    	else if (p.vThe === 'Vuong' && p.vDung === 'Vuong') kq.push({ case: 'B_VUONG_VUONG', ghiChu: 'Thế Vượng, Dụng Thần Vượng — năng lực có, tiềm năng có, nhưng sai đường.' });
    	else if (p.vThe === 'Suy' && p.vDung === 'Suy') kq.push({ case: 'B_SUY_SUY', ghiChu: 'Thế Suy, Dụng Thần Suy — đâm đầu vào đá quá sức có thể đảm đương, tự đâm vào mớ hỗn độn.' });

    	if (p.dungThanDongHoaHoiDauSinh) {
        	kq.push({ case: 'B_CANHBAO_HOIDAU_SINH_GIA', ghiChu: 'Dụng Thần động hoá ra hào Biến sinh ngược lại Dụng Thần (hồi đầu sinh) — KHÔNG hiểu là Dụng Thần được trợ mà thành; hào Biến này thực chất là CỪU THẦN đối với Thế (đang mang vai Kỵ Thần, động) — là HOẠ, không phải phúc.' });
    	}
    	return kq;
	}

	function xetTietThan(p) { // Category D
    	const kq = [];
    	if (p.theDongHoiDauKhacThe) {
        	kq.push({ case: 'D_HOIDAU_KHAC_THE', ketLuan: 'NGUY_HIEM', ghiChu: 'Thế động hoá ra hào Biến Hồi Đầu Khắc Thế (về ngũ hành) — LUÔN LUÔN báo hiệu việc nguy hiểm ("Dịch báo gần không báo xa").' });
    	}
    	if (p.dungLT === 'Thê Tài' && p.theLaQuanQuyHoaTuTon) {
        	if (p.nguoiHoiDangLoLang) {
            	kq.push({ case: 'D_THETAI_LOLANG', ketLuan: 'VUOT_QUA_MAY_MAN', ghiChu: 'Dụng Thần=Thê Tài, Thế=Quan Quỷ động hoá Tử Tôn (Nguyên Thần của Thê Tài), người hỏi ĐANG LO LẮNG — hiểu là Tử Tôn khắc Quan Quỷ (đại biểu lo lắng) ngay bên thân: dù Thê Tài vượng hay không, tại thời điểm Tử Tôn vượng cũng sẽ gặp may mà vượt qua.' });
        	} else {
            	kq.push({ case: 'D_THETAI_BINHTHUONG', ketLuan: 'NGUY_CO_HOA', ghiChu: 'Dụng Thần=Thê Tài, Thế=Quan Quỷ động hoá Tử Tôn, người hỏi ở trạng thái BÌNH THƯỜNG (không lo) — khả năng rất cao sẽ gặp hoạ: có con thì khả năng con mất; đang kinh doanh thì người làm chung đâm sau lưng — nên đề phòng.' });
        	}
        	return kq;
    	}
    	if (p.vDung === 'Vuong') {
        	if (p.vThe === 'Suy') kq.push({ case: 'D_DUNGVUONG_THESUY', ketLuan: 'MAY_MAN', ghiChu: 'Dụng Thần Vượng, Thế Suy — tiền rơi vào đầu (may mắn).' });
        	else kq.push({ case: 'D_DUNGVUONG_THEVUONG', ketLuan: 'DA_HAY_CON_HEN', ghiChu: 'Dụng Thần Vượng, Thế Vượng — đã hay còn hên.' });
    	} else if (p.vDung === 'Suy') {
        	kq.push({ case: 'D_DUNGSUY', ketLuan: 'TUONG_THANH_MA_KHONG_THANH', ghiChu: 'Dụng Thần Suy — tưởng thành nhưng không thể được, xuất hiện sự hao hụt trong việc cần hỏi (vì Tiết Thần lâm Thế tiết khí Dụng Thần do may mắn quá mà coi thường mọi thứ).' });
    	}
    	return kq;
	}

	function xetCuuThan(p) { // Category C
    	const kq = [{ case: 'C_BASE', ghiChu: 'Dụng Thần khắc Thế — kiểu gì cũng chịu áp lực từ việc hỏi.' }];
    	if (p.vThe === 'Vuong' && p.vDung === 'Vuong') kq.push({ case: 'C_VUONG_VUONG', ketLuan: 'THANH_KHONG_GOC', ghiChu: 'Thế Vượng, Dụng Thần Vượng — việc thành nhưng không có gốc, trong quá trình đến lúc thành thì tổn hao đủ điều; không gốc vì Cừu Thần lâm Thế khắc Nguyên Thần của Thế (dù động hay không, Cừu Thần vẫn khắc Nguyên Thần của Thế).' });
    	else if (p.vThe === 'Vuong' && p.vDung === 'Suy') kq.push({ case: 'C_VUONG_SUY', ghiChu: 'Thế Vượng, Dụng Thần Suy — kiên cường chống trả nhưng chẳng tới đâu.' });
    	else if (p.vThe === 'Suy' && p.vDung === 'Vuong') kq.push({ case: 'C_SUY_VUONG', ketLuan: 'DAI_RISK', ghiChu: 'Thế Suy, Dụng Thần Vượng — đã có sẵn đại risk, nguy hại tột độ.' });
    	else if (p.vThe === 'Suy' && p.vDung === 'Suy') kq.push({ case: 'C_SUY_SUY', ketLuan: 'XOI_HONG_BONG_KHONG', ghiChu: 'Thế Suy, Dụng Thần Suy — xôi hỏng bỏng không, ngoài ra còn gặp hoạ.' });

    	if (p.tietThanTheVuongSinhThe) {
        	kq.push({ case: 'C_TIETTHAN_VUONG_GIA', ghiChu: 'Nguyên Thần của Thế (= Tiết Thần của Dụng Thần) Vượng và sinh Thế — "thật lòng giúp nhưng vô tình hại", nên phòng.' });
    	} else if (p.tietThanTheSuy) {
        	kq.push({ case: 'C_TIETTHAN_SUY', ghiChu: 'Nguyên Thần của Thế (= Tiết Thần của Dụng Thần) Suy — "lời nói đầu môi chót lưỡi", không giúp được thật.' });
    	}
    	if (p.lienQuanTinhCam) {
        	kq.push({ case: 'C_GHI_CHU_TINHCAM', ghiChu: 'Việc hỏi liên quan tình cảm/lời hứa hẹn (trả tiền, cất nhắc vị trí...) — rất khó xác quyết chắc chắn, "rất có khả năng nhưng chưa bắt tận tay".' });
    	}
    	return kq;
	}

	function xetDungThanTriThe(p) { // Category E
    	const kq = [{ case: 'E_BASE', ghiChu: 'Thế như thế nào thì Dụng Thần như thế nấy, nhưng sẽ bị ám ảnh bởi chính việc hỏi (ví dụ nam có vợ thì sợ vợ).' }];
    	if (p.theDongHoiDauKhacThe) {
        	kq.push({ case: 'E_HOIDAU_KHAC', ketLuan: 'HONG_NGUY_HIEM_TINH_MANG', ghiChu: 'Thế động hoá Hồi Đầu Khắc (hào Biến quay lại khắc Thế) — việc hỏng mà mạng cũng khó giữ. Còn lui/tiến thế nào tuỳ Nội/Ngoại quái và việc hỏi mà né.' });
    	}
    	return kq;
	}

	function xetHopXung(p) {
    	const kq = [];
    	if (p.dungHopThe) kq.push({ case: 'HOP_THE', ghiChu: 'Dụng Thần Lục Hợp với Thế — kết quả là TỔ HỢP giữa case cơ bản ở trên và yếu tố Hợp (ví dụ: vừa khắc vừa hợp = vừa được vừa hao, như quẻ Sơn Trạch Tổn: Thê Tài Hợp Thế nhưng Thế lâm Kỵ Thần).' });
    	if (p.dungXungThe) kq.push({ case: 'XUNG_THE', ghiChu: 'Dụng Thần Xung Thế — kết quả là TỔ HỢP giữa case cơ bản ở trên và yếu tố Xung (như quẻ Thuần Khảm: Thê Tài xung Thế, cùng ý nghĩa tổ hợp).' });
    	return kq;
	}

	/* ------------------------------------------------------------------
 	* LỚP GHÉP NỐI + UI
 	* ------------------------------------------------------------------ */
	function layHaoTheTuCore(chuData) {
    	for (let i = 0; i < 6; i++) if (chuData.n[i].includes("(Thế)")) return i + 1;
    	return null;
	}
	function layDanhSachHaoTheoLucThan(chuData, lucThan) {
    	const ketQua = [];
    	for (let i = 0; i < 6; i++) {
        	if (tachLucThan(chuData.n[i]) === lucThan) ketQua.push(i + 1);
    	}
    	return ketQua;
	}
	function layChiHanhHao(chuData, haoSo) {
    	const nap = chuData.n[haoSo - 1];
    	const chiHanh = getChiHanh(nap);
    	return { chi: chiHanh.split(" ")[0], hanh: getHanh(chiHanh), isDong: (typeof selectedDong !== "undefined") && selectedDong.includes(haoSo) };
	}
	function layHaoBien(cungChu, haoSo) {
    	if (typeof bienQueGiam === "undefined" || !bienQueGiam || !bienQueGiam.data) return null;
    	const dong = (typeof selectedDong !== "undefined") ? selectedDong : [];
    	if (!dong.includes(haoSo)) return null;
    	const thuongDong = dong.some(h => h >= 4);
    	const haDong = dong.some(h => h <= 3);
    	const isHaoThuong = (haoSo >= 4);
    	const quaiCoDong = (isHaoThuong && thuongDong) || (!isHaoThuong && haDong);
    	if (!quaiCoDong) return null;
    	const chiHanhBien = getChiHanh(bienQueGiam.data.n[haoSo - 1]);
    	const chiBien = chiHanhBien.split(" ")[0];
    	const hanhBien = getHanh(chiHanhBien);
    	const lucThanBien = tinhLucThan(hanhBien, cungChu.hanh);
    	return { chi: chiBien, hanh: hanhBien, lucThan: lucThanBien };
	}
	function laHoiDauKhac(hanhBien, hanhGoc) { return HANH_KHAC_MAP[hanhBien] === hanhGoc; }
	function laHoiDauSinh(hanhBien, hanhGoc) { return HANH_SINH_MAP[hanhBien] === hanhGoc; }

	function layTuanKhongM01() {
    	const c1 = document.getElementById("m01_tkChi1");
    	const c2 = document.getElementById("m01_tkChi2");
    	return [c1 ? c1.value : "", c2 ? c2.value : ""].filter(Boolean);
	}
	function layHaoDangBiMoM03() {
    	if (!window.M03_DATA || !Array.isArray(window.M03_DATA.danhSachHaoMo)) return [];
    	return window.M03_DATA.danhSachHaoMo.map(x => x.hao);
	}
	function layTuTriTuCore() {
    	const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim().split(/\s+/)[1] : null; };
    	return { nhat: g("mNhat"), nguyet: g("mNguyet") };
	}

	/* ------------------------------------------------------------------
 	* UI
 	* ------------------------------------------------------------------ */
	const dungThanOptionsHtml = LUC_THAN_LIST.map(lt => `<option value="${lt}">${lt}</option>`).join("");

	const boxHtml = `
    	<div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
        	<h1 style="font-size: 1.1rem; margin:0;">Module 8 — Thế &amp; Dụng Thần</h1>
        	<button id="m08_toggleBtn" style="background:none;border:1px solid var(--gold);color:var(--gold);border-radius:6px;padding:4px 10px;font-size:0.7rem;cursor:pointer;">Thu Gọn</button>
    	</div>
    	<div id="m08_body">
        	<p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
            	Tự lấy Thế hào, Tứ Trị, Tuần Không (m01), Nhập Mộ (m03) từ dữ liệu đã có.
            	Bạn chỉ cần chọn Dụng Thần và xác nhận vài yếu tố không tự suy được (mốc thời gian, tâm lý người hỏi...).
        	</p>
        	<label>Chọn Dụng Thần (Lục Thân đại diện việc hỏi)</label>
        	<select id="m08_dungThan">
            	<option value="">-- Chọn Dụng Thần --</option>
            	${dungThanOptionsHtml}
        	</select>
        	<button class="m-btn-process" id="m08_quetBtn">🔍 QUÉT HÀO THẾ &amp; DỤNG THẦN</button>

        	<div id="m08_chiTietForm"></div>

        	<button class="m-btn-process" id="m08_xuLyBtn" style="display:none;">⚙️ XỬ LÝ THẾ - DỤNG THẦN</button>
        	<textarea id="m08_output" class="m-output-box" readonly></textarea>
        	<button class="btn-copy" id="m08_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ THẾ - DỤNG THẦN</button>
        	<div class="fallback-box" id="m08_fallbackBox">
            	<textarea id="m08_fallbackText" readonly></textarea>
            	<div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        	</div>
    	</div>
	`;
	const box = moduleSlot(boxHtml);
	const $ = (id) => box.querySelector("#" + id);
	$("m08_output").addEventListener("click", function () { this.select(); });
	$("m08_fallbackText").addEventListener("click", function () { this.select(); });

	// Nút Thu/Mở rộng — mẫu dùng lại nguyên khối này cho m09 trở đi.
	$("m08_toggleBtn").addEventListener("click", function () {
    	const body = $("m08_body");
    	const collapsed = body.style.display === "none";
    	body.style.display = collapsed ? "block" : "none";
    	this.innerText = collapsed ? "Thu Gọn" : "Mở Rộng";
	});

	let haoThe = null, haoDungCandidates = [], haoDungChosen = null, cungChu = null, chuData = null;

	function quetHao() {
    	const cungEl = document.getElementById("selectCung");
    	const queEl = document.getElementById("selectQue");
    	const dungLT = $("m08_dungThan").value;

    	if (!cungEl || !queEl || !cungEl.value || !queEl.value) {
        	alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước.");
        	return;
    	}
    	if (!dungLT) {
        	alert("Vui lòng chọn Dụng Thần.");
        	return;
    	}

    	cungChu = dataDich[cungEl.value];
    	chuData = cungChu.quẻ[queEl.value];
    	haoThe = layHaoTheTuCore(chuData);
    	if (!haoThe) {
        	alert("Không tìm thấy hào Thế trong quẻ hiện tại (dữ liệu quẻ thiếu nhãn Thế?).");
        	return;
    	}
    	haoDungCandidates = layDanhSachHaoTheoLucThan(chuData, dungLT);

    	renderChiTietForm(dungLT);
	}

	function renderChiTietForm(dungLT) {
    	const theLT = tachLucThan(chuData.n[haoThe - 1]);
    	const category = phanLoaiTheDung(theLT, dungLT);
    	const container = $("m08_chiTietForm");

    	let html = `<div style="border:1px solid var(--gold);border-radius:8px;padding:10px;margin:12px 0;font-size:0.8rem;">`;
    	html += `<div style="color:var(--gold);font-weight:600;margin-bottom:8px;">Thế: Hào ${haoThe} (${theLT}) — Dụng Thần đã chọn: ${dungLT} — Phân loại: <u>${TEN_CASE[category] || "Không xác định (lỗi dữ liệu)"}</u></div>`;

    	if (haoDungCandidates.length === 0) {
        	html += `<p style="color:#e07;">⚠️ Dụng Thần "${dungLT}" KHÔNG xuất hiện ở hào nào trong Quẻ Chính — có thể là <b>Phục Thần</b>. Kiểm tra lại các ô Phục Thần đã khai báo ở Module 1 (#m01_pt1..6); nếu đã khai thì nhập tay Chi của Phục Thần đó vào ô bên dưới để vẫn xử lý được.</p>`;
        	html += `<label>Chi của Dụng Thần (Phục Thần, nhập tay)</label><input type="text" id="m08_phucThanChi" placeholder="vd: Mão">`;
    	} else if (haoDungCandidates.length === 1) {
        	haoDungChosen = haoDungCandidates[0];
        	html += `<p>Dụng Thần ở Hào ${haoDungChosen} (duy nhất).</p>`;
    	} else {
        	html += `<label>Quẻ có nhiều hào cùng Lục Thân "${dungLT}" — chọn đúng hào Dụng Thần</label>`;
        	html += `<select id="m08_chonHaoDung">`;
        	haoDungCandidates.forEach(h => { html += `<option value="${h}">Hào ${h}</option>`; });
        	html += `</select>`;
    	}

    	// Các trường cần xác nhận tay (không tự suy được)
    	html += `<label style="margin-top:10px;">Người hỏi hiện đang... (chỉ dùng cho case Dụng Thần=Thê Tài, Thế=Quan Quỷ động hoá Tử Tôn)</label>
        	<select id="m08_tamLy"><option value="">-- Không áp dụng --</option><option value="lo">Đang lo lắng</option><option value="binh_thuong">Bình thường</option></select>
        	<label>Mốc thời gian Xung Mộ (nếu Thế đang Nhập Mộ)</label>
        	<select id="m08_mocMo"><option value="">-- Không áp dụng --</option><option value="truoc">Chưa tới mốc Xung Mộ</option><option value="da_qua">Đã qua mốc Xung Mộ</option></select>
        	<label>Mốc thời gian Xung Không / Thực Không (nếu Thế đang Tuần Không)</label>
        	<select id="m08_mocKhong"><option value="">-- Không áp dụng --</option><option value="truoc">Chưa tới mốc Xung/Thực Không</option><option value="da_qua">Đã qua mốc Xung/Thực Không</option></select>
        	<label style="display:block;margin-top:8px;"><input type="checkbox" id="m08_theQuaVuong"> Thế ở mức CỰC VƯỢNG (quá vượng), không chỉ Vượng thường</label>
        	<label style="display:block;"><input type="checkbox" id="m08_lienQuanTinhCam"> Việc hỏi liên quan tình cảm / lời hứa hẹn (chỉ dùng cho case Cừu Thần)</label>
    	`;
    	html += `</div>`;
    	container.innerHTML = html;
    	$("m08_xuLyBtn").style.display = "block";
    	$("m08_output").style.display = "none";
    	$("m08_copyBtn").style.display = "none";
	}

	function xuLy() {
    	const dungLT = $("m08_dungThan").value;
    	const theLT = tachLucThan(chuData.n[haoThe - 1]);
    	const category = phanLoaiTheDung(theLT, dungLT);
    	if (!category) { alert("Không phân loại được Thế-Dụng (lỗi dữ liệu Lục Thân)."); return; }

    	if (haoDungCandidates.length > 1) {
        	const sel = $("m08_chonHaoDung");
        	haoDungChosen = sel ? Number(sel.value) : null;
    	}

    	const theInfo = layChiHanhHao(chuData, haoThe);
    	const tuTri = layTuTriTuCore();
    	if (!tuTri.nhat || !tuTri.nguyet) { alert("Vui lòng nhập đủ Nhật/Nguyệt ở box Tứ Trị."); return; }

    	const vsThe = layVuongSuy(theInfo.chi, tuTri.nguyet, "Nguyệt");
    	let dungChi, dungHanh, vsDung, dungIsDong = false, dungHaoBien = null;
    	const phucThanChiEl = $("m08_phucThanChi");

    	if (haoDungChosen) {
        	const dungInfo = layChiHanhHao(chuData, haoDungChosen);
        	dungChi = dungInfo.chi; dungHanh = dungInfo.hanh; dungIsDong = dungInfo.isDong;
        	dungHaoBien = layHaoBien(cungChu, haoDungChosen);
        	vsDung = layVuongSuy(dungChi, tuTri.nguyet, "Nguyệt");
    	} else if (phucThanChiEl && phucThanChiEl.value.trim()) {
        	dungChi = phucThanChiEl.value.trim();
        	dungHanh = CHI_HANH_MAP[dungChi] || null;
        	vsDung = layVuongSuy(dungChi, tuTri.nguyet, "Nguyệt");
    	} else {
        	alert("Chưa xác định được Chi của Dụng Thần — chọn hào hoặc nhập Chi Phục Thần.");
        	return;
    	}

    	const theHaoBien = layHaoBien(cungChu, haoThe);
    	const tuanKhongPair = layTuanKhongM01();
    	const haoDangBiMo = layHaoDangBiMoM03();

    	const theTuanKhong = tuanKhongPair.includes(theInfo.chi);
    	const theNhapMo = haoDangBiMo.includes(haoThe);
    	const theQuaVuong = $("m08_theQuaVuong").checked;
    	const mocMo = $("m08_mocMo").value;
    	const mocKhong = $("m08_mocKhong").value;
    	const tamLy = $("m08_tamLy").value;
    	const lienQuanTinhCam = $("m08_lienQuanTinhCam").checked;

    	const theHoaRaDungThan = theHaoBien && theHaoBien.lucThan === dungLT;
    	const theDongHoiDauKhacThe = theHaoBien && laHoiDauKhac(theHaoBien.hanh, theInfo.hanh);
    	const dungThanDongHoaHoiDauSinh = dungHaoBien && laHoiDauSinh(dungHaoBien.hanh, dungHanh);

    	// "có hào động khác sinh Thế" (không tính chính hào Biến của Thế)
    	const dong = (typeof selectedDong !== "undefined") ? selectedDong : [];
    	const coHaoDongKhacSinhThe = dong.some(h => {
        	if (h === haoThe) return false;
        	const info = layChiHanhHao(chuData, h);
        	return HANH_SINH_MAP[info.hanh] === theInfo.hanh;
    	});

    	// Kỵ Thần (của Dụng Thần) động hoá ra Dụng Thần
    	const kyThanLT = layKyThan(dungLT);
    	const haoKyThan = layDanhSachHaoTheoLucThan(chuData, kyThanLT).find(h => dong.includes(h));
    	let kyThanDongHoaDungThan = false;
    	if (haoKyThan) {
        	const hb = layHaoBien(cungChu, haoKyThan);
        	if (hb && hb.lucThan === dungLT) kyThanDongHoaDungThan = true;
    	}

    	// Dụng Thần khác (không phải hào Dụng Thần đã chọn) có động không (case A - Phá)
    	const coDungThanKhacDong = haoDungChosen ? haoDungCandidates.some(h => h !== haoDungChosen && dong.includes(h)) : false;
    	let dungThanKhacHoaDungThanSuy = false;
    	if (coDungThanKhacDong) {
        	const hKhac = haoDungCandidates.find(h => h !== haoDungChosen && dong.includes(h));
        	const hb = layHaoBien(cungChu, hKhac);
        	if (hb && hb.lucThan === dungLT) {
            	const vsHB = layVuongSuy(hb.chi, tuTri.nguyet, "Nguyệt");
            	dungThanKhacHoaDungThanSuy = vsHB.nhiPhan === 'Suy';
        	}
    	}

    	// Tiết Thần của Thế (= Nguyên Thần của Dụng, dùng cho category C)
    	const tietThanTheLT = layTietThan(theLT);
    	const haoTietThanThe = layDanhSachHaoTheoLucThan(chuData, tietThanTheLT)[0];
    	let tietThanTheVuongSinhThe = false, tietThanTheSuy = false;
    	if (haoTietThanThe) {
        	const info = layChiHanhHao(chuData, haoTietThanThe);
        	const vs = layVuongSuy(info.chi, tuTri.nguyet, "Nguyệt");
        	tietThanTheVuongSinhThe = vs.nhiPhan === 'Vuong' && HANH_SINH_MAP[info.hanh] === theInfo.hanh;
        	tietThanTheSuy = vs.nhiPhan === 'Suy';
    	}

    	// Hợp/Xung giữa Chi Dụng Thần và Chi Thế
    	const dungHopThe = CHI_LUCHOP_MAP[dungChi] === theInfo.chi;
    	const dungXungThe = CHI_XUNG_MAP[dungChi] === theInfo.chi;

    	const p = {
        	vThe: vsThe.nhiPhan, vDung: vsDung.nhiPhan, dungLT,
        	theDong: theInfo.isDong, theHoaRaDungThan,
        	theNhapMo, moCoXungChua: mocMo, theQuaVuong,
        	theTuanKhong, khongCoXungChua: mocKhong,
        	theLaTheTaiHoaPhuMau: theLT === 'Thê Tài' && dungLT === 'Phụ Mẫu' && theHoaRaDungThan,
        	dungThanDongHoaHoiDauSinh,
        	theLaPha: false, // không tự suy được (cần module Xung-Phá riêng), để false mặc định — ghi chú bên dưới
        	coDungThanKhacDong, dungThanKhacHoaDungThanSuy,
        	coHaoDongKhacSinhThe,
        	kyThanDongHoaDungThan,
        	dungThanDong: dungIsDong,
        	theLaQuanQuyHoaTuTon: theLT === 'Quan Quỷ' && theHaoBien && theHaoBien.lucThan === 'Tử Tôn' && dungLT === 'Thê Tài',
        	nguoiHoiDangLoLang: tamLy === 'lo',
        	theDongHoiDauKhacThe,
        	tietThanTheVuongSinhThe, tietThanTheSuy,
        	lienQuanTinhCam,
        	dungHopThe, dungXungThe
    	};

    	let caseList = [];
    	if (category === 'A') caseList = xetNguyenThan(p);
    	else if (category === 'B') caseList = xetKyThan(p);
    	else if (category === 'C') caseList = xetCuuThan(p);
    	else if (category === 'D') caseList = xetTietThan(p);
    	else if (category === 'E') caseList = xetDungThanTriThe(p);
    	caseList = caseList.concat(xetHopXung(p));

    	// Xuất text
    	let text = "=== MODULE 8 — THẾ & DỤNG THẦN ===\n";
    	text += `Thế: Hào ${haoThe} (${theLT}) — Chi ${theInfo.chi} ${theInfo.hanh} — ${theInfo.isDong ? "Động" : "Tĩnh"}${theHaoBien ? ` -> Biến: ${theHaoBien.lucThan} ${theHaoBien.chi} ${theHaoBien.hanh}` : ""}\n`;
    	text += `Dụng Thần đã chọn: ${dungLT} — ${haoDungChosen ? `Hào ${haoDungChosen}` : "Phục Thần (nhập tay)"} — Chi ${dungChi} ${dungHanh || ""}${dungIsDong ? " — Động" : ""}${dungHaoBien ? ` -> Biến: ${dungHaoBien.lucThan} ${dungHaoBien.chi} ${dungHaoBien.hanh}` : ""}\n`;
    	text += `Phân loại: ${TEN_CASE[category]}\n`;
    	text += `Vượng Suy (theo Nguyệt): Thế=${vsThe.chuoi || "?"} (${vsThe.nhiPhan || "?"}) | Dụng Thần=${vsDung.chuoi || "?"} (${vsDung.nhiPhan || "?"})\n`;
    	if (theTuanKhong) text += `Thế đang Tuần Không (theo Module 1: ${tuanKhongPair.join(", ")})\n`;
    	if (theNhapMo) text += `Thế đang Nhập Mộ (theo Module 3)\n`;
    	text += "\n";

    	if (caseList.length === 0) {
        	text += "(Không có case nào trong tài liệu nền khớp với tổ hợp hiện tại — xem lại các ô xác nhận tay phía trên.)\n";
    	} else {
        	caseList.forEach(c => {
            	text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu}\n`;
        	});
    	}
    	text += "\nGhi chú: \"Thế lâm Phá\" (Nhật/Nguyệt Phá) và \"Thế lâm Tuyệt\" không có diễn giải riêng trong tài liệu nền cho category này (tài liệu nói rõ các trường hợp không liệt kê nghĩa là không tồn tại) — module chưa tự suy trạng thái Phá (cần Module Xung-Phá chuyên trách); nếu biết Thế đang Phá, bạn tự đối chiếu bằng tay.\n";
    	text += "=== HẾT MODULE 8 ===";

    	window.M08_DATA = {
        	haoThe, theLT, dungLT, haoDungChosen, category, caseList,
        	vuongSuyThe: vsThe, vuongSuyDung: vsDung,
        	theTuanKhong, theNhapMo
    	};

    	const outputEl = $("m08_output");
    	outputEl.value = text;
    	outputEl.style.display = "block";
    	$("m08_copyBtn").style.display = "block";
    	$("m08_fallbackBox").style.display = "none";
	}

	function copyKetQua() {
    	const text = $("m08_output").value;
    	if (!text) return;
    	function showSuccess() {
        	const btn = $("m08_copyBtn");
        	$("m08_fallbackBox").style.display = "none";
        	btn.innerText = "✅ ĐÃ SAO CHÉP!";
        	setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ THẾ - DỤNG THẦN"; }, 2000);
    	}
    	function showFallback() {
        	const fbBox = $("m08_fallbackBox");
        	const ta = $("m08_fallbackText");
        	ta.value = text;
        	fbBox.style.display = "block";
        	ta.focus();
        	ta.select();
    	}
    	function tryExecCommandCopy() {
        	try {
            	const ta = document.createElement("textarea");
            	ta.value = text;
            	ta.style.position = "fixed";
            	ta.style.left = "-9999px";
            	document.body.appendChild(ta);
            	ta.focus();
            	ta.select();
            	const ok = document.execCommand("copy");
            	document.body.removeChild(ta);
            	return ok;
        	} catch (e) { return false; }
    	}
    	if (navigator.clipboard && navigator.clipboard.writeText) {
        	navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
            	if (tryExecCommandCopy()) showSuccess(); else showFallback();
        	});
    	} else if (tryExecCommandCopy()) {
        	showSuccess();
    	} else {
        	showFallback();
    	}
	}

	$("m08_quetBtn").addEventListener("click", quetHao);
	$("m08_xuLyBtn").addEventListener("click", xuLy);
	$("m08_copyBtn").addEventListener("click", copyKetQua);

})();