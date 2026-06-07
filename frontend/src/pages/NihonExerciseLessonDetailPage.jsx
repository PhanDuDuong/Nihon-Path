import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoginRequiredModal from "../components/LoginRequiredModal.jsx";
import PronunciationButton from "../components/PronunciationButton.jsx";
import StudyShell from "../components/StudyShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getLessonDetail, getLessonsForCategory } from "../data/exerciseLessonCatalog.js";
import { n5GrammarCleanLessons } from "../data/n5GrammarCleanLessons.js";
import { n4GrammarCleanLessons } from "../data/n4GrammarCleanLessons.js";
import { n4VocabularyLessons } from "../data/n4VocabularyLessons.js";
import { n5ReadingLessons } from "../content/n5ReadingLessons.js";
import { n5ListeningLessons } from "../content/n5ListeningLessons.js";
import { isLessonCompleted, markLessonCompleted } from "../utils/lessonProgress.js";

const n5VocabularyLessonOne = [
  { kana: "わたし", writing: "私", meaning: "tôi" },
  { kana: "わたしたち", writing: "私たち", meaning: "chúng tôi, chúng ta" },
  { kana: "あなた", writing: "", meaning: "anh/chị, ông/bà, bạn", note: "Ngôi thứ II số ít." },
  { kana: "あのひと", writing: "あの人", meaning: "người kia, người đó" },
  { kana: "あのかた", writing: "あの方", meaning: "vị kia, ngài kia", note: "Cách nói lịch sự của あの人." },
  { kana: "みなさん", writing: "皆さん", meaning: "các anh chị, các ông bà, các bạn, quý vị" },
  { kana: "~さん", writing: "", meaning: "anh, chị, ông, bà", note: "Gắn sau tên hoặc nghề để gọi người khác một cách lịch sự." },
  { kana: "~ちゃん", writing: "", meaning: "hậu tố gọi thân mật", note: "Thường gắn sau tên trẻ em, thay cho ~さん." },
  { kana: "~くん", writing: "~君", meaning: "hậu tố gọi tên em trai/bạn nam", note: "Thường dùng với nam giới nhỏ tuổi hơn hoặc ngang hàng thân thiết." },
  { kana: "~じん", writing: "~人", meaning: "người nước ~", note: "Ví dụ: アメリカ人." },
  { kana: "せんせい", writing: "先生", meaning: "thầy/cô", note: "Không dùng để nói về nghề nghiệp giáo viên của chính mình." },
  { kana: "きょうし", writing: "教師", meaning: "giáo viên" },
  { kana: "がくせい", writing: "学生", meaning: "học sinh, sinh viên" },
  { kana: "かいしゃいん", writing: "会社員", meaning: "nhân viên công ty" },
  { kana: "しゃいん", writing: "社員", meaning: "nhân viên công ty", note: "Dùng kèm tên công ty. Ví dụ: IMCの社員." },
  { kana: "ぎんこういん", writing: "銀行員", meaning: "nhân viên ngân hàng" },
  { kana: "いしゃ", writing: "医者", meaning: "bác sĩ" },
  { kana: "けんきゅうしゃ", writing: "研究者", meaning: "nhà nghiên cứu" },
  { kana: "エンジニア", writing: "", meaning: "kỹ sư" },
  { kana: "だいがく", writing: "大学", meaning: "đại học, trường đại học" },
  { kana: "びょういん", writing: "病院", meaning: "bệnh viện" },
  { kana: "でんき", writing: "電気", meaning: "điện, đèn điện" },
  { kana: "だれ", writing: "誰", meaning: "ai" },
  { kana: "どなた", writing: "", meaning: "vị nào, ai", note: "Cách nói lịch sự của だれ." },
  { kana: "いっさい", writing: "一歳", meaning: "một tuổi" },
  { kana: "なんさい", writing: "何歳", meaning: "mấy tuổi, bao nhiêu tuổi", note: "おいくつ là cách nói lịch sự." },
  { kana: "はい", writing: "", meaning: "vâng, dạ" },
  { kana: "いいえ", writing: "", meaning: "không" },
  { kana: "しつれいですが", writing: "失礼ですが", meaning: "xin lỗi, ..." },
  { kana: "おなまえは?", writing: "お名前は?", meaning: "tên anh/chị là gì?" },
  { kana: "はじめまして。", writing: "初めまして。", meaning: "rất hân hạnh được gặp anh/chị", note: "Lời chào đầu tiên khi mới gặp." },
  { kana: "どうぞよろしくお願いします。", writing: "どうぞよろしくお願いします。", meaning: "rất mong được giúp đỡ; rất vui được làm quen", note: "Dùng làm câu kết thúc sau khi giới thiệu về mình." },
  { kana: "こちらは~さんです。", writing: "", meaning: "đây là anh/chị/ông/bà ~" },
  { kana: "~からきました。", writing: "~から来ました。", meaning: "tôi đến từ ~" },
  { kana: "アメリカ", writing: "", meaning: "Mỹ" },
  { kana: "イギリス", writing: "", meaning: "Anh" },
  { kana: "インド", writing: "", meaning: "Ấn Độ" },
  { kana: "インドネシア", writing: "", meaning: "Indonesia" },
  { kana: "かんこく", writing: "韓国", meaning: "Hàn Quốc" },
  { kana: "タイ", writing: "", meaning: "Thái Lan" },
  { kana: "ちゅうごく", writing: "中国", meaning: "Trung Quốc" },
  { kana: "ドイツ", writing: "", meaning: "Đức" },
  { kana: "にほん", writing: "日本", meaning: "Nhật Bản" },
  { kana: "フランス", writing: "", meaning: "Pháp" },
  { kana: "ブラジル", writing: "", meaning: "Braxin" },
  { kana: "さくらだいがく", writing: "さくら大学", meaning: "tên các trường đại học", note: "Tên giả tưởng." },
  { kana: "IMC/パワー電気/ブラジルエアー", writing: "", meaning: "tên các công ty", note: "Tên giả tưởng." },
  { kana: "AKC", writing: "", meaning: "tên một tổ chức", note: "Tên giả tưởng." },
  { kana: "こうべびょういん", writing: "神戸病院", meaning: "tên một bệnh viện", note: "Tên giả tưởng." },
];

const n5VocabularyLessonTwo = [
  { kana: "これ", writing: "", meaning: "cái này, đây", note: "Vật ở gần người nói." },
  { kana: "それ", writing: "", meaning: "cái đó, đó", note: "Vật ở gần người nghe." },
  { kana: "あれ", writing: "", meaning: "cái kia, kia", note: "Vật ở xa cả người nói và người nghe." },
  { kana: "この~", writing: "", meaning: "~ này", note: "Gần người nói." },
  { kana: "その~", writing: "", meaning: "~ đó", note: "Gần người nghe." },
  { kana: "あの~", writing: "", meaning: "~ kia", note: "Xa cả người nói và người nghe." },
  { kana: "ほん", writing: "本", meaning: "sách" },
  { kana: "じしょ", writing: "辞書", meaning: "từ điển" },
  { kana: "ざっし", writing: "雑誌", meaning: "tạp chí" },
  { kana: "しんぶん", writing: "新聞", meaning: "báo" },
  { kana: "ノート", writing: "", meaning: "vở" },
  { kana: "てちょう", writing: "手帳", meaning: "sổ tay" },
  { kana: "めいし", writing: "名刺", meaning: "danh thiếp" },
  { kana: "カード", writing: "", meaning: "thẻ, card", note: "Thẻ tín dụng, các loại thẻ." },
  { kana: "えんぴつ", writing: "鉛筆", meaning: "bút chì" },
  { kana: "ボールペン", writing: "", meaning: "bút bi" },
  { kana: "シャープペンシル", writing: "", meaning: "bút chì kim, bút chì bấm" },
  { kana: "かぎ", writing: "", meaning: "chìa khóa" },
  { kana: "とけい", writing: "時計", meaning: "đồng hồ" },
  { kana: "かさ", writing: "傘", meaning: "ô, dù" },
  { kana: "かばん", writing: "", meaning: "cặp sách, túi sách" },
  { kana: "CD", writing: "", meaning: "đĩa CD" },
  { kana: "テレビ", writing: "", meaning: "tivi" },
  { kana: "ラジオ", writing: "", meaning: "radio" },
  { kana: "カメラ", writing: "", meaning: "máy ảnh" },
  { kana: "コンピューター", writing: "", meaning: "máy vi tính" },
  { kana: "くるま", writing: "車", meaning: "ô tô, xe hơi" },
  { kana: "つくえ", writing: "机", meaning: "bàn" },
  { kana: "いす", writing: "", meaning: "ghế" },
  { kana: "おみやげ", writing: "お土産", meaning: "quà", note: "Quà mua khi đi xa về hoặc mang đi khi thăm nhà người nào đó." },
  { kana: "えいご", writing: "英語", meaning: "tiếng Anh" },
  { kana: "にほんご", writing: "日本語", meaning: "tiếng Nhật" },
  { kana: "~ご", writing: "~語", meaning: "tiếng ~" },
  { kana: "なん", writing: "何", meaning: "gì, cái gì" },
  { kana: "そう", writing: "", meaning: "vậy" },
  { kana: "あのう", writing: "", meaning: "à, ờ...", note: "Dùng để biểu thị sự ngập ngừng, do dự." },
  { kana: "えっ", writing: "", meaning: "hả?", note: "Dùng khi nghe một điều không mong muốn hoặc bất ngờ." },
  { kana: "どうぞ", writing: "", meaning: "xin mời", note: "Dùng khi mời ai đó cái gì." },
  { kana: "どうもありがとうございます。", writing: "", meaning: "xin chân thành cảm ơn, xin cảm ơn rất nhiều" },
  { kana: "そうですか。", writing: "", meaning: "thế à" },
  { kana: "違います。", writing: "ちがいます。", meaning: "không phải, không đúng, sai rồi" },
  { kana: "あ", writing: "", meaning: "ôi!", note: "Dùng khi nhận ra điều gì." },
  { kana: "これからお世話になります。", writing: "", meaning: "từ nay tôi rất mong được sự giúp đỡ của anh/chị." },
  { kana: "こちらこそどうぞよろしくお願いします。", writing: "", meaning: "chính tôi mới là người mong được sự giúp đỡ của anh/chị.", note: "Đáp lại câu どうぞよろしくお願いします." },
];

const n5VocabularyLessonThree = [
  { kana: "ここ", writing: "", meaning: "chỗ này, đằng này, đây", note: "Gần người nói." },
  { kana: "そこ", writing: "", meaning: "chỗ đó, đó", note: "Gần người nghe." },
  { kana: "あそこ", writing: "", meaning: "chỗ kia, đằng kia, kia", note: "Xa cả người nói và người nghe." },
  { kana: "どこ", writing: "", meaning: "chỗ nào, đâu" },
  { kana: "こちら", writing: "", meaning: "phía này, đằng này, chỗ này, đây", note: "Cách nói lịch sự của ここ." },
  { kana: "そちら", writing: "", meaning: "phía đó, đằng đó, chỗ đó, đó", note: "Cách nói lịch sự của そこ." },
  { kana: "あちら", writing: "", meaning: "phía kia, đằng kia, chỗ kia, kia", note: "Cách nói lịch sự của あそこ." },
  { kana: "どちら", writing: "", meaning: "phía nào, đằng nào, chỗ nào, đâu", note: "Cách nói lịch sự của どこ." },
  { kana: "きょうしつ", writing: "教室", meaning: "lớp học, phòng học" },
  { kana: "しょくどう", writing: "食堂", meaning: "nhà ăn" },
  { kana: "じむしょ", writing: "事務所", meaning: "văn phòng" },
  { kana: "かいぎしつ", writing: "会議室", meaning: "phòng họp" },
  { kana: "うけつけ", writing: "受付", meaning: "quầy lễ tân, phòng thường trực" },
  { kana: "ロビー", writing: "", meaning: "hành lang, đại sảnh" },
  { kana: "へや", writing: "部屋", meaning: "căn phòng" },
  { kana: "トイレ", writing: "", meaning: "toilet, nhà vệ sinh, phòng vệ sinh", note: "おてあらい là cách nói lịch sự." },
  { kana: "おてあらい", writing: "お手洗い", meaning: "toilet, nhà vệ sinh, phòng vệ sinh" },
  { kana: "かいだん", writing: "階段", meaning: "cầu thang" },
  { kana: "エレベーター", writing: "", meaning: "thang máy" },
  { kana: "エスカレーター", writing: "", meaning: "thang cuốn" },
  { kana: "じどうはんばいき", writing: "自動販売機", meaning: "máy bán hàng tự động" },
  { kana: "でんわ", writing: "電話", meaning: "điện thoại" },
  { kana: "くに", writing: "国", meaning: "nước", note: "おくに: nước của bạn/anh/chị." },
  { kana: "かいしゃ", writing: "会社", meaning: "công ty" },
  { kana: "うち", writing: "", meaning: "nhà" },
  { kana: "くつ", writing: "靴", meaning: "giày" },
  { kana: "ネクタイ", writing: "", meaning: "cà vạt" },
  { kana: "ワイン", writing: "", meaning: "rượu vang" },
  { kana: "うりば", writing: "売り場", meaning: "quầy bán", note: "Trong một bách hóa, v.v." },
  { kana: "ちか", writing: "地下", meaning: "tầng hầm, dưới mặt đất" },
  { kana: "~かい", writing: "~階", meaning: "tầng thứ ~" },
  { kana: "なんがい", writing: "何階", meaning: "tầng mấy" },
  { kana: "~えん", writing: "~円", meaning: "~ yên" },
  { kana: "いくら", writing: "", meaning: "bao nhiêu tiền" },
  { kana: "ひゃく", writing: "百", meaning: "trăm" },
  { kana: "せん", writing: "千", meaning: "nghìn" },
  { kana: "まん", writing: "万", meaning: "mười nghìn, vạn" },
  { kana: "すみません。", writing: "", meaning: "xin lỗi" },
  { kana: "どうも。", writing: "", meaning: "cảm ơn" },
  { kana: "いらっしゃいませ。", writing: "", meaning: "xin chào quý khách, mời quý khách vào.", note: "Lời chào khách hàng khi họ vào quán, quầy, v.v." },
  { kana: "~を見てください。", writing: "", meaning: "cho tôi xem ~" },
  { kana: "じゃ", writing: "", meaning: "thế thì, vậy thì" },
  { kana: "~をください。", writing: "", meaning: "cho tôi ~" },
  { kana: "イタリア", writing: "", meaning: "Ý" },
  { kana: "スイス", writing: "", meaning: "Thụy Sĩ" },
  { kana: "フランス", writing: "", meaning: "Pháp" },
  { kana: "ジャカルタ", writing: "", meaning: "Gia-các-ta" },
  { kana: "バンコク", writing: "", meaning: "Băng-cốc" },
  { kana: "ベルリン", writing: "", meaning: "Béc-lin" },
  { kana: "しんおおさか", writing: "新大阪", meaning: "tên một ga ở Osaka" },
];

const n5VocabularyLessonFour = [
  { kana: "おきます", writing: "起きます", meaning: "dậy, thức dậy" },
  { kana: "ねます", writing: "寝ます", meaning: "ngủ, đi ngủ" },
  { kana: "はたらきます", writing: "働きます", meaning: "làm việc" },
  { kana: "やすみます", writing: "休みます", meaning: "nghỉ, nghỉ ngơi" },
  { kana: "べんきょうします", writing: "勉強します", meaning: "học" },
  { kana: "おわります", writing: "終わります", meaning: "hết, kết thúc, xong" },
  { kana: "デパート", writing: "", meaning: "bách hóa" },
  { kana: "ぎんこう", writing: "銀行", meaning: "ngân hàng" },
  { kana: "ゆうびんきょく", writing: "郵便局", meaning: "bưu điện" },
  { kana: "としょかん", writing: "図書館", meaning: "thư viện" },
  { kana: "びじゅつかん", writing: "美術館", meaning: "bảo tàng mỹ thuật" },
  { kana: "いま", writing: "今", meaning: "bây giờ" },
  { kana: "~じ", writing: "~時", meaning: "~ giờ" },
  { kana: "~ふん/~ぷん", writing: "~分", meaning: "~ phút" },
  { kana: "はん", writing: "半", meaning: "rưỡi, nửa" },
  { kana: "なんじ", writing: "何時", meaning: "mấy giờ" },
  { kana: "なんぷん", writing: "何分", meaning: "mấy phút" },
  { kana: "ごぜん", writing: "午前", meaning: "sáng, trước mười hai giờ trưa" },
  { kana: "ごご", writing: "午後", meaning: "chiều, sau mười hai giờ trưa" },
  { kana: "あさ", writing: "朝", meaning: "buổi sáng, sáng" },
  { kana: "ひる", writing: "昼", meaning: "buổi trưa, trưa" },
  { kana: "ばん/よる", writing: "晩/夜", meaning: "buổi tối, tối" },
  { kana: "おととい", writing: "", meaning: "hôm kia" },
  { kana: "きのう", writing: "", meaning: "hôm qua" },
  { kana: "きょう", writing: "", meaning: "hôm nay" },
  { kana: "あした", writing: "", meaning: "ngày mai" },
  { kana: "あさって", writing: "", meaning: "ngày kia" },
  { kana: "けさ", writing: "", meaning: "sáng nay" },
  { kana: "こんばん", writing: "今晩", meaning: "tối nay" },
  { kana: "やすみ", writing: "休み", meaning: "nghỉ, nghỉ phép, ngày nghỉ" },
  { kana: "ひるやすみ", writing: "昼休み", meaning: "nghỉ trưa" },
  { kana: "しけん", writing: "試験", meaning: "thi, kỳ thi, kiểm tra" },
  { kana: "かいぎ", writing: "会議", meaning: "cuộc họp, hội nghị", note: "~をします: tổ chức cuộc họp, hội nghị." },
  { kana: "えいが", writing: "映画", meaning: "phim, điện ảnh" },
  { kana: "まいあさ", writing: "毎朝", meaning: "hàng sáng, mỗi sáng" },
  { kana: "まいばん", writing: "毎晩", meaning: "hàng tối, mỗi tối" },
  { kana: "まいにち", writing: "毎日", meaning: "hàng ngày, mỗi ngày" },
  { kana: "げつようび", writing: "月曜日", meaning: "thứ hai" },
  { kana: "かようび", writing: "火曜日", meaning: "thứ ba" },
  { kana: "すいようび", writing: "水曜日", meaning: "thứ tư" },
  { kana: "もくようび", writing: "木曜日", meaning: "thứ năm" },
  { kana: "きんようび", writing: "金曜日", meaning: "thứ sáu" },
  { kana: "どようび", writing: "土曜日", meaning: "thứ bảy" },
  { kana: "にちようび", writing: "日曜日", meaning: "chủ nhật" },
  { kana: "なんようび", writing: "何曜日", meaning: "thứ mấy" },
  { kana: "~から", writing: "", meaning: "~ từ" },
  { kana: "~まで", writing: "", meaning: "~ đến" },
  { kana: "~と~", writing: "", meaning: "~ và ~", note: "Dùng để nối danh từ." },
  { kana: "たいへんですね。", writing: "大変ですね。", meaning: "anh/chị vất vả quá.", note: "Dùng để bày tỏ sự thông cảm." },
  { kana: "ばんごう", writing: "番号", meaning: "số" },
  { kana: "なんばん", writing: "何番", meaning: "số bao nhiêu, số mấy" },
  { kana: "そちら", writing: "", meaning: "ông/bà, phía ông/phía bà" },
  { kana: "ニューヨーク", writing: "", meaning: "New York" },
  { kana: "ペキン", writing: "北京", meaning: "Bắc Kinh" },
  { kana: "ロサンゼルス", writing: "", meaning: "Los Angeles" },
  { kana: "ロンドン", writing: "", meaning: "Luân Đôn" },
  { kana: "あすか", writing: "", meaning: "tên giả định của một nhà hàng Nhật" },
  { kana: "アップルぎんこう", writing: "アップル銀行", meaning: "Ngân hàng Apple", note: "Tên giả định." },
  { kana: "みどりとしょかん", writing: "みどり図書館", meaning: "Thư viện Midori", note: "Tên giả định." },
  { kana: "やまとびじゅつかん", writing: "やまと美術館", meaning: "Bảo tàng mỹ thuật Yamato", note: "Tên giả định." },
];

const n5VocabularyLessonFive = [
  { kana: "いきます", writing: "行きます", meaning: "đi" },
  { kana: "きます", writing: "来ます", meaning: "đến" },
  { kana: "かえります", writing: "帰ります", meaning: "về" },
  { kana: "がっこう", writing: "学校", meaning: "trường học" },
  { kana: "スーパー", writing: "", meaning: "siêu thị" },
  { kana: "えき", writing: "駅", meaning: "ga, nhà ga" },
  { kana: "ひこうき", writing: "飛行機", meaning: "máy bay" },
  { kana: "ふね", writing: "船", meaning: "thuyền, tàu thủy" },
  { kana: "でんしゃ", writing: "電車", meaning: "tàu điện" },
  { kana: "ちかてつ", writing: "地下鉄", meaning: "tàu điện ngầm" },
  { kana: "しんかんせん", writing: "新幹線", meaning: "tàu Shinkansen", note: "Tàu điện cao tốc của Nhật." },
  { kana: "バス", writing: "", meaning: "xe buýt" },
  { kana: "タクシー", writing: "", meaning: "tắc-xi" },
  { kana: "じてんしゃ", writing: "自転車", meaning: "xe đạp" },
  { kana: "あるいて", writing: "歩いて", meaning: "đi bộ" },
  { kana: "ひと", writing: "人", meaning: "người" },
  { kana: "ともだち", writing: "友達", meaning: "bạn, bạn bè" },
  { kana: "かれ", writing: "彼", meaning: "anh ấy, bạn trai" },
  { kana: "かのじょ", writing: "彼女", meaning: "chị ấy, bạn gái" },
  { kana: "かぞく", writing: "家族", meaning: "gia đình" },
  { kana: "ひとりで", writing: "一人で", meaning: "một mình" },
  { kana: "せんしゅう", writing: "先週", meaning: "tuần trước" },
  { kana: "こんしゅう", writing: "今週", meaning: "tuần này" },
  { kana: "らいしゅう", writing: "来週", meaning: "tuần sau" },
  { kana: "せんげつ", writing: "先月", meaning: "tháng trước" },
  { kana: "こんげつ", writing: "今月", meaning: "tháng này" },
  { kana: "らいげつ", writing: "来月", meaning: "tháng sau" },
  { kana: "きょねん", writing: "去年", meaning: "năm ngoái" },
  { kana: "ことし", writing: "", meaning: "năm nay" },
  { kana: "らいねん", writing: "来年", meaning: "sang năm" },
  { kana: "~ねん", writing: "~年", meaning: "năm ~" },
  { kana: "なんねん", writing: "何年", meaning: "mấy năm" },
  { kana: "~がつ", writing: "~月", meaning: "tháng ~" },
  { kana: "なんがつ", writing: "何月", meaning: "tháng mấy" },
  { kana: "ついたち", writing: "1日", meaning: "ngày mồng 1" },
  { kana: "ふつか", writing: "2日", meaning: "ngày mồng 2, 2 ngày" },
  { kana: "みっか", writing: "3日", meaning: "ngày mồng 3, 3 ngày" },
  { kana: "よっか", writing: "4日", meaning: "ngày mồng 4, 4 ngày" },
  { kana: "いつか", writing: "5日", meaning: "ngày mồng 5, 5 ngày" },
  { kana: "むいか", writing: "6日", meaning: "ngày mồng 6, 6 ngày" },
  { kana: "なのか", writing: "7日", meaning: "ngày mồng 7, 7 ngày" },
  { kana: "ようか", writing: "8日", meaning: "ngày mồng 8, 8 ngày" },
  { kana: "ここのか", writing: "9日", meaning: "ngày mồng 9, 9 ngày" },
  { kana: "とおか", writing: "10日", meaning: "ngày mồng 10, 10 ngày" },
  { kana: "じゅうよっか", writing: "14日", meaning: "ngày 14, 14 ngày" },
  { kana: "はつか", writing: "20日", meaning: "ngày 20, 20 ngày" },
  { kana: "にじゅうよっか", writing: "24日", meaning: "ngày 24, 24 ngày" },
  { kana: "~にち", writing: "~日", meaning: "ngày ~, ~ ngày" },
  { kana: "なんにち", writing: "何日", meaning: "ngày mấy, ngày bao nhiêu, mấy ngày, bao nhiêu ngày" },
  { kana: "いつ", writing: "", meaning: "bao giờ, khi nào" },
  { kana: "たんじょうび", writing: "誕生日", meaning: "sinh nhật" },
  { kana: "そうですね。", writing: "", meaning: "ừ, nhỉ" },
  { kana: "どうもありがとうございました。", writing: "", meaning: "xin cảm ơn anh/chị rất nhiều" },
  { kana: "どういたしまして。", writing: "", meaning: "không có gì đâu, anh/chị đừng bận tâm" },
  { kana: "ばんせん", writing: "番線", meaning: "sân ga số ~" },
  { kana: "つぎ", writing: "次", meaning: "tiếp theo" },
  { kana: "ふつう", writing: "普通", meaning: "tàu thường", note: "Dừng cả ở các ga lẻ." },
  { kana: "きゅうこう", writing: "急行", meaning: "tàu tốc hành" },
  { kana: "とっきゅう", writing: "特急", meaning: "tàu tốc hành đặc biệt" },
  { kana: "こうしえん", writing: "甲子園", meaning: "tên một khu phố ở gần Osaka" },
  { kana: "おおさかじょう", writing: "大阪城", meaning: "Lâu đài Osaka, một lâu đài nổi tiếng ở Osaka" },
];

const n5VocabularyLessonSix = [
  { kana: "たべます", writing: "食べます", meaning: "ăn" },
  { kana: "のみます", writing: "飲みます", meaning: "uống" },
  { kana: "すいます", writing: "吸います", meaning: "hút", note: "たばこを~: hút thuốc lá." },
  { kana: "みます", writing: "見ます", meaning: "nhìn, xem" },
  { kana: "ききます", writing: "聞きます", meaning: "nghe" },
  { kana: "よみます", writing: "読みます", meaning: "đọc" },
  { kana: "かきます", writing: "書きます", meaning: "viết", note: "かきます còn có nghĩa là vẽ; trong sách này nghĩa đó được viết bằng chữ Hiragana." },
  { kana: "かいます", writing: "買います", meaning: "mua" },
  { kana: "とります", writing: "撮ります", meaning: "chụp", note: "しゃしんを~: chụp ảnh." },
  { kana: "します", writing: "", meaning: "làm, chơi" },
  { kana: "あいます", writing: "会います", meaning: "gặp", note: "ともだちに~: gặp bạn." },
  { kana: "ごはん", writing: "", meaning: "bữa ăn, cơm" },
  { kana: "あさごはん", writing: "朝ごはん", meaning: "cơm sáng, bữa sáng" },
  { kana: "ひるごはん", writing: "昼ごはん", meaning: "cơm trưa, bữa trưa" },
  { kana: "ばんごはん", writing: "晩ごはん", meaning: "cơm tối, bữa tối" },
  { kana: "パン", writing: "", meaning: "bánh mì" },
  { kana: "たまご", writing: "卵", meaning: "trứng" },
  { kana: "にく", writing: "肉", meaning: "thịt" },
  { kana: "さかな", writing: "魚", meaning: "cá" },
  { kana: "やさい", writing: "野菜", meaning: "rau" },
  { kana: "くだもの", writing: "果物", meaning: "hoa quả, trái cây" },
  { kana: "みず", writing: "水", meaning: "nước" },
  { kana: "おちゃ", writing: "お茶", meaning: "trà, trà xanh" },
  { kana: "こうちゃ", writing: "紅茶", meaning: "trà đen" },
  { kana: "ぎゅうにゅう", writing: "牛乳", meaning: "sữa bò, sữa", note: "Còn gọi là ミルク." },
  { kana: "ジュース", writing: "", meaning: "nước hoa quả" },
  { kana: "ビール", writing: "", meaning: "bia" },
  { kana: "おさけ", writing: "お酒", meaning: "rượu, rượu gạo Nhật Bản" },
  { kana: "たばこ", writing: "", meaning: "thuốc lá" },
  { kana: "てがみ", writing: "手紙", meaning: "thư" },
  { kana: "レポート", writing: "", meaning: "báo cáo" },
  { kana: "しゃしん", writing: "写真", meaning: "ảnh" },
  { kana: "ビデオ", writing: "", meaning: "băng video, đầu video" },
  { kana: "みせ", writing: "店", meaning: "cửa hàng, tiệm" },
  { kana: "にわ", writing: "庭", meaning: "vườn" },
  { kana: "しゅくだい", writing: "宿題", meaning: "bài tập về nhà", note: "しゅくだいをします: làm bài tập về nhà." },
  { kana: "テニス", writing: "", meaning: "quần vợt", note: "テニスをします: đánh quần vợt." },
  { kana: "サッカー", writing: "", meaning: "bóng đá", note: "サッカーをします: chơi bóng đá." },
  { kana: "はなみ", writing: "花見", meaning: "việc ngắm hoa anh đào", note: "はなみをします: ngắm hoa." },
  { kana: "なに", writing: "何", meaning: "cái gì, gì" },
  { kana: "いっしょに", writing: "", meaning: "cùng, cùng nhau" },
  { kana: "ちょっと", writing: "", meaning: "một chút" },
  { kana: "いつも", writing: "", meaning: "luôn luôn, lúc nào cũng" },
  { kana: "ときどき", writing: "時々", meaning: "thỉnh thoảng" },
  { kana: "それから", writing: "", meaning: "sau đó, tiếp theo" },
  { kana: "ええ", writing: "", meaning: "vâng, được" },
  { kana: "いいですね。", writing: "", meaning: "được đấy, hay quá" },
  { kana: "わかりました。", writing: "", meaning: "tôi hiểu rồi, vâng ạ" },
  { kana: "なんですか。", writing: "何ですか。", meaning: "có gì đấy? cái gì vậy? vâng có tôi." },
  { kana: "じゃ、また。", writing: "", meaning: "hẹn gặp lại", note: "Cũng dùng: じゃ、またあした." },
  { kana: "メキシコ", writing: "", meaning: "Mexico" },
  { kana: "大阪デパート", writing: "", meaning: "tên bách hóa giả định" },
  { kana: "つるや", writing: "", meaning: "tên nhà hàng giả định" },
  { kana: "フランス屋", writing: "", meaning: "tên siêu thị giả định" },
  { kana: "桜自庭", writing: "", meaning: "tên siêu thị giả định" },
];

const n5VocabularyLessonSeven = [
  { kana: "きります", writing: "切ります", meaning: "cắt" },
  { kana: "おくります", writing: "送ります", meaning: "gửi" },
  { kana: "あげます", writing: "", meaning: "cho, tặng" },
  { kana: "もらいます", writing: "", meaning: "nhận" },
  { kana: "かします", writing: "貸します", meaning: "cho mượn, cho vay" },
  { kana: "かります", writing: "借ります", meaning: "mượn, vay" },
  { kana: "おしえます", writing: "教えます", meaning: "dạy" },
  { kana: "ならいます", writing: "習います", meaning: "học, tập" },
  { kana: "かけます", writing: "", meaning: "gọi", note: "でんわを~: gọi điện thoại." },
  { kana: "て", writing: "手", meaning: "tay" },
  { kana: "はし", writing: "", meaning: "đũa" },
  { kana: "スプーン", writing: "", meaning: "thìa" },
  { kana: "ナイフ", writing: "", meaning: "dao" },
  { kana: "フォーク", writing: "", meaning: "dĩa, nĩa" },
  { kana: "はさみ", writing: "", meaning: "kéo" },
  { kana: "パソコン", writing: "", meaning: "máy tính cá nhân" },
  { kana: "ケータイ", writing: "", meaning: "điện thoại di động" },
  { kana: "メール", writing: "", meaning: "thư điện tử, email" },
  { kana: "ねんがじょう", writing: "年賀状", meaning: "thiệp mừng năm mới" },
  { kana: "パンチ", writing: "", meaning: "cái đục lỗ" },
  { kana: "ホッチキス", writing: "", meaning: "cái dập ghim" },
  { kana: "セロテープ", writing: "", meaning: "băng dính" },
  { kana: "けしゴム", writing: "消しゴム", meaning: "cái tẩy, cục tẩy" },
  { kana: "かみ", writing: "紙", meaning: "giấy" },
  { kana: "はな", writing: "花", meaning: "hoa" },
  { kana: "シャツ", writing: "", meaning: "áo sơ mi" },
  { kana: "プレゼント", writing: "", meaning: "quà tặng, tặng phẩm" },
  { kana: "にもつ", writing: "荷物", meaning: "đồ đạc, hành lý" },
  { kana: "おかね", writing: "お金", meaning: "tiền" },
  { kana: "きっぷ", writing: "切符", meaning: "vé" },
  { kana: "クリスマス", writing: "", meaning: "Giáng sinh" },
  { kana: "ちち", writing: "父", meaning: "bố", note: "Dùng khi nói về bố mình." },
  { kana: "はは", writing: "母", meaning: "mẹ", note: "Dùng khi nói về mẹ mình." },
  { kana: "おとうさん", writing: "お父さん", meaning: "bố", note: "Dùng khi nói về bố người khác và dùng khi xưng hô với bố mình." },
  { kana: "おかあさん", writing: "お母さん", meaning: "mẹ", note: "Dùng khi nói về mẹ người khác và dùng khi xưng hô với mẹ mình." },
  { kana: "もう", writing: "", meaning: "đã, rồi" },
  { kana: "まだ", writing: "", meaning: "chưa" },
  { kana: "これから", writing: "", meaning: "từ bây giờ, sau đây" },
  { kana: "~、すてきですね。", writing: "", meaning: "~ này, đẹp nhỉ" },
  { kana: "いらっしゃい。", writing: "", meaning: "rất hoan nghênh anh/chị đã đến chơi; chào mừng anh/chị đã đến chơi" },
  { kana: "どうぞお上がりください。", writing: "", meaning: "mời anh/chị vào" },
  { kana: "失礼します。", writing: "しつれいします。", meaning: "xin phép tôi vào; xin phép ~", note: "Dùng khi bước vào nhà người khác." },
  { kana: "~はいかがですか。", writing: "", meaning: "anh/chị dùng ~ nhé?", note: "Dùng khi mời ai đó cái gì." },
  { kana: "いただきます。", writing: "", meaning: "mời anh/chị dùng; tôi xin dùng", note: "Cách nói trước khi ăn hoặc uống." },
  { kana: "ごちそうさまでした。", writing: "", meaning: "xin cảm ơn anh/chị đã đãi bữa ăn ngon", note: "Câu nói sau khi ăn xong." },
  { kana: "スペイン", writing: "", meaning: "Tây Ban Nha" },
];

const n5VocabularyLessonEight = [
  { kana: "ハンサムな", writing: "", meaning: "đẹp trai" },
  { kana: "きれいな", writing: "", meaning: "đẹp, sạch" },
  { kana: "しずかな", writing: "静かな", meaning: "yên tĩnh" },
  { kana: "にぎやかな", writing: "", meaning: "náo nhiệt" },
  { kana: "ゆうめいな", writing: "有名な", meaning: "nổi tiếng" },
  { kana: "しんせつな", writing: "親切な", meaning: "tốt bụng, thân thiện", note: "Không dùng khi nói về người trong gia đình mình." },
  { kana: "げんきな", writing: "元気な", meaning: "khỏe, khỏe khoắn" },
  { kana: "ひまな", writing: "暇な", meaning: "rảnh rỗi" },
  { kana: "べんりな", writing: "便利な", meaning: "tiện lợi" },
  { kana: "すてきな", writing: "", meaning: "đẹp, hay" },
  { kana: "おおきい", writing: "大きい", meaning: "to, lớn" },
  { kana: "ちいさい", writing: "小さい", meaning: "nhỏ, bé" },
  { kana: "あたらしい", writing: "新しい", meaning: "mới" },
  { kana: "ふるい", writing: "古い", meaning: "cũ", note: "Không dùng khi nói về tuổi tác của một người." },
  { kana: "いい/よい", writing: "", meaning: "tốt" },
  { kana: "わるい", writing: "悪い", meaning: "xấu" },
  { kana: "あつい", writing: "暑い/熱い", meaning: "nóng" },
  { kana: "さむい", writing: "寒い", meaning: "lạnh, rét", note: "Dùng cho thời tiết." },
  { kana: "つめたい", writing: "冷たい", meaning: "lạnh, buốt", note: "Dùng cho cảm giác." },
  { kana: "むずかしい", writing: "難しい", meaning: "khó" },
  { kana: "やさしい", writing: "易しい", meaning: "dễ" },
  { kana: "たかい", writing: "高い", meaning: "đắt, cao" },
  { kana: "やすい", writing: "安い", meaning: "rẻ" },
  { kana: "ひくい", writing: "低い", meaning: "thấp" },
  { kana: "おもしろい", writing: "", meaning: "thú vị, hay" },
  { kana: "おいしい", writing: "", meaning: "ngon" },
  { kana: "いそがしい", writing: "忙しい", meaning: "bận" },
  { kana: "たのしい", writing: "楽しい", meaning: "vui" },
  { kana: "しろい", writing: "白い", meaning: "trắng" },
  { kana: "くろい", writing: "黒い", meaning: "đen" },
  { kana: "あかい", writing: "赤い", meaning: "đỏ" },
  { kana: "あおい", writing: "青い", meaning: "xanh da trời" },
  { kana: "さくら", writing: "桜", meaning: "anh đào, hoa anh đào" },
  { kana: "やま", writing: "山", meaning: "núi" },
  { kana: "まち", writing: "町", meaning: "thị trấn, thị xã, thành phố" },
  { kana: "たべもの", writing: "食べ物", meaning: "đồ ăn" },
  { kana: "ところ", writing: "所", meaning: "nơi, chỗ" },
  { kana: "りょう", writing: "寮", meaning: "kí túc xá" },
  { kana: "レストラン", writing: "", meaning: "nhà hàng" },
  { kana: "せいかつ", writing: "生活", meaning: "cuộc sống, sinh hoạt" },
  { kana: "しごと", writing: "仕事", meaning: "việc, công việc", note: "しごとをします: làm việc." },
  { kana: "どう", writing: "", meaning: "thế nào" },
  { kana: "どんな~", writing: "", meaning: "~ như thế nào" },
  { kana: "とても", writing: "", meaning: "rất, lắm" },
  { kana: "あまり", writing: "", meaning: "không ~ lắm", note: "Dùng với thể phủ định." },
  { kana: "そして", writing: "", meaning: "và, thêm nữa", note: "Dùng để nối hai câu." },
  { kana: "~が~", writing: "", meaning: "~, nhưng ~" },
  { kana: "お元気ですか。", writing: "", meaning: "anh/chị có khỏe không?" },
  { kana: "そうですね。", writing: "", meaning: "thế à, để tôi xem", note: "Cách nói trong lúc suy nghĩ câu trả lời." },
  { kana: "~、もう一杯いかがですか。", writing: "", meaning: "anh/chị dùng thêm một chén/ly nữa nhé?" },
  { kana: "いいえ、けっこうです。", writing: "", meaning: "không, đủ rồi ạ" },
  { kana: "もう~です。", writing: "", meaning: "đã ~ rồi, ~ rồi, đúng không?" },
  { kana: "そろそろ失礼します。", writing: "", meaning: "sắp đến lúc tôi phải xin phép rồi; đến lúc tôi phải về" },
  { kana: "いいえ。", writing: "", meaning: "không có gì, không sao cả" },
  { kana: "またいらっしゃってください。", writing: "", meaning: "lần sau anh/chị lại đến chơi nhé" },
  { kana: "シャンハイ", writing: "上海", meaning: "Thượng Hải" },
  { kana: "金閣寺", writing: "きんかくじ", meaning: "Chùa Kinkakuji", note: "Chùa Vàng." },
  { kana: "奈良公園", writing: "ならこうえん", meaning: "Công viên Nara" },
  { kana: "富士山", writing: "ふじさん", meaning: "núi Phú Sĩ" },
  { kana: "七人の侍", writing: "しちにんのさむらい", meaning: "7 chàng võ sĩ Samurai", note: "Một bộ phim kinh điển của đạo diễn Kurosawa Akira." },
  { kana: "わかります", writing: "", meaning: "hiểu, nắm được" },
  { kana: "あります", writing: "", meaning: "có", note: "Sở hữu." },
  { kana: "すきな", writing: "好きな", meaning: "thích" },
  { kana: "きらいな", writing: "嫌いな", meaning: "ghét, không thích" },
  { kana: "じょうずな", writing: "上手な", meaning: "giỏi, khéo" },
  { kana: "へたな", writing: "下手な", meaning: "kém" },
  { kana: "のみもの", writing: "飲み物", meaning: "đồ uống" },
  { kana: "りょうり", writing: "料理", meaning: "món, việc nấu ăn", note: "りょうりをします: nấu ăn." },
  { kana: "スポーツ", writing: "", meaning: "thể thao", note: "スポーツをします: chơi thể thao." },
  { kana: "やきゅう", writing: "野球", meaning: "bóng chày", note: "やきゅうをします: chơi bóng chày." },
  { kana: "ダンス", writing: "", meaning: "nhảy, khiêu vũ", note: "ダンスをします: nhảy, khiêu vũ." },
  { kana: "りょこう", writing: "旅行", meaning: "du lịch, chuyến du lịch", note: "りょこうをします: đi du lịch." },
  { kana: "おんがく", writing: "音楽", meaning: "âm nhạc" },
  { kana: "うた", writing: "歌", meaning: "bài hát" },
  { kana: "クラシック", writing: "", meaning: "nhạc cổ điển" },
  { kana: "ジャズ", writing: "", meaning: "nhạc jazz" },
  { kana: "コンサート", writing: "", meaning: "buổi hòa nhạc" },
  { kana: "カラオケ", writing: "", meaning: "karaoke" },
  { kana: "かぶき", writing: "歌舞伎", meaning: "Kabuki", note: "Một thể loại ca kịch truyền thống của Nhật." },
  { kana: "え", writing: "絵", meaning: "tranh, hội họa" },
  { kana: "じ", writing: "字", meaning: "chữ" },
  { kana: "かんじ", writing: "漢字", meaning: "chữ Hán" },
  { kana: "ひらがな", writing: "", meaning: "chữ Hiragana" },
  { kana: "カタカナ", writing: "", meaning: "chữ Katakana" },
  { kana: "ローマじ", writing: "ローマ字", meaning: "chữ La Mã" },
  { kana: "こまかいおかね", writing: "細かいお金", meaning: "tiền lẻ" },
  { kana: "チケット", writing: "", meaning: "vé" },
  { kana: "じかん", writing: "時間", meaning: "thời gian" },
  { kana: "ようじ", writing: "用事", meaning: "việc bận, công chuyện" },
  { kana: "やくそく", writing: "約束", meaning: "cuộc hẹn, lời hứa", note: "やくそくをします: hứa, hẹn." },
];

const n5VocabularyLessonNine = [
  { kana: "わかります", writing: "", meaning: "hiểu, nắm được" },
  { kana: "あります", writing: "", meaning: "có", note: "Sở hữu." },
  { kana: "すきな", writing: "好きな", meaning: "thích" },
  { kana: "きらいな", writing: "嫌いな", meaning: "ghét, không thích" },
  { kana: "じょうずな", writing: "上手な", meaning: "giỏi, khéo" },
  { kana: "へたな", writing: "下手な", meaning: "kém" },
  { kana: "のみもの", writing: "飲み物", meaning: "đồ uống" },
  { kana: "りょうり", writing: "料理", meaning: "món ăn, việc nấu ăn", note: "りょうりをします: nấu ăn." },
  { kana: "スポーツ", writing: "", meaning: "thể thao", note: "スポーツをします: chơi thể thao." },
  { kana: "やきゅう", writing: "野球", meaning: "bóng chày", note: "やきゅうをします: chơi bóng chày." },
  { kana: "ダンス", writing: "", meaning: "nhảy, khiêu vũ", note: "ダンスをします: nhảy, khiêu vũ." },
  { kana: "りょこう", writing: "旅行", meaning: "du lịch, chuyến du lịch", note: "りょこうをします: đi du lịch." },
  { kana: "おんがく", writing: "音楽", meaning: "âm nhạc" },
  { kana: "うた", writing: "歌", meaning: "bài hát" },
  { kana: "クラシック", writing: "", meaning: "nhạc cổ điển" },
  { kana: "ジャズ", writing: "", meaning: "nhạc jazz" },
  { kana: "コンサート", writing: "", meaning: "buổi hòa nhạc" },
  { kana: "カラオケ", writing: "", meaning: "karaoke" },
  { kana: "かぶき", writing: "歌舞伎", meaning: "Kabuki", note: "Một thể loại ca kịch truyền thống của Nhật." },
  { kana: "え", writing: "絵", meaning: "tranh, hội họa" },
  { kana: "じ", writing: "字", meaning: "chữ" },
  { kana: "かんじ", writing: "漢字", meaning: "chữ Hán" },
  { kana: "ひらがな", writing: "", meaning: "chữ Hiragana" },
  { kana: "カタカナ", writing: "", meaning: "chữ Katakana" },
  { kana: "ローマじ", writing: "ローマ字", meaning: "chữ La Mã" },
  { kana: "こまかいおかね", writing: "細かいお金", meaning: "tiền lẻ" },
  { kana: "チケット", writing: "", meaning: "vé" },
  { kana: "じかん", writing: "時間", meaning: "thời gian" },
  { kana: "ようじ", writing: "用事", meaning: "việc bận, công chuyện" },
  { kana: "やくそく", writing: "約束", meaning: "cuộc hẹn, lời hứa", note: "やくそくをします: hứa, hẹn." },
  { kana: "アルバイト", writing: "", meaning: "việc làm thêm", note: "アルバイトをします: làm thêm." },
  { kana: "ごしゅじん", writing: "ご主人", meaning: "chồng", note: "Dùng khi nói về chồng người khác." },
  { kana: "おっと/しゅじん", writing: "夫/主人", meaning: "chồng", note: "Dùng khi nói về chồng mình." },
  { kana: "おくさん", writing: "奥さん", meaning: "vợ", note: "Dùng khi nói về vợ người khác." },
  { kana: "つま/かない", writing: "妻/家内", meaning: "vợ", note: "Dùng khi nói về vợ mình." },
  { kana: "こども", writing: "子ども", meaning: "con cái" },
  { kana: "よく", writing: "", meaning: "tốt, rõ", note: "Mức độ." },
  { kana: "だいたい", writing: "", meaning: "đại khái, đại thể" },
  { kana: "たくさん", writing: "", meaning: "nhiều" },
  { kana: "すこし", writing: "少し", meaning: "ít, một ít" },
  { kana: "ぜんぜん", writing: "全然", meaning: "hoàn toàn không", note: "Dùng với thể phủ định." },
  { kana: "はやく", writing: "早く/速く", meaning: "sớm, nhanh" },
  { kana: "~から", writing: "", meaning: "vì ~" },
  { kana: "どうして", writing: "", meaning: "tại sao" },
  { kana: "かしてください。", writing: "貸してください。", meaning: "hãy cho tôi mượn nó" },
  { kana: "いいですよ。", writing: "", meaning: "được chứ, được ạ" },
  { kana: "残念です。", writing: "ざんねんです。", meaning: "tôi xin lỗi, nhưng...; đáng tiếc là..." },
  { kana: "ああ", writing: "", meaning: "anh/ơi" },
  { kana: "いっしょにいかがですか。", writing: "", meaning: "anh/chị cùng với tôi/chúng tôi không?" },
  { kana: "~はちょっと...", writing: "", meaning: "~ thì có lẽ không được rồi", note: "Cách từ chối khéo khi nhận được một lời mời nào đó." },
  { kana: "だめですか。", writing: "", meaning: "không được à?" },
  { kana: "また今度お願いします。", writing: "またこんどお願いします。", meaning: "hẹn anh/chị lần sau vậy", note: "Cách từ chối khéo một lời mời mà không muốn làm phật lòng người đưa ra lời mời." },
];

const n5VocabularyLessonTen = [
  { kana: "あります", writing: "", meaning: "ở", note: "Tồn tại, dùng cho đồ vật." },
  { kana: "います", writing: "", meaning: "ở", note: "Tồn tại, dùng cho người và động vật." },
  { kana: "いろいろな", writing: "", meaning: "nhiều, đa dạng" },
  { kana: "おとこのひと", writing: "男の人", meaning: "người đàn ông" },
  { kana: "おんなのひと", writing: "女の人", meaning: "người đàn bà" },
  { kana: "おとこのこ", writing: "男の子", meaning: "cậu con trai" },
  { kana: "おんなのこ", writing: "女の子", meaning: "cô con gái" },
  { kana: "いぬ", writing: "犬", meaning: "chó" },
  { kana: "ねこ", writing: "猫", meaning: "mèo" },
  { kana: "パンダ", writing: "", meaning: "gấu trúc" },
  { kana: "ぞう", writing: "象", meaning: "voi" },
  { kana: "き", writing: "木", meaning: "cây, gỗ" },
  { kana: "もの", writing: "物", meaning: "vật, đồ vật" },
  { kana: "でんち", writing: "電池", meaning: "pin" },
  { kana: "はこ", writing: "箱", meaning: "hộp" },
  { kana: "スイッチ", writing: "", meaning: "công tắc" },
  { kana: "れいぞうこ", writing: "冷蔵庫", meaning: "tủ lạnh" },
  { kana: "テーブル", writing: "", meaning: "bàn" },
  { kana: "ベッド", writing: "", meaning: "giường" },
  { kana: "たな", writing: "棚", meaning: "giá sách, kệ sách" },
  { kana: "ドア", writing: "", meaning: "cửa" },
  { kana: "まど", writing: "窓", meaning: "cửa sổ" },
  { kana: "ポスト", writing: "", meaning: "hòm thư, hòm thư công cộng" },
  { kana: "ビル", writing: "", meaning: "tòa nhà" },
  { kana: "ATM", writing: "", meaning: "máy rút tiền tự động, ATM" },
  { kana: "コンビニ", writing: "", meaning: "cửa hàng tiện lợi", note: "Mở 24/24." },
  { kana: "こうえん", writing: "公園", meaning: "công viên" },
  { kana: "きっさてん", writing: "喫茶店", meaning: "quán giải khát, quán cà phê" },
  { kana: "~や", writing: "~屋", meaning: "hiệu, cửa hàng ~" },
  { kana: "のりば", writing: "乗り場", meaning: "điểm đón tắc-xi, tàu, v.v." },
  { kana: "けん", writing: "県", meaning: "tỉnh" },
  { kana: "うえ", writing: "上", meaning: "trên" },
  { kana: "した", writing: "下", meaning: "dưới" },
  { kana: "まえ", writing: "前", meaning: "trước" },
  { kana: "うしろ", writing: "後ろ", meaning: "sau" },
  { kana: "みぎ", writing: "右", meaning: "bên phải" },
  { kana: "ひだり", writing: "左", meaning: "bên trái" },
  { kana: "なか", writing: "中", meaning: "trong, giữa" },
  { kana: "そと", writing: "外", meaning: "ngoài" },
  { kana: "となり", writing: "隣", meaning: "bên cạnh" },
  { kana: "ちかく", writing: "近く", meaning: "gần" },
  { kana: "あいだ", writing: "間", meaning: "giữa, ở giữa" },
  { kana: "~や~など", writing: "", meaning: "~ và ~, v.v." },
  { kana: "どうもすみません。", writing: "", meaning: "cảm ơn" },
  { kana: "ナンプラー", writing: "", meaning: "nampla, nước mắm" },
  { kana: "コーナー", writing: "", meaning: "góc, khu vực" },
  { kana: "いちばんした", writing: "一番下", meaning: "ở dưới cùng" },
  { kana: "東京ディズニーランド", writing: "とうきょうディズニーランド", meaning: "Công viên Tokyo Disneyland" },
  { kana: "アジアストア", writing: "", meaning: "tên siêu thị giả định" },
];

const n5VocabularyLessonEleven = [
  { kana: "います", writing: "", meaning: "có", note: "Dùng với con. Ví dụ: こどもがいます." },
  { kana: "います", writing: "", meaning: "ở", note: "Dùng với Nhật. Ví dụ: 日本にいます." },
  { kana: "かかります", writing: "", meaning: "mất, tốn", note: "Dùng cho thời gian, tiền bạc." },
  { kana: "やすみます", writing: "休みます", meaning: "nghỉ làm việc" },
  { kana: "ひとつ", writing: "1つ", meaning: "một cái", note: "Dùng để đếm đồ vật." },
  { kana: "ふたつ", writing: "2つ", meaning: "hai cái" },
  { kana: "みっつ", writing: "3つ", meaning: "ba cái" },
  { kana: "よっつ", writing: "4つ", meaning: "bốn cái" },
  { kana: "いつつ", writing: "5つ", meaning: "năm cái" },
  { kana: "むっつ", writing: "6つ", meaning: "sáu cái" },
  { kana: "ななつ", writing: "7つ", meaning: "bảy cái" },
  { kana: "やっつ", writing: "8つ", meaning: "tám cái" },
  { kana: "ここのつ", writing: "9つ", meaning: "chín cái" },
  { kana: "とお", writing: "10", meaning: "mười cái" },
  { kana: "いくつ", writing: "", meaning: "mấy cái, bao nhiêu cái" },
  { kana: "ひとり", writing: "1人", meaning: "một người" },
  { kana: "ふたり", writing: "2人", meaning: "hai người" },
  { kana: "~にん", writing: "~人", meaning: "~ người" },
  { kana: "~だい", writing: "~台", meaning: "~ cái, chiếc", note: "Dùng để đếm máy móc, xe cộ, v.v." },
  { kana: "~まい", writing: "~枚", meaning: "~ tờ, tấm", note: "Dùng để đếm những vật mỏng như tờ giấy, con tem, v.v." },
  { kana: "~かい", writing: "~回", meaning: "~ lần" },
  { kana: "りんご", writing: "", meaning: "táo" },
  { kana: "みかん", writing: "", meaning: "quýt" },
  { kana: "サンドイッチ", writing: "", meaning: "bánh san-uých" },
  { kana: "カレーライス", writing: "", meaning: "món cơm cà-ri" },
  { kana: "アイスクリーム", writing: "", meaning: "kem" },
  { kana: "きって", writing: "切手", meaning: "tem" },
  { kana: "はがき", writing: "", meaning: "bưu thiếp" },
  { kana: "ふうとう", writing: "封筒", meaning: "phong bì" },
  { kana: "りょうしん", writing: "両親", meaning: "bố mẹ" },
  { kana: "きょうだい", writing: "兄弟", meaning: "anh chị em" },
  { kana: "あに", writing: "兄", meaning: "anh trai", note: "Anh trai của mình." },
  { kana: "おにいさん", writing: "お兄さん", meaning: "anh trai", note: "Anh trai của người khác." },
  { kana: "あね", writing: "姉", meaning: "chị gái", note: "Chị gái của mình." },
  { kana: "おねえさん", writing: "お姉さん", meaning: "chị gái", note: "Chị gái của người khác." },
  { kana: "おとうと", writing: "弟", meaning: "em trai", note: "Em trai của mình." },
  { kana: "おとうとさん", writing: "弟さん", meaning: "em trai", note: "Em trai của người khác." },
  { kana: "いもうと", writing: "妹", meaning: "em gái", note: "Em gái của mình." },
  { kana: "いもうとさん", writing: "妹さん", meaning: "em gái", note: "Em gái của người khác." },
  { kana: "がいこく", writing: "外国", meaning: "nước ngoài" },
  { kana: "りゅうがくせい", writing: "留学生", meaning: "lưu học sinh, sinh viên người nước ngoài" },
  { kana: "クラス", writing: "", meaning: "lớp" },
  { kana: "~じかん", writing: "~時間", meaning: "~ tiếng" },
  { kana: "~しゅうかん", writing: "~週間", meaning: "~ tuần" },
  { kana: "~かげつ", writing: "~か月", meaning: "~ tháng" },
  { kana: "~ねん", writing: "~年", meaning: "~ năm" },
  { kana: "~ぐらい", writing: "", meaning: "khoảng ~" },
  { kana: "どのくらい", writing: "", meaning: "bao lâu" },
  { kana: "ぜんぶで", writing: "全部で", meaning: "tổng cộng" },
  { kana: "みんな", writing: "", meaning: "tất cả" },
  { kana: "~だけ", writing: "", meaning: "chỉ ~" },
  { kana: "かしこまりました。", writing: "", meaning: "tôi đã rõ ạ", note: "Cách nói lịch sự với ông/bà." },
  { kana: "いい天気ですね。", writing: "いいてんきですね。", meaning: "trời đẹp nhỉ" },
  { kana: "お出かけですか。", writing: "おでかけですか。", meaning: "anh/chị đi ra ngoài đấy à?" },
  { kana: "ちょっと~まで。", writing: "", meaning: "tôi đi ~ một chút" },
  { kana: "行っていらっしゃい。", writing: "いっていらっしゃい。", meaning: "anh/chị đi nhé", note: "Nghĩa đen: anh/chị đi rồi lại về nhé." },
  { kana: "行ってきます。", writing: "いってきます。", meaning: "tôi đi đây", note: "Nghĩa đen: tôi đi rồi sẽ về." },
  { kana: "船便", writing: "ふなびん", meaning: "gửi bằng đường biển" },
  { kana: "航空便/エアメール", writing: "こうくうびん/エアメール", meaning: "gửi bằng đường hàng không" },
  { kana: "お願いします。", writing: "おねがいします。", meaning: "nhờ anh/chị" },
  { kana: "オーストラリア", writing: "", meaning: "Úc" },
];

const n5VocabularyLessonTwelve = [
  { kana: "かんたんな", writing: "簡単な", meaning: "đơn giản, dễ" },
  { kana: "ちかい", writing: "近い", meaning: "gần" },
  { kana: "とおい", writing: "遠い", meaning: "xa" },
  { kana: "はやい", writing: "速い/早い", meaning: "nhanh, sớm" },
  { kana: "おそい", writing: "遅い", meaning: "chậm, muộn" },
  { kana: "おおい", writing: "多い", meaning: "nhiều", note: "Dùng cho người, vật." },
  { kana: "すくない", writing: "少ない", meaning: "ít", note: "Dùng cho người, vật." },
  { kana: "あたたかい", writing: "暖かい", meaning: "ấm" },
  { kana: "すずしい", writing: "涼しい", meaning: "mát" },
  { kana: "あまい", writing: "甘い", meaning: "ngọt" },
  { kana: "からい", writing: "辛い", meaning: "cay" },
  { kana: "おもい", writing: "重い", meaning: "nặng" },
  { kana: "かるい", writing: "軽い", meaning: "nhẹ" },
  { kana: "いい", writing: "", meaning: "thích, chọn, dùng", note: "Ví dụ: コーヒーがいい." },
  { kana: "きせつ", writing: "季節", meaning: "mùa" },
  { kana: "はる", writing: "春", meaning: "mùa xuân" },
  { kana: "なつ", writing: "夏", meaning: "mùa hè" },
  { kana: "あき", writing: "秋", meaning: "mùa thu" },
  { kana: "ふゆ", writing: "冬", meaning: "mùa đông" },
  { kana: "てんき", writing: "天気", meaning: "thời tiết" },
  { kana: "あめ", writing: "雨", meaning: "mưa" },
  { kana: "ゆき", writing: "雪", meaning: "tuyết" },
  { kana: "くもり", writing: "曇り", meaning: "có mây" },
  { kana: "ホテル", writing: "", meaning: "khách sạn" },
  { kana: "くうこう", writing: "空港", meaning: "sân bay" },
  { kana: "うみ", writing: "海", meaning: "biển, đại dương" },
  { kana: "せかい", writing: "世界", meaning: "thế giới" },
  { kana: "パーティー", writing: "", meaning: "tiệc", note: "パーティーをします: tổ chức tiệc, mở tiệc." },
  { kana: "おまつり", writing: "お祭り", meaning: "lễ hội" },
  { kana: "すきやき", writing: "すき焼き", meaning: "Sukiyaki", note: "Món lẩu thịt bò, rau." },
  { kana: "さしみ", writing: "刺身", meaning: "Sashimi", note: "Món gỏi cá sống." },
  { kana: "おすし", writing: "おすし", meaning: "Sushi", note: "Món cơm trộn giấm có cá tươi ở trên." },
  { kana: "てんぷら", writing: "", meaning: "Tempura", note: "Món hải sản và rau chiên tẩm bột." },
  { kana: "ぶたにく", writing: "豚肉", meaning: "thịt heo, thịt lợn" },
  { kana: "とりにく", writing: "とり肉", meaning: "thịt gà" },
  { kana: "ぎゅうにく", writing: "牛肉", meaning: "thịt bò" },
  { kana: "レモン", writing: "", meaning: "chanh" },
  { kana: "いけばな", writing: "生け花", meaning: "nghệ thuật cắm hoa", note: "いけばなをします: cắm hoa." },
  { kana: "もみじ", writing: "紅葉", meaning: "cây lá đỏ, lá đỏ" },
  { kana: "どちら", writing: "", meaning: "cái nào", note: "Trong hai cái." },
  { kana: "どちらも", writing: "", meaning: "cả hai" },
  { kana: "いちばん", writing: "", meaning: "nhất" },
  { kana: "ずっと", writing: "", meaning: "hơn hẳn, suốt" },
  { kana: "はじめて", writing: "初めて", meaning: "lần đầu tiên" },
  { kana: "ただいま。", writing: "", meaning: "tôi đã về", note: "Dùng để nói khi về đến nhà." },
  { kana: "お帰りなさい。", writing: "おかえりなさい。", meaning: "anh/chị đã về à", note: "Dùng để nói với ai đó mới về nhà." },
  { kana: "わあ、すごい人ですね。", writing: "わあ、すごいひとですね。", meaning: "ôi, người đông quá nhỉ" },
  { kana: "疲れました。", writing: "つかれました。", meaning: "tôi mệt rồi" },
  { kana: "祇園祭", writing: "ぎおんまつり", meaning: "Lễ hội Gion", note: "Lễ hội nổi tiếng nhất ở Kyoto." },
  { kana: "ホンコン", writing: "香港", meaning: "Hồng Kông" },
  { kana: "シンガポール", writing: "", meaning: "Singapore" },
  { kana: "ABCストア", writing: "", meaning: "tên siêu thị giả định" },
  { kana: "ジャパン", writing: "", meaning: "tên siêu thị giả định" },
];

const n5VocabularyLessonThirteen = [
  { kana: "あそびます", writing: "遊びます", meaning: "chơi" },
  { kana: "およぎます", writing: "泳ぎます", meaning: "bơi" },
  { kana: "むかえます", writing: "迎えます", meaning: "đón" },
  { kana: "つかれます", writing: "疲れます", meaning: "mệt", note: "Khi nói trạng thái đã mệt rồi thì dùng つかれました." },
  { kana: "けっこんします", writing: "結婚します", meaning: "kết hôn, lập gia đình, cưới" },
  { kana: "かいものします", writing: "買い物します", meaning: "mua sắm, mua hàng" },
  { kana: "しょくじします", writing: "食事します", meaning: "ăn cơm, dùng bữa" },
  { kana: "さんぽします", writing: "散歩します", meaning: "đi dạo", note: "こうえんを~: đi dạo ở công viên." },
  { kana: "たいへんな", writing: "大変な", meaning: "vất vả, khó khăn, khổ" },
  { kana: "ほしい", writing: "欲しい", meaning: "muốn có" },
  { kana: "ひろい", writing: "広い", meaning: "rộng" },
  { kana: "せまい", writing: "狭い", meaning: "chật, hẹp" },
  { kana: "プール", writing: "", meaning: "bể bơi" },
  { kana: "かわ", writing: "川", meaning: "sông" },
  { kana: "びじゅつ", writing: "美術", meaning: "mỹ thuật" },
  { kana: "つり", writing: "釣り", meaning: "việc câu cá", note: "つりをします: câu cá." },
  { kana: "スキー", writing: "", meaning: "việc trượt tuyết", note: "スキーをします: trượt tuyết." },
  { kana: "しゅうまつ", writing: "週末", meaning: "cuối tuần" },
  { kana: "おしょうがつ", writing: "お正月", meaning: "Tết" },
  { kana: "~ごろ", writing: "", meaning: "khoảng ~", note: "Dùng cho thời gian." },
  { kana: "なにか", writing: "何か", meaning: "cái gì đó" },
  { kana: "どこか", writing: "", meaning: "đâu đó, chỗ nào đó" },
  { kana: "のどがかわきます", writing: "のどが渇きます", meaning: "khát", note: "Khi nói trạng thái đang khát thì dùng のどがかわきました." },
  { kana: "おなかがすきます", writing: "", meaning: "đói", note: "Khi nói trạng thái đang đói thì dùng おなかがすきました." },
  { kana: "そうしましょう。", writing: "", meaning: "nhất trí; hãy làm vậy đi", note: "Nói khi đồng ý với đề xuất của ai." },
  { kana: "ご注文は?", writing: "ごちゅうもんは?", meaning: "anh/chị dùng món gì ạ?" },
  { kana: "定食", writing: "ていしょく", meaning: "cơm suất, cơm phần" },
  { kana: "牛どん", writing: "ぎゅうどん", meaning: "món cơm với thịt bò ở trên" },
  { kana: "少々お待ちください。", writing: "しょうしょうおまちください。", meaning: "xin anh/chị vui lòng đợi một chút" },
  { kana: "別々に", writing: "べつべつに", meaning: "riêng, riêng ra" },
  { kana: "アックス", writing: "", meaning: "tên công ty giả định" },
  { kana: "おはようテレビ", writing: "", meaning: "tên chương trình truyền hình giả định" },
];

const n5VocabularyLessonFourteen = [
  { kana: "つけます", writing: "", meaning: "bật" },
  { kana: "けします", writing: "消します", meaning: "tắt" },
  { kana: "あけます", writing: "開けます", meaning: "mở" },
  { kana: "しめます", writing: "閉めます", meaning: "đóng", note: "Dùng với cửa, cửa sổ." },
  { kana: "いそぎます", writing: "急ぎます", meaning: "vội, gấp" },
  { kana: "まちます", writing: "待ちます", meaning: "đợi, chờ" },
  { kana: "もちます", writing: "持ちます", meaning: "mang, cầm" },
  { kana: "とります", writing: "取ります", meaning: "lấy, chuyển" },
  { kana: "てつだいます", writing: "手伝います", meaning: "giúp", note: "Giúp làm việc gì." },
  { kana: "よびます", writing: "呼びます", meaning: "gọi" },
  { kana: "はなします", writing: "話します", meaning: "nói, nói chuyện" },
  { kana: "つかいます", writing: "使います", meaning: "dùng, sử dụng" },
  { kana: "とめます", writing: "止めます", meaning: "dừng, đỗ" },
  { kana: "みせます", writing: "見せます", meaning: "cho xem, trình" },
  { kana: "おしえます", writing: "教えます", meaning: "nói cho biết", note: "Dùng với địa chỉ." },
  { kana: "すわります", writing: "座ります", meaning: "ngồi" },
  { kana: "たちます", writing: "立ちます", meaning: "đứng" },
  { kana: "はいります", writing: "入ります", meaning: "vào", note: "きっさてんに~: vào quán giải khát." },
  { kana: "でます", writing: "出ます", meaning: "ra, khỏi", note: "きっさてんを~: ra khỏi quán giải khát." },
  { kana: "ふります", writing: "降ります", meaning: "mưa", note: "あめが~: mưa." },
  { kana: "コピーします", writing: "", meaning: "copy, phô-tô" },
  { kana: "でんき", writing: "電気", meaning: "điện, đèn điện" },
  { kana: "エアコン", writing: "", meaning: "máy điều hòa nhiệt độ" },
  { kana: "パスポート", writing: "", meaning: "hộ chiếu" },
  { kana: "なまえ", writing: "名前", meaning: "tên" },
  { kana: "じゅうしょ", writing: "住所", meaning: "địa chỉ" },
  { kana: "ちず", writing: "地図", meaning: "bản đồ" },
  { kana: "しお", writing: "塩", meaning: "muối" },
  { kana: "さとう", writing: "砂糖", meaning: "đường" },
  { kana: "もんだい", writing: "問題", meaning: "câu hỏi, vấn đề" },
  { kana: "こたえ", writing: "答え", meaning: "câu trả lời" },
  { kana: "よみかた", writing: "読み方", meaning: "cách đọc" },
  { kana: "~かた", writing: "~方", meaning: "cách ~" },
  { kana: "まっすぐ", writing: "", meaning: "thẳng" },
  { kana: "ゆっくり", writing: "", meaning: "chậm, thong thả, thoải mái" },
  { kana: "すぐ", writing: "", meaning: "ngay, lập tức" },
  { kana: "また", writing: "", meaning: "lại" },
  { kana: "あとで", writing: "", meaning: "sau" },
  { kana: "もうすこし", writing: "もう少し", meaning: "thêm một chút nữa" },
  { kana: "もう~", writing: "", meaning: "thêm ~" },
  { kana: "さあ", writing: "", meaning: "thôi nào", note: "Dùng để thúc giục hoặc khuyến khích ai đó làm gì." },
  { kana: "あれ?", writing: "", meaning: "ôi?", note: "Câu cảm thán khi phát hiện hoặc thấy điều lạ, hoặc bất ngờ." },
  { kana: "信号を右へ曲がってください。", writing: "しんごうをみぎへまがってください。", meaning: "anh/chị hãy rẽ phải ở chỗ đèn tín hiệu." },
  { kana: "これでお願いします。", writing: "", meaning: "gửi anh tiền này" },
  { kana: "お釣り", writing: "おつり", meaning: "tiền thừa, tiền đổi lại" },
  { kana: "みどり町", writing: "みどりちょう", meaning: "tên thành phố giả định" },
];

const n5VocabularyLessonFifteen = [
  { kana: "おきます", writing: "置きます", meaning: "đặt, để" },
  { kana: "つくります", writing: "作ります/造ります", meaning: "làm, chế tạo, sản xuất" },
  { kana: "うります", writing: "売ります", meaning: "bán" },
  { kana: "しります", writing: "知ります", meaning: "biết" },
  { kana: "すみます", writing: "住みます", meaning: "sống, ở" },
  { kana: "けんきゅうします", writing: "研究します", meaning: "nghiên cứu" },
  { kana: "しりょう", writing: "資料", meaning: "tài liệu, tư liệu" },
  { kana: "カタログ", writing: "", meaning: "ca-ta-lô" },
  { kana: "じこくひょう", writing: "時刻表", meaning: "bảng giờ chạy tàu" },
  { kana: "ふく", writing: "服", meaning: "quần áo" },
  { kana: "せいひん", writing: "製品", meaning: "sản phẩm" },
  { kana: "ソフト", writing: "", meaning: "phần mềm" },
  { kana: "でんしじしょ", writing: "電子辞書", meaning: "kim từ điển" },
  { kana: "けいざい", writing: "経済", meaning: "kinh tế" },
  { kana: "しゃくしょ", writing: "市役所", meaning: "tòa thị chính" },
  { kana: "こうこう", writing: "高校", meaning: "trường trung học phổ thông, trường cấp 3" },
  { kana: "はいしゃ", writing: "歯医者", meaning: "nha sĩ" },
  { kana: "どくしん", writing: "独身", meaning: "độc thân" },
  { kana: "すみません", writing: "", meaning: "xin lỗi" },
  { kana: "皆さん", writing: "みなさん", meaning: "các anh chị, các ông bà, các bạn, quý vị" },
  { kana: "思い出します", writing: "おもいだします", meaning: "nhớ lại, hồi tưởng lại" },
  { kana: "いらっしゃいます", writing: "", meaning: "kính ngữ của います" },
  { kana: "日本橋", writing: "にほんばし", meaning: "tên khu phố mua sắm ở Osaka" },
  { kana: "みんなのインタビュー", writing: "", meaning: "tên chương trình truyền hình giả định" },
];

const n5VocabularyLessonSixteen = [
  { kana: "のります", writing: "乗ります", meaning: "đi, lên", note: "電車に~: lên tàu." },
  { kana: "おります", writing: "降ります", meaning: "xuống", note: "電車を~: xuống tàu." },
  { kana: "のりかえます", writing: "乗り換えます", meaning: "chuyển, đổi", note: "電車を~: đổi tàu." },
  { kana: "あびます", writing: "浴びます", meaning: "tắm", note: "シャワーを~: tắm vòi hoa sen." },
  { kana: "いれます", writing: "入れます", meaning: "cho vào, bỏ vào" },
  { kana: "だします", writing: "出します", meaning: "lấy ra, đưa ra, gửi", note: "手紙を~: gửi thư." },
  { kana: "おします", writing: "下ろします", meaning: "rút", note: "お金を~: rút tiền." },
  { kana: "はいります", writing: "入ります", meaning: "vào", note: "大学に~: vào đại học." },
  { kana: "でます", writing: "出ます", meaning: "ra, tốt nghiệp", note: "大学を~: tốt nghiệp đại học." },
  { kana: "やめます", writing: "", meaning: "bỏ, dừng" },
  { kana: "のみます", writing: "飲みます", meaning: "uống", note: "ビールを~: uống bia/rượu." },
  { kana: "はじめます", writing: "始めます", meaning: "bắt đầu" },
  { kana: "けんがくします", writing: "見学します", meaning: "tham quan kiến tập" },
  { kana: "でんわします", writing: "電話します", meaning: "gọi điện thoại" },
  { kana: "わかい", writing: "若い", meaning: "trẻ" },
  { kana: "ながい", writing: "長い", meaning: "dài" },
  { kana: "みじかい", writing: "短い", meaning: "ngắn" },
  { kana: "あかるい", writing: "明るい", meaning: "sáng" },
  { kana: "くらい", writing: "暗い", meaning: "tối" },
  { kana: "からだ", writing: "体", meaning: "người, cơ thể" },
  { kana: "あたま", writing: "頭", meaning: "đầu" },
  { kana: "かみ", writing: "髪", meaning: "tóc" },
  { kana: "かお", writing: "顔", meaning: "mặt" },
  { kana: "め", writing: "目", meaning: "mắt" },
  { kana: "みみ", writing: "耳", meaning: "tai" },
  { kana: "はな", writing: "鼻", meaning: "mũi" },
  { kana: "くち", writing: "口", meaning: "miệng" },
  { kana: "は", writing: "歯", meaning: "răng" },
  { kana: "おなか", writing: "", meaning: "bụng" },
  { kana: "あし", writing: "足", meaning: "chân" },
  { kana: "せ", writing: "背", meaning: "chiều cao cơ thể" },
  { kana: "サービス", writing: "", meaning: "dịch vụ" },
  { kana: "ジョギング", writing: "", meaning: "việc chạy bộ", note: "ジョギングをします: chạy bộ." },
  { kana: "シャワー", writing: "", meaning: "vòi hoa sen" },
  { kana: "みどり", writing: "緑", meaning: "màu xanh lá cây, xanh" },
  { kana: "おてら", writing: "お寺", meaning: "chùa" },
  { kana: "じんじゃ", writing: "神社", meaning: "đền thờ đạo Thần" },
  { kana: "~ばん", writing: "~番", meaning: "số ~" },
  { kana: "どうやって", writing: "", meaning: "làm thế nào ~" },
  { kana: "どの~", writing: "", meaning: "~ nào", note: "Dùng với trường hợp từ ba thứ trở lên." },
  { kana: "どれ", writing: "", meaning: "cái nào", note: "Dùng trong trường hợp ba cái hoặc nhiều hơn." },
  { kana: "すごいですね。", writing: "", meaning: "thật tuyệt vời, kinh quá nhỉ" },
  { kana: "いいえ、まだまだです。", writing: "", meaning: "không, tôi còn phải cố gắng nhiều lắm", note: "Cách nói khiêm nhường khi được ai khen." },
  { kana: "お引き出しですか。", writing: "おひきだしですか。", meaning: "anh/chị rút tiền ạ?" },
  { kana: "まず", writing: "", meaning: "trước hết, đầu tiên" },
  { kana: "つぎに", writing: "次に", meaning: "tiếp theo, sau đó" },
  { kana: "キャッシュカード", writing: "", meaning: "thẻ rút tiền mặt, thẻ ATM" },
  { kana: "暗証番号", writing: "あんしょうばんごう", meaning: "mã số bí mật, mật khẩu" },
  { kana: "金額", writing: "きんがく", meaning: "số tiền, khoản tiền" },
  { kana: "確認", writing: "かくにん", meaning: "sự xác nhận, sự kiểm tra lại", note: "かくにんします: xác nhận." },
  { kana: "ボタン", writing: "", meaning: "nút" },
  { kana: "JR", writing: "", meaning: "Công ty Đường sắt Nhật Bản" },
  { kana: "雪祭り", writing: "ゆきまつり", meaning: "Lễ hội tuyết" },
  { kana: "バンドン", writing: "", meaning: "Bandung", note: "Ở In-đô-nê-xi-a." },
  { kana: "フランク", writing: "", meaning: "Frank", note: "Ở Đức." },
  { kana: "ベラクルス", writing: "", meaning: "Veracruz", note: "Ở Mexico." },
  { kana: "梅田", writing: "うめだ", meaning: "tên một quận ở Osaka" },
  { kana: "大学前", writing: "だいがくまえ", meaning: "tên điểm dừng xe buýt giả định" },
];

const n5VocabularyLessonSeventeen = [
  { kana: "おぼえます", writing: "覚えます", meaning: "nhớ" },
  { kana: "わすれます", writing: "忘れます", meaning: "quên" },
  { kana: "なくします", writing: "", meaning: "làm mất, đánh mất" },
  { kana: "はらいます", writing: "払います", meaning: "trả tiền" },
  { kana: "かえします", writing: "返します", meaning: "trả lại" },
  { kana: "でかけます", writing: "出かけます", meaning: "ra ngoài" },
  { kana: "ぬぎます", writing: "脱ぎます", meaning: "cởi", note: "Cởi áo, giày, v.v." },
  { kana: "もっていきます", writing: "持って行きます", meaning: "mang đi, mang theo" },
  { kana: "もってきます", writing: "持って来ます", meaning: "mang đến" },
  { kana: "しんぱいします", writing: "心配します", meaning: "lo lắng" },
  { kana: "ざんぎょうします", writing: "残業します", meaning: "làm thêm giờ" },
  { kana: "しゅっちょうします", writing: "出張します", meaning: "đi công tác" },
  { kana: "のみます", writing: "飲みます", meaning: "uống", note: "くすりを~: uống thuốc." },
  { kana: "はいります", writing: "入ります", meaning: "tắm bồn", note: "おふろに~: tắm bồn." },
  { kana: "たいせつな", writing: "大切な", meaning: "quan trọng, quý giá" },
  { kana: "だいじょうぶな", writing: "大丈夫な", meaning: "không sao, không có vấn đề gì" },
  { kana: "あぶない", writing: "危ない", meaning: "nguy hiểm" },
  { kana: "きんえん", writing: "禁煙", meaning: "cấm hút thuốc" },
  { kana: "けんこうほけんしょう", writing: "健康保険証", meaning: "thẻ bảo hiểm y tế" },
  { kana: "ねつ", writing: "熱", meaning: "sốt" },
  { kana: "びょうき", writing: "病気", meaning: "ốm, bệnh" },
  { kana: "くすり", writing: "薬", meaning: "thuốc" },
  { kana: "おふろ", writing: "", meaning: "bồn tắm" },
  { kana: "うわぎ", writing: "上着", meaning: "áo khoác" },
  { kana: "したぎ", writing: "下着", meaning: "quần áo lót" },
  { kana: "2、3にち", writing: "2、3日", meaning: "2, 3 ngày" },
  { kana: "2、3~", writing: "", meaning: "2, 3 ~", note: "~ là hậu tố đếm." },
  { kana: "~までに", writing: "", meaning: "trước ~, cho đến trước ~", note: "Chỉ giới hạn thời gian." },
  { kana: "ですから", writing: "", meaning: "vì thế, vì vậy, do đó" },
  { kana: "どうしましたか。", writing: "", meaning: "có vấn đề gì? Anh/chị bị làm sao?", note: "Cách bác sĩ hỏi bệnh nhân." },
  { kana: "のど", writing: "", meaning: "họng" },
  { kana: "~が痛いです。", writing: "~がいたいです。", meaning: "tôi đau ~" },
  { kana: "かぜ", writing: "", meaning: "cảm, cảm cúm" },
  { kana: "それから", writing: "", meaning: "và, sau đó" },
  { kana: "お大事に。", writing: "おだいじに。", meaning: "anh/chị nhớ giữ gìn sức khỏe", note: "Câu nói với người ốm hoặc bị bệnh." },
];

const n5VocabularyLessonEighteen = [
  { kana: "できます", writing: "", meaning: "có thể" },
  { kana: "あらいます", writing: "洗います", meaning: "rửa" },
  { kana: "ひきます", writing: "弾きます", meaning: "chơi", note: "Chơi nhạc cụ, piano, v.v." },
  { kana: "うたいます", writing: "歌います", meaning: "hát" },
  { kana: "あつめます", writing: "集めます", meaning: "sưu tầm, thu thập, tập hợp" },
  { kana: "すてます", writing: "捨てます", meaning: "vứt, bỏ, bỏ đi" },
  { kana: "かえます", writing: "換えます", meaning: "đổi, trao đổi" },
  { kana: "うんてんします", writing: "運転します", meaning: "lái" },
  { kana: "よやくします", writing: "予約します", meaning: "đặt chỗ, đặt trước" },
  { kana: "ピアノ", writing: "", meaning: "đàn piano" },
  { kana: "~メートル", writing: "", meaning: "~ mét" },
  { kana: "げんきん", writing: "現金", meaning: "tiền mặt" },
  { kana: "しゅみ", writing: "趣味", meaning: "sở thích, thú vui" },
  { kana: "にっき", writing: "日記", meaning: "nhật ký" },
  { kana: "おいのり", writing: "お祈り", meaning: "việc cầu nguyện", note: "おいのりをします: cầu nguyện." },
  { kana: "かちょう", writing: "課長", meaning: "tổ trưởng" },
  { kana: "ぶちょう", writing: "部長", meaning: "trưởng phòng" },
  { kana: "しゃちょう", writing: "社長", meaning: "giám đốc" },
  { kana: "どうぶつ", writing: "動物", meaning: "động vật" },
  { kana: "うま", writing: "馬", meaning: "ngựa" },
  { kana: "インターネット", writing: "", meaning: "In-tơ-nét, Internet" },
  { kana: "とくに", writing: "特に", meaning: "đặc biệt là" },
  { kana: "へえ", writing: "", meaning: "thế à", note: "Dùng để biểu thị sự ngạc nhiên." },
  { kana: "それはおもしろいですね。", writing: "", meaning: "điều ấy hay thật nhỉ" },
  { kana: "なかなか", writing: "", meaning: "khó mà, mãi mà", note: "Dùng với thể phủ định." },
  { kana: "ほんとうですか。", writing: "本当ですか。", meaning: "thật không?" },
  { kana: "ぜひ", writing: "", meaning: "nhất định" },
  { kana: "故郷", writing: "ふるさと", meaning: "Furusato", note: "Tên một bài hát có nghĩa là quê nhà." },
  { kana: "ビートルズ", writing: "", meaning: "Beatles", note: "Tên bạn nhạc nổi tiếng nước Anh." },
  { kana: "秋葉原", writing: "あきはばら", meaning: "một quận ở Tokyo" },
];

const n5VocabularyLessonNineteen = [
  { kana: "のぼります", writing: "登ります/上ります", meaning: "leo, lên", note: "山に~: leo núi." },
  { kana: "とまります", writing: "泊まります", meaning: "trọ", note: "ホテルに~: trọ ở khách sạn." },
  { kana: "そうじします", writing: "掃除します", meaning: "dọn vệ sinh", note: "へやを~: dọn vệ sinh phòng." },
  { kana: "せんたくします", writing: "洗濯します", meaning: "giặt", note: "Giặt quần áo." },
  { kana: "なります", writing: "", meaning: "trở thành, trở nên" },
  { kana: "ねむい", writing: "眠い", meaning: "buồn ngủ" },
  { kana: "つよい", writing: "強い", meaning: "mạnh" },
  { kana: "よわい", writing: "弱い", meaning: "yếu" },
  { kana: "れんしゅう", writing: "練習", meaning: "sự luyện tập", note: "れんしゅうをします: luyện tập." },
  { kana: "ゴルフ", writing: "", meaning: "gôn", note: "ゴルフをします: chơi gôn." },
  { kana: "すもう", writing: "相撲", meaning: "môn vật Sumo", note: "すもうをします: đấu vật Sumo." },
  { kana: "おちゃ", writing: "お茶", meaning: "trà đạo" },
  { kana: "ひ", writing: "日", meaning: "ngày" },
  { kana: "ちょうし", writing: "調子", meaning: "tình trạng, trạng thái" },
  { kana: "いちど", writing: "一度", meaning: "một lần" },
  { kana: "いちども", writing: "一度も", meaning: "chưa lần nào, chưa bao giờ", note: "Dùng với thể phủ định." },
  { kana: "だんだん", writing: "", meaning: "dần dần" },
  { kana: "もうすぐ", writing: "", meaning: "sắp, sắp sửa" },
  { kana: "おかげさまで", writing: "", meaning: "cảm ơn anh/chị, nhờ anh/chị mà ~", note: "Dùng để bày tỏ sự cảm ơn khi nhận được sự giúp đỡ của ai đó." },
  { kana: "でも", writing: "", meaning: "nhưng" },
  { kana: "乾杯", writing: "かんぱい", meaning: "cạn chén, nâng cốc" },
  { kana: "ダイエット", writing: "", meaning: "việc ăn kiêng, chế độ giảm cân", note: "ダイエットをします: ăn kiêng." },
  { kana: "無理な", writing: "むりな", meaning: "không thể, quá sức" },
  { kana: "体にいい", writing: "からだにいい", meaning: "tốt cho sức khỏe" },
  { kana: "東京スカイツリー", writing: "とうきょうスカイツリー", meaning: "Tokyo Sky Tree", note: "Tháp truyền hình có đài ngắm cảnh ở Tokyo." },
  { kana: "浮世絵", writing: "うきよえ", meaning: "một họa sĩ nổi tiếng thời Edo", note: "1760-1849." },
];

const n5VocabularyLessonTwenty = [
  { kana: "いります", writing: "要ります", meaning: "cần", note: "ビザが~: cần thị thực/visa." },
  { kana: "しらべます", writing: "調べます", meaning: "tìm hiểu, kiểm tra, điều tra" },
  { kana: "しゅうりします", writing: "修理します", meaning: "sửa chữa, tu sửa" },
  { kana: "ぼく", writing: "僕", meaning: "tôi, tớ", note: "Cách xưng thân mật của わたし được dùng bởi nam giới." },
  { kana: "きみ", writing: "君", meaning: "cậu, bạn", note: "Cách nói thân mật của あなた được dùng cho người ngang hàng hoặc tuổi nhỏ hơn; thường được dùng sau tên bé trai." },
  { kana: "~くん", writing: "~君", meaning: "anh ~, cậu ~", note: "Cách nói thân mật của ~さん, được dùng cho người ngang hoặc ít tuổi hơn; thường được dùng sau tên bé trai." },
  { kana: "うん", writing: "", meaning: "ừ", note: "Cách nói thân mật của はい." },
  { kana: "ううん", writing: "", meaning: "không", note: "Cách nói thân mật của いいえ." },
  { kana: "ことば", writing: "言葉", meaning: "từ, tiếng" },
  { kana: "きもの", writing: "着物", meaning: "kimono", note: "Trang phục truyền thống của Nhật Bản." },
  { kana: "ビザ", writing: "", meaning: "thị thực, visa" },
  { kana: "はじめ", writing: "初め", meaning: "bạn đầu, đầu tiên" },
  { kana: "おわり", writing: "終わり", meaning: "kết thúc, hết phim" },
  { kana: "こっち", writing: "", meaning: "phía này, chỗ này", note: "Cách nói thân mật của こちら." },
  { kana: "そっち", writing: "", meaning: "phía đó, chỗ đó", note: "Cách nói thân mật của そちら." },
  { kana: "あっち", writing: "", meaning: "phía kia, chỗ kia", note: "Cách nói thân mật của あちら." },
  { kana: "どっち", writing: "", meaning: "cái nào, phía nào, đâu", note: "Cách nói thân mật của どちら." },
  { kana: "みんなで", writing: "", meaning: "mọi người cùng" },
  { kana: "~けど", writing: "", meaning: "~ nhưng", note: "Cách nói thân mật của が." },
  { kana: "おなかがいっぱいです", writing: "", meaning: "tôi no rồi" },
  { kana: "よかったら", writing: "", meaning: "nếu anh/chị thích thì" },
  { kana: "いろいろ", writing: "", meaning: "nhiều thứ" },
];

const n5VocabularyLessonTwentyOne = [
  { kana: "おもいます", writing: "思います", meaning: "nghĩ" },
  { kana: "いいます", writing: "言います", meaning: "nói" },
  { kana: "かちます", writing: "勝ちます", meaning: "thắng" },
  { kana: "まけます", writing: "負けます", meaning: "thua" },
  { kana: "あります", writing: "", meaning: "lễ hội được tổ chức, diễn ra" },
  { kana: "やくにたちます", writing: "役に立ちます", meaning: "hữu ích, giúp ích" },
  { kana: "うごきます", writing: "動きます", meaning: "chuyển động, chạy", note: "Dùng cho đồng hồ, công ty." },
  { kana: "きをつけます", writing: "気をつけます", meaning: "chú ý, bảo trọng", note: "会社に~: chú ý ở công ty." },
  { kana: "りゅうがくします", writing: "留学します", meaning: "du học" },
  { kana: "むだな", writing: "無駄な", meaning: "lãng phí, vô ích" },
  { kana: "ふべんな", writing: "不便な", meaning: "bất tiện" },
  { kana: "すごい", writing: "", meaning: "ghê quá, giỏi quá", note: "Dùng để bày tỏ sự ngạc nhiên hoặc thán phục." },
  { kana: "ほんとう", writing: "本当", meaning: "sự thật" },
  { kana: "うそ", writing: "", meaning: "sự giả dối, lời nói dối" },
  { kana: "じどうしゃ", writing: "自動車", meaning: "ô tô, xe hơi" },
  { kana: "こうつう", writing: "交通", meaning: "giao thông, đi lại" },
  { kana: "ぶっか", writing: "物価", meaning: "giá cả, mức giá, vật giá" },
  { kana: "ほうそう", writing: "放送", meaning: "phát, phát thanh" },
  { kana: "ニュース", writing: "", meaning: "tin tức, bản tin" },
  { kana: "アニメ", writing: "", meaning: "phim hoạt hình Nhật Bản" },
  { kana: "マンガ", writing: "", meaning: "truyện tranh" },
  { kana: "デザイン", writing: "", meaning: "thiết kế" },
  { kana: "ゆめ", writing: "夢", meaning: "giấc mơ" },
  { kana: "てんさい", writing: "天才", meaning: "thiên tài" },
  { kana: "しあい", writing: "試合", meaning: "trận đấu", note: "しあいをします: có trận đấu." },
  { kana: "いけん", writing: "意見", meaning: "ý kiến" },
  { kana: "はなし", writing: "話", meaning: "câu chuyện, nói chuyện", note: "はなしをします: nói chuyện." },
  { kana: "ちきゅう", writing: "地球", meaning: "trái đất" },
  { kana: "つき", writing: "月", meaning: "mặt trăng, trăng" },
  { kana: "さいきん", writing: "最近", meaning: "gần đây" },
  { kana: "たぶん", writing: "", meaning: "chắc, có thể" },
  { kana: "きっと", writing: "", meaning: "chắc chắn, nhất định" },
  { kana: "ほんとうに", writing: "本当に", meaning: "thật sự" },
  { kana: "そんなに", writing: "", meaning: "không ~ lắm" },
  { kana: "~について", writing: "", meaning: "về ~" },
  { kana: "久しぶりですね。", writing: "ひさしぶりですね。", meaning: "đã lâu không gặp anh/chị" },
  { kana: "~でも飲みませんか。", writing: "~でものみませんか。", meaning: "anh/chị uống ~ nhé?" },
  { kana: "もちろん", writing: "", meaning: "tất nhiên, dĩ nhiên" },
  { kana: "もう帰らないと...", writing: "もうかえらないと...", meaning: "tôi phải về bây giờ không thì..." },
  { kana: "アインシュタイン", writing: "", meaning: "Albert Einstein", note: "1879-1955." },
  { kana: "ガガーリン", writing: "", meaning: "Yuri Alekseyevich Gagarin", note: "1934-1968." },
  { kana: "ガリレオ", writing: "", meaning: "Galileo Galilei", note: "1564-1642." },
  { kana: "キング牧師", writing: "キングぼくし", meaning: "Mục sư Martin Luther King, Jr.", note: "1929-1968." },
  { kana: "フランクリン", writing: "", meaning: "Benjamin Franklin", note: "1706-1790." },
  { kana: "かぐや姫", writing: "かぐやひめ", meaning: "công chúa Kaguya", note: "Nhân vật trong truyện cổ dân gian Taketori Monogatari của Nhật Bản." },
  { kana: "天神祭", writing: "てんじんまつり", meaning: "Lễ hội Tenjin", note: "Một lễ hội ở Osaka." },
  { kana: "吉野山", writing: "よしのやま", meaning: "núi Yoshino", note: "Một ngọn núi ở tỉnh Nara." },
  { kana: "カンガルー", writing: "", meaning: "con căng-gu-ru" },
  { kana: "キャプテン・クック", writing: "", meaning: "Thuyền trưởng Cook", note: "James Cook, 1728-1779." },
  { kana: "ヨーネン", writing: "", meaning: "tên công ty giả định" },
];

const n5VocabularyLessonTwentyTwo = [
  { kana: "きます", writing: "着ます", meaning: "mặc", note: "Dùng với áo sơ mi, v.v." },
  { kana: "はきます", writing: "", meaning: "đi, mặc", note: "Dùng với giày, quần âu, v.v." },
  { kana: "かぶります", writing: "", meaning: "đội", note: "Dùng với mũ, v.v." },
  { kana: "かけます", writing: "", meaning: "đeo", note: "めがねを~: đeo kính." },
  { kana: "します", writing: "", meaning: "đeo", note: "ネクタイを~: đeo cà vạt." },
  { kana: "うまれます", writing: "生まれます", meaning: "sinh ra" },
  { kana: "わたしたち", writing: "", meaning: "chúng tôi, chúng ta" },
  { kana: "コート", writing: "", meaning: "áo khoác" },
  { kana: "セーター", writing: "", meaning: "áo len" },
  { kana: "スーツ", writing: "", meaning: "com-lê, vét" },
  { kana: "ぼうし", writing: "帽子", meaning: "mũ" },
  { kana: "めがね", writing: "眼鏡", meaning: "kính" },
  { kana: "ケーキ", writing: "", meaning: "bánh ngọt" },
  { kana: "おべんとう", writing: "お弁当", meaning: "cơm hộp" },
  { kana: "ロボット", writing: "", meaning: "rô bốt" },
  { kana: "ユーモア", writing: "", meaning: "sự hài hước" },
  { kana: "つごう", writing: "都合", meaning: "sự thích hợp" },
  { kana: "よく", writing: "", meaning: "thường, hay" },
  { kana: "えーと", writing: "", meaning: "ừ, à" },
  { kana: "おめでとうございます。", writing: "", meaning: "chúc mừng", note: "Dùng khi chúc mừng sinh nhật, lễ cưới, năm mới, v.v." },
  { kana: "お探しですか。", writing: "おさがしですか。", meaning: "anh/chị tìm ~ à?" },
  { kana: "では", writing: "", meaning: "thế/vậy nhé" },
  { kana: "こちら", writing: "", meaning: "đây, cái này", note: "Cách nói lịch sự của これ." },
  { kana: "家賃", writing: "やちん", meaning: "tiền thuê nhà" },
  { kana: "ダイニングキッチン", writing: "", meaning: "bếp kèm phòng ăn" },
  { kana: "和室", writing: "わしつ", meaning: "phòng kiểu Nhật" },
  { kana: "押し入れ", writing: "おしいれ", meaning: "chỗ để chăn gối, đệm trong một căn phòng kiểu Nhật" },
  { kana: "布団", writing: "ふとん", meaning: "chăn, đệm kiểu Nhật" },
  { kana: "パリ", writing: "", meaning: "Pa-ri" },
  { kana: "万里の長城", writing: "ばんりのちょうじょう", meaning: "Vạn Lý Trường Thành" },
  { kana: "みんなのアンケート", writing: "", meaning: "tiêu đề của bảng điều tra giả định" },
];

const n5VocabularyLessonTwentyThree = [
  { kana: "ききます", writing: "聞きます", meaning: "hỏi", note: "先生に~: hỏi giáo viên." },
  { kana: "まわします", writing: "回します", meaning: "vặn" },
  { kana: "ひきます", writing: "引きます", meaning: "kéo" },
  { kana: "かえます", writing: "変えます", meaning: "đổi" },
  { kana: "さわります", writing: "触ります", meaning: "sờ, chạm vào", note: "ドアに~: sờ/chạm vào cửa." },
  { kana: "でます", writing: "出ます", meaning: "tiền thừa ra, chạy ra", note: "おつりが~: tiền thừa ra." },
  { kana: "あるきます", writing: "歩きます", meaning: "đi bộ" },
  { kana: "わたります", writing: "渡ります", meaning: "qua, đi qua", note: "橋を~: qua cầu." },
  { kana: "まがります", writing: "曲がります", meaning: "rẽ, quẹo", note: "右へ~: rẽ phải." },
  { kana: "さびしい", writing: "寂しい", meaning: "buồn, cô đơn" },
  { kana: "おゆ", writing: "お湯", meaning: "nước nóng" },
  { kana: "おと", writing: "音", meaning: "âm thanh" },
  { kana: "サイズ", writing: "", meaning: "cỡ, kích cỡ" },
  { kana: "こしょう", writing: "故障", meaning: "sự hỏng, hỏng hóc", note: "こしょうします: bị hỏng." },
  { kana: "みち", writing: "道", meaning: "đường, đường sá" },
  { kana: "こうさてん", writing: "交差点", meaning: "ngã tư" },
  { kana: "しんごう", writing: "信号", meaning: "đèn tín hiệu" },
  { kana: "かど", writing: "角", meaning: "góc" },
  { kana: "はし", writing: "橋", meaning: "cầu" },
  { kana: "ちゅうしゃじょう", writing: "駐車場", meaning: "bãi đỗ xe" },
  { kana: "たてもの", writing: "建物", meaning: "tòa nhà" },
  { kana: "なんかいも", writing: "何回も", meaning: "nhiều lần" },
  { kana: "~め", writing: "~目", meaning: "thứ ~, số ~", note: "Biểu thị thứ tự." },
  { kana: "聖徳太子", writing: "しょうとくたいし", meaning: "Thái tử Shotoku", note: "574-622." },
  { kana: "法隆寺", writing: "ほうりゅうじ", meaning: "chùa Horyuji", note: "Một ngôi chùa ở Nara do Hoàng tử Shotoku xây vào đầu thế kỷ 7." },
  { kana: "元気茶", writing: "げんきちゃ", meaning: "tên trà giả định" },
  { kana: "本田駅", writing: "ほんだえき", meaning: "tên ga giả định" },
  { kana: "図書館前", writing: "としょかんまえ", meaning: "tên điểm dừng xe buýt giả định" },
];

const n5VocabularyLessonTwentyFour = [
  { kana: "くれます", writing: "", meaning: "cho, tặng", note: "Cho/tặng tôi." },
  { kana: "なおします", writing: "直します", meaning: "chữa, sửa" },
  { kana: "つれていきます", writing: "連れて行きます", meaning: "dẫn một ai đó đi" },
  { kana: "つれてきます", writing: "連れて来ます", meaning: "dẫn một ai đó đến" },
  { kana: "おくります", writing: "送ります", meaning: "tiễn một ai đó" },
  { kana: "しょうかいします", writing: "紹介します", meaning: "giới thiệu" },
  { kana: "あんないします", writing: "案内します", meaning: "hướng dẫn, giới thiệu, dẫn đường" },
  { kana: "せつめいします", writing: "説明します", meaning: "giải thích, trình bày" },
  { kana: "おじいさん/おじいちゃん", writing: "", meaning: "ông nội, ông ngoại, ông cụ/lão" },
  { kana: "おばあさん/おばあちゃん", writing: "", meaning: "bà nội, bà ngoại, bà cụ/lão" },
  { kana: "じゅんび", writing: "準備", meaning: "sự chuẩn bị", note: "じゅんびをします: chuẩn bị." },
  { kana: "ひっこし", writing: "引っ越し", meaning: "sự chuyển nhà", note: "ひっこしをします: chuyển nhà." },
  { kana: "おかし", writing: "お菓子", meaning: "bánh kẹo" },
  { kana: "ホームステイ", writing: "", meaning: "homestay" },
  { kana: "ぜんぶ", writing: "全部", meaning: "toàn bộ, tất cả" },
  { kana: "じぶんで", writing: "自分で", meaning: "tự mình" },
  { kana: "ほかに", writing: "", meaning: "ngoài ra, bên cạnh đó" },
  { kana: "母の日", writing: "ははのひ", meaning: "Ngày của Mẹ" },
];

const n5VocabularyLessonTwentyFive = [
  { kana: "かんがえます", writing: "考えます", meaning: "nghĩ, suy nghĩ" },
  { kana: "つきます", writing: "着きます", meaning: "đến" },
  { kana: "とります", writing: "取ります", meaning: "có, thêm", note: "年を~: thêm tuổi." },
  { kana: "たります", writing: "足ります", meaning: "đủ" },
  { kana: "いなか", writing: "田舎", meaning: "quê, nông thôn" },
  { kana: "チャンス", writing: "", meaning: "cơ hội" },
  { kana: "おく", writing: "億", meaning: "một trăm triệu" },
  { kana: "もし~たら", writing: "", meaning: "nếu" },
  { kana: "いみ", writing: "意味", meaning: "nghĩa, ý nghĩa" },
  { kana: "もしもし", writing: "", meaning: "a-lô" },
  { kana: "転勤", writing: "てんきん", meaning: "việc chuyển địa điểm làm việc", note: "てんきんします: chuyển địa điểm làm việc." },
  { kana: "こと", writing: "", meaning: "việc, chuyện", note: "ことば, việc chuyển v.v." },
  { kana: "暇", writing: "ひま", meaning: "thời gian rảnh" },
  { kana: "いろいろお世話になりました。", writing: "いろいろおせわになりました。", meaning: "cảm ơn anh/chị đã giúp đỡ tôi nhiều" },
  { kana: "頑張ります", writing: "がんばります", meaning: "cố, cố gắng" },
  { kana: "どうぞお元気で。", writing: "どうぞおげんきで。", meaning: "chúc anh/chị mạnh khỏe", note: "Anh/chị hãy bảo trọng. Câu nói trước khi chia tay với ai đó mà có lẽ lâu lắm mới gặp lại." },
  { kana: "ベトナム", writing: "", meaning: "Việt Nam" },
];

const n5GrammarLessonOne = [
  {
    pattern: "Danh từ 1 は Danh từ 2 です",
    explanation:
      "Trợ từ は đặt sau chủ đề mà người nói muốn nêu lên. Phần sau は là thông tin được nói về chủ đề đó. Khi đọc, は phát âm là わ.",
    examples: ["わたしはマイク・ミラーです。: Tôi là Mike Miller.", "わたしは会社員です。: Tôi là nhân viên công ty."],
  },
  {
    pattern: "Danh từ 1 は Danh từ 2 じゃ/では ありません",
    explanation:
      "Đây là thể phủ định của です. じゃありません thường dùng trong hội thoại hằng ngày; ではありません trang trọng hơn và hay dùng trong văn viết hoặc phát biểu.",
    examples: ["サントスさんは学生じゃありません。: Anh Santos không phải là sinh viên."],
  },
  {
    pattern: "Danh từ 1 は Danh từ 2 ですか",
    explanation:
      "Thêm か vào cuối câu để tạo câu hỏi. Với câu hỏi xác nhận đúng/sai, trả lời bằng はい nếu đúng và いいえ nếu sai. Với câu hỏi có từ nghi vấn, đặt từ nghi vấn vào vị trí thông tin cần hỏi.",
    examples: [
      "ミラーさんはアメリカ人ですか。: Anh Miller có phải là người Mỹ không?",
      "はい、アメリカ人です。: Vâng, anh ấy là người Mỹ.",
      "あの方はどなたですか。: Vị kia là ai?",
    ],
  },
  {
    pattern: "Danh từ も",
    explanation: "Trợ từ も dùng khi trình bày một nội dung tương tự với câu trước, nghĩa là cũng.",
    examples: ["ミラーさんは会社員です。グプタさんも会社員です。: Anh Miller là nhân viên công ty. Anh Gupta cũng là nhân viên công ty."],
  },
  {
    pattern: "Danh từ 1 の Danh từ 2",
    explanation:
      "の nối hai danh từ. Trong bài này, danh từ đứng trước の thường biểu thị nơi sở thuộc hoặc quan hệ bổ nghĩa cho danh từ đứng sau.",
    examples: ["ミラーさんはIMCの社員です。: Anh Miller là nhân viên công ty IMC."],
  },
  {
    pattern: "~さん",
    explanation:
      "さん đặt sau họ hoặc tên của người nghe/người thứ ba để thể hiện lịch sự. Không dùng さん sau tên của chính mình. Với trẻ em có thể dùng ちゃん với sắc thái thân mật.",
    examples: ["あの方はミラーさんです。: Vị kia là anh Miller."],
    note: "あなた chỉ nên dùng trong quan hệ rất thân mật như vợ chồng, người yêu. Nếu đã biết tên người nghe, nên gọi bằng tên + さん.",
  },
];

const n5GrammarLessonTwo = [
  {
    pattern: "これ/それ/あれ",
    explanation:
      "これ chỉ vật ở gần người nói, それ chỉ vật ở gần người nghe, あれ chỉ vật ở xa cả người nói và người nghe.",
    examples: ["これは辞書ですか。: Đây có phải là quyển từ điển không?", "これはだれのかばんですか。: Đây là cái cặp của ai?"],
  },
  {
    pattern: "この/その/あの + Danh từ",
    explanation: "この, その, あの đứng trước danh từ để bổ nghĩa cho danh từ đó: này, đó, kia.",
    examples: ["この本はわたしのです。: Quyển sách này là của tôi.", "あの方はどなたですか。: Vị kia là ai?"],
  },
  {
    pattern: "そうです/ちがいます",
    explanation:
      "そうです dùng để trả lời khẳng định cho câu hỏi đúng/sai. Khi phủ định, thường dùng ちがいます hoặc nêu đáp án đúng thay vì trả lời そうではありません.",
    examples: [
      "それは辞書ですか。はい、そうです。: Đó có phải là từ điển không? Vâng, phải.",
      "それはシャープペンシルですか。いいえ、ボールペンです。: Đó có phải bút chì kim không? Không, là bút bi.",
    ],
  },
  {
    pattern: "Danh từ 1 か Danh từ 2",
    explanation:
      "Mẫu này dùng để đưa ra từ hai lựa chọn trở lên. Khi trả lời, không dùng はい hoặc いいえ mà nói trực tiếp lựa chọn đúng.",
    examples: ["これは9ですか、7ですか。9です。: Đây là số 9 hay số 7? Là số 9."],
  },
  {
    pattern: "Danh từ 1 の Danh từ 2",
    explanation:
      "Ngoài ý sở thuộc, の còn dùng để giải thích danh từ sau nói về nội dung gì.",
    examples: ["これはコンピューターの本です。: Đây là quyển sách về máy vi tính.", "これはわたしの本です。: Đây là quyển sách của tôi."],
  },
  {
    pattern: "の thay thế danh từ",
    explanation:
      "の có thể thay thế cho danh từ chỉ vật đã xuất hiện trước đó để tránh lặp lại. Không dùng の kiểu này để thay cho danh từ chỉ người.",
    examples: ["あれはだれのかばんですか。佐藤さんのです。: Kia là cặp của ai? Của anh/chị Sato."],
  },
  {
    pattern: "お~/そうですか",
    explanation:
      "お đặt trước một số từ liên quan đến người nghe hoặc người thứ ba để thể hiện lịch sự. そうですか dùng khi người nói tiếp nhận thông tin mới và muốn biểu thị là đã hiểu.",
    examples: ["このかばんはあなたのですか。いいえ、シュミットさんのです。そうですか。: Cặp này là của anh/chị à? Không, của anh Schmidt. Thế à."],
  },
];

const n5GrammarLessonThree = [
  {
    pattern: "ここ/そこ/あそこ và こちら/そちら/あちら",
    explanation:
      "ここ chỉ vị trí gần người nói, そこ chỉ vị trí gần người nghe, あそこ chỉ vị trí xa cả hai. こちら, そちら, あちら là cách nói lịch sự hơn và cũng có thể chỉ phương hướng.",
    note: "Khi người nói và người nghe ở cùng một phạm vi, dùng ここ cho vị trí của cả hai, そこ cho chỗ hơi xa, あそこ cho chỗ xa hơn.",
  },
  {
    pattern: "Danh từ は địa điểm です",
    explanation: "Mẫu này dùng để nói một vật, người hoặc địa điểm ở đâu.",
    examples: ["お手洗いはあそこです。: Nhà vệ sinh ở đằng kia.", "電話は2階です。: Điện thoại ở tầng hai.", "山田さんは事務所です。: Anh Yamada ở văn phòng."],
  },
  {
    pattern: "どこ/どちら",
    explanation:
      "どこ hỏi địa điểm. どちら vốn hỏi phương hướng nhưng cũng có thể dùng để hỏi địa điểm với sắc thái lịch sự hơn.",
    examples: ["お手洗いはどこですか。あそこです。: Nhà vệ sinh ở đâu? Ở đằng kia.", "エレベーターはどちらですか。あちらです。: Thang máy ở chỗ nào ạ? Ở đằng kia."],
  },
  {
    pattern: "Hỏi tên nơi chốn, tổ chức: どこ/どちら",
    explanation:
      "Khi hỏi tên nơi chốn hoặc tổ chức trực thuộc như quốc gia, công ty, trường học, dùng どこ hoặc どちら, không dùng なん. どちら lịch sự hơn.",
    examples: ["学校はどこですか。: Anh/chị học ở trường nào?", "会社はどちらですか。: Anh/chị làm việc ở công ty nào ạ?"],
  },
  {
    pattern: "Danh từ 1 の Danh từ 2",
    explanation:
      "Nếu danh từ 1 là tên quốc gia hoặc công ty, danh từ 1 の danh từ 2 có thể chỉ sản phẩm của quốc gia/công ty đó. Khi hỏi xuất xứ hoặc hãng, dùng どこの.",
    examples: [
      "これはどこのコンピューターですか。: Đây là máy vi tính của nước nào/hãng nào?",
      "日本のコンピューターです。: Đây là máy vi tính của Nhật Bản.",
      "パワー電気のコンピューターです。: Đây là máy vi tính của công ty điện lực Power.",
    ],
  },
  {
    pattern: "Bảng đại từ chỉ thị",
    explanation:
      "これ/それ/あれ/どれ dùng cho đồ vật. この/その/あの/どの + danh từ dùng cho đồ vật hoặc người. ここ/そこ/あそこ/どこ dùng cho địa điểm. こちら/そちら/あちら/どちら là cách lịch sự hơn cho phương hướng hoặc địa điểm.",
  },
  {
    pattern: "お~",
    explanation: "お thêm trước một số từ liên quan đến người nghe hoặc người thứ ba để bày tỏ sự kính trọng.",
    examples: ["お国はどちらですか。: Anh/chị là người nước nào?"],
  },
];

const n5GrammarLessonFour = [
  {
    pattern: "Giờ và phút: ~時/~分",
    explanation:
      "Để nói thời gian, thêm 時 sau số giờ và 分 sau số phút. 分 đọc là ふん sau 2, 5, 7, 9; đọc là ぷん sau 1, 3, 4, 6, 8, 10. Hỏi mấy giờ dùng 何時, hỏi mấy phút dùng 何分.",
    examples: ["今何時ですか。7時10分です。: Bây giờ là mấy giờ? 7 giờ 10 phút."],
  },
  {
    pattern: "Động từ ます/ません/ました/ませんでした",
    explanation:
      "Động từ thể ます làm vị ngữ và thể hiện thái độ lịch sự. ます dùng cho thói quen hiện tại, chân lý, hành động tương lai. Phủ định là ません, quá khứ khẳng định là ました, quá khứ phủ định là ませんでした.",
    examples: [
      "毎朝6時に起きます。: Mỗi sáng tôi dậy lúc 6 giờ.",
      "あした6時に起きます。: Ngày mai tôi sẽ dậy lúc 6 giờ.",
      "けさ6時に起きました。: Sáng nay tôi đã dậy lúc 6 giờ.",
    ],
  },
  {
    pattern: "Câu hỏi động từ",
    explanation:
      "Câu hỏi động từ được tạo bằng cách thêm か vào cuối câu. Khi trả lời, nhắc lại động từ trong câu hỏi; không dùng そうです hay ちがいます.",
    examples: ["きのう勉強しましたか。はい、勉強しました。: Hôm qua anh/chị có học không? Có, tôi đã học.", "いいえ、勉強しませんでした。: Không, tôi đã không học."],
  },
  {
    pattern: "Danh từ thời gian に Động từ",
    explanation:
      "Thêm に sau danh từ chỉ thời gian để nói thời điểm hành động xảy ra.",
    examples: ["6時半に起きます。: Tôi dậy lúc 6 giờ rưỡi.", "7月2日に日本へ来ました。: Tôi đến Nhật vào ngày 2 tháng 7."],
    note:
      "Không dùng に sau các từ thời gian tương đối như hôm qua, hôm nay, ngày mai, sáng nay, tối nay, tuần trước, tuần này, tuần sau, tháng trước, tháng này, tháng sau, năm ngoái, năm nay, năm sau, khi nào. Với thứ trong tuần có thể dùng hoặc bỏ に.",
  },
  {
    pattern: "Danh từ 1 から Danh từ 2 まで",
    explanation:
      "から biểu thị điểm bắt đầu của thời gian hoặc địa điểm; まで biểu thị điểm kết thúc. Hai trợ từ này có thể đi cùng nhau hoặc dùng riêng.",
    examples: [
      "9時から5時まで勉強します。: Tôi học từ 9 giờ đến 5 giờ.",
      "大阪から東京まで3時間かかります。: Từ Osaka đến Tokyo mất 3 tiếng.",
      "9時から働きます。: Tôi làm việc từ 9 giờ.",
    ],
  },
  {
    pattern: "~から/~まで + です",
    explanation:
      "Khi nói giờ bắt đầu và kết thúc của một danh từ làm chủ đề, có thể dùng です với から, まで hoặc から~まで.",
    examples: ["銀行は9時から3時までです。: Ngân hàng mở cửa từ 9 giờ đến 3 giờ.", "昼休みは12時からです。: Giờ nghỉ trưa bắt đầu từ 12 giờ."],
  },
  {
    pattern: "Danh từ 1 と Danh từ 2",
    explanation: "と nối hai danh từ đồng cấp, nghĩa là và.",
    examples: ["銀行の休みは土曜日と日曜日です。: Ngân hàng đóng cửa vào thứ bảy và chủ nhật."],
  },
  {
    pattern: "ね",
    explanation:
      "ね đặt cuối câu để thể hiện kỳ vọng người nghe đồng ý, hoặc để xác nhận, nhắc nhở.",
    examples: ["毎日10時まで勉強します。大変ですね。: Hằng ngày tôi học đến 10 giờ. Vất vả quá nhỉ.", "山田さんの電話番号は871-6813ですね。: Số điện thoại của ông Yamada là 871-6813 đúng không ạ?"],
  },
];

export default function NihonExerciseLessonDetailPage() {
  const { level, category, lessonNo } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const lesson = getLessonDetail(level, category, lessonNo);
  const lessonId = lesson?.id;

  useEffect(() => {
    setCompleted(Boolean(lessonId && isAuthenticated && isLessonCompleted(user, lessonId)));
  }, [isAuthenticated, lessonId, user]);

  const completeLesson = () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    markLessonCompleted(user, lessonId);
    setCompleted(true);
  };

  if (!lesson) {
    return (
      <StudyShell active="Bài học" title="Không tìm thấy bài học">
        <main className="study-main detail-page">
          <Link className="detail-back" to="/grammar">Quay lại danh sách bài học</Link>
          <section className="vocab-detail-card">
            <h1>Không tìm thấy bài học</h1>
            <p>Bài học này chưa tồn tại hoặc đường dẫn không hợp lệ.</p>
          </section>
          <LessonCompletionPanel completed={completed} onComplete={completeLesson} />
          {loginPromptOpen ? (
            <LoginRequiredModal
              onClose={() => setLoginPromptOpen(false)}
              message="Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để đánh dấu đã hoàn thành bài học."
            />
          ) : null}
        </main>
      </StudyShell>
    );
  }

  const categoryLessons = getLessonsForCategory(level, category);
  const categoryBackPath = `/grammar/${level}?category=${category}`;
  const relatedLessons = categoryLessons.filter((item) => item.lessonNo !== lesson.lessonNo).slice(0, 4);
  const currentLessonIndex = categoryLessons.findIndex((item) => item.lessonNo === lesson.lessonNo);
  const nextLessonNo =
    currentLessonIndex >= 0 && categoryLessons.length
      ? categoryLessons[(currentLessonIndex + 1) % categoryLessons.length].lessonNo
      : lesson.lessonNo;
  const vocabularyTableRows =
    level === "n4" && category === "vocabulary" && n4VocabularyLessons[lesson.lessonNo]
      ? n4VocabularyLessons[lesson.lessonNo]
      : level === "n5" && category === "vocabulary" && lesson.lessonNo === 1
      ? n5VocabularyLessonOne
      : level === "n5" && category === "vocabulary" && lesson.lessonNo === 2
        ? n5VocabularyLessonTwo
        : level === "n5" && category === "vocabulary" && lesson.lessonNo === 3
          ? n5VocabularyLessonThree
          : level === "n5" && category === "vocabulary" && lesson.lessonNo === 4
            ? n5VocabularyLessonFour
            : level === "n5" && category === "vocabulary" && lesson.lessonNo === 5
              ? n5VocabularyLessonFive
              : level === "n5" && category === "vocabulary" && lesson.lessonNo === 6
                ? n5VocabularyLessonSix
                : level === "n5" && category === "vocabulary" && lesson.lessonNo === 7
                  ? n5VocabularyLessonSeven
                  : level === "n5" && category === "vocabulary" && lesson.lessonNo === 8
                    ? n5VocabularyLessonEight
                    : level === "n5" && category === "vocabulary" && lesson.lessonNo === 9
                      ? n5VocabularyLessonNine
                      : level === "n5" && category === "vocabulary" && lesson.lessonNo === 10
                        ? n5VocabularyLessonTen
                        : level === "n5" && category === "vocabulary" && lesson.lessonNo === 11
                          ? n5VocabularyLessonEleven
                          : level === "n5" && category === "vocabulary" && lesson.lessonNo === 12
                            ? n5VocabularyLessonTwelve
                            : level === "n5" && category === "vocabulary" && lesson.lessonNo === 13
                              ? n5VocabularyLessonThirteen
                              : level === "n5" && category === "vocabulary" && lesson.lessonNo === 14
                                ? n5VocabularyLessonFourteen
                                : level === "n5" && category === "vocabulary" && lesson.lessonNo === 15
                                  ? n5VocabularyLessonFifteen
                                  : level === "n5" && category === "vocabulary" && lesson.lessonNo === 16
                                    ? n5VocabularyLessonSixteen
                                    : level === "n5" && category === "vocabulary" && lesson.lessonNo === 17
                                      ? n5VocabularyLessonSeventeen
                                      : level === "n5" && category === "vocabulary" && lesson.lessonNo === 18
                                        ? n5VocabularyLessonEighteen
                                        : level === "n5" && category === "vocabulary" && lesson.lessonNo === 19
                                          ? n5VocabularyLessonNineteen
                                          : level === "n5" && category === "vocabulary" && lesson.lessonNo === 20
                                            ? n5VocabularyLessonTwenty
                                            : level === "n5" && category === "vocabulary" && lesson.lessonNo === 21
                                              ? n5VocabularyLessonTwentyOne
                                              : level === "n5" && category === "vocabulary" && lesson.lessonNo === 22
                                                ? n5VocabularyLessonTwentyTwo
                                                : level === "n5" && category === "vocabulary" && lesson.lessonNo === 23
                                                  ? n5VocabularyLessonTwentyThree
                                                  : level === "n5" && category === "vocabulary" && lesson.lessonNo === 24
                                                    ? n5VocabularyLessonTwentyFour
                                                    : level === "n5" && category === "vocabulary" && lesson.lessonNo === 25
                                                      ? n5VocabularyLessonTwentyFive
                                                      : null;
  const grammarSections =
    level === "n4" && category === "grammar"
      ? n4GrammarCleanLessons[lesson.lessonNo] ?? null
      : level === "n5" && category === "grammar"
      ? n5GrammarCleanLessons[lesson.lessonNo] ?? null
      : null;
  const readingLesson =
    level === "n5" && category === "reading"
      ? n5ReadingLessons[lesson.lessonNo] ?? null
      : null;
  const listeningLesson =
    level === "n5" && category === "listening"
      ? n5ListeningLessons[lesson.lessonNo] ?? null
      : null;

  if (vocabularyTableRows) {
    return (
      <StudyShell active="Bài học" title={`${lesson.level.label} Từ vựng - Bài ${String(lesson.lessonNo).padStart(2, "0")}`}>
        <main className="study-main detail-page exercise-lesson-detail">
          <Link className="detail-back" to={categoryBackPath}>Quay lại lộ trình bài học</Link>

          <section className="vocabulary-table-card">
            <div className="vocabulary-table-heading">
              <span className="vocab-detail-level">JLPT {lesson.level.label} · Từ vựng</span>
              <h1>Bảng từ vựng bài {String(lesson.lessonNo).padStart(2, "0")}</h1>
            </div>

            <div className="vocabulary-table-wrap">
              <table className="vocabulary-lesson-table">
                <thead>
                  <tr>
                    <th>Nghe</th>
                    <th>Kana</th>
                    <th>Kanji / cách viết</th>
                    <th>Nghĩa tiếng Việt</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabularyTableRows.map((word) => (
                    <tr key={`${word.kana}-${word.writing}-${word.meaning}`}>
                      <td className="vocabulary-audio-cell">
                        <PronunciationButton
                          text={word.kana || word.writing}
                          label=""
                          title={`Nghe cách đọc ${word.kana || word.writing}`}
                        />
                      </td>
                      <td className="vocabulary-kana">{word.kana}</td>
                      <td className="vocabulary-writing">{word.writing || "ー"}</td>
                      <td>
                        {word.meaning}
                        {word.note ? <small>{word.note}</small> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <LessonCompletionPanel completed={completed} onComplete={completeLesson} />
          {loginPromptOpen ? (
            <LoginRequiredModal
              onClose={() => setLoginPromptOpen(false)}
              message="Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để đánh dấu đã hoàn thành bài học."
            />
          ) : null}
        </main>
      </StudyShell>
    );
  }

  if (grammarSections) {
    return (
      <StudyShell active="Bài học" title={`${lesson.level.label} Ngữ pháp - Bài ${String(lesson.lessonNo).padStart(2, "0")}`}>
        <main className="study-main detail-page exercise-lesson-detail">
          <Link className="detail-back" to={categoryBackPath}>Quay lại lộ trình bài học</Link>

          <section className="grammar-lesson-card">
            <div className="vocabulary-table-heading">
              <span className="vocab-detail-level">JLPT {lesson.level.label} · Ngữ pháp</span>
              <h1>Ngữ pháp bài {String(lesson.lessonNo).padStart(2, "0")}</h1>
            </div>

            <div className="grammar-section-list">
              {grammarSections.map((section, index) => (
                <article className="grammar-section" key={`${section.pattern}-${index}`}>
                  <span className="grammar-section-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h2>{section.pattern}</h2>
                    <p>{section.content ? `Nội dung ngữ pháp trích từ ${section.pattern.toLowerCase()}.` : section.explanation}</p>
                    {section.note ? <small>{section.note}</small> : null}
                    {section.content ? <pre className="grammar-page-text">{section.content}</pre> : null}
                    {section.examples?.length ? (
                      <ul>
                        {section.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </StudyShell>
    );
  }

  if (readingLesson) {
    const readingTitle = `Bài ${Number(lesson.lessonNo)}`;
    return (
      <StudyShell active="Bài học" title={`${lesson.level.label} Đọc hiểu - ${readingTitle}`}>
        <main className="study-main detail-page exercise-lesson-detail">
          <Link className="detail-back" to={categoryBackPath}>Quay lại lộ trình bài học</Link>

          <section className="reading-lesson-card">
            <div className="reading-lesson-header">
              <div>
                <span className="reading-eyebrow">Đọc hiểu N5</span>
                <h1>{readingTitle}</h1>
              </div>
            </div>

            <div className="reading-pdf-section-list">
              {readingLesson.sections.map((section, sectionIndex) => {
                const promptImages = [section.imageSrc, section.answerImageSrc].filter(Boolean);

                return (
                  <article className="reading-pdf-section" key={`${section.kind}-${section.bookPage}`}>
                  <div className="reading-pdf-heading">
                    <div>
                      <span>{section.kind === "plus-alpha" ? "Phần bổ sung" : section.kind === "quiz" ? "Phần luyện thêm" : "Đề bài"}</span>
                      <h2>{sectionIndex === 0 ? readingTitle : `Bài ${Number(lesson.lessonNo)} - phần ${sectionIndex + 1}`}</h2>
                    </div>
                  </div>

                  {promptImages.map((imageSrc, imageIndex) => (
                    <figure className="reading-page-frame" key={imageSrc}>
                      <img
                        src={imageSrc}
                        alt={`${readingTitle} - trang ${imageIndex === 0 ? section.bookPage : section.answerPage}`}
                        loading="lazy"
                      />
                    </figure>
                  ))}

                  {section.answerLines?.length ? (
                      <section className="reading-answer-block">
                        <div>
                          <span>Đáp án tham khảo</span>
                          <h3>Đáp án và giải thích</h3>
                        <ul className="reading-answer-lines">
                          {section.answerLines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                        </div>
                      </section>
                  ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <LessonCompletionPanel completed={completed} onComplete={completeLesson} />
          {loginPromptOpen ? (
            <LoginRequiredModal
              onClose={() => setLoginPromptOpen(false)}
              message={"B\u1ea1n ch\u01b0a \u0111\u0103ng nh\u1eadp. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp ho\u1eb7c \u0111\u0103ng k\u00fd \u0111\u1ec3 \u0111\u00e1nh d\u1ea5u \u0111\u00e3 ho\u00e0n th\u00e0nh b\u00e0i h\u1ecdc."}
            />
          ) : null}
        </main>
      </StudyShell>
    );
  }

  if (listeningLesson) {
    const listeningTitle = `Bài ${Number(lesson.lessonNo)}`;
    return (
      <StudyShell active="Bài học" title={`${lesson.level.label} Nghe hiểu - ${listeningTitle}`}>
        <main className="study-main detail-page exercise-lesson-detail">
          <Link className="detail-back" to={categoryBackPath}>Quay lại lộ trình bài học</Link>

          <section className="reading-lesson-card listening-lesson-card">
            <div className="reading-lesson-header">
              <div>
                <span className="reading-eyebrow">Nghe hiểu N5</span>
                <h1>{listeningTitle}</h1>
              </div>
            </div>

            <section className="listening-audio-panel" aria-label="Danh sách audio">
              <div className="reading-pdf-heading">
                <div>
                  <span>Audio</span>
                  <h2>Nghe trước khi xem đáp án</h2>
                </div>
              </div>
              <div className="listening-audio-list">
                {listeningLesson.audios.map((audio) => (
                  <div className={`listening-audio-row${audio.missing ? " missing" : ""}`} key={audio.label}>
                    <span>{audio.label}</span>
                    {audio.missing ? (
                      <p>Chưa có file audio trong thư mục nguồn.</p>
                    ) : (
                      <audio controls preload="none" src={audio.src}>
                        Trình duyệt của bạn không hỗ trợ phát audio.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="reading-pdf-section-list">
              <article className="reading-pdf-section">
                <div className="reading-pdf-heading">
                  <div>
                    <span>Đề bài</span>
                    <h2>{listeningTitle}</h2>
                  </div>
                </div>

                {listeningLesson.promptPages.map((page) => (
                  <figure className="reading-page-frame" key={page.imageSrc}>
                    <img
                      src={page.imageSrc}
                      alt={`${listeningTitle} - trang đề ${page.bookPage}`}
                      loading="lazy"
                    />
                  </figure>
                ))}
              </article>

              <article className="reading-pdf-section">
                <div className="reading-pdf-heading">
                  <div>
                    <span>Đáp án</span>
                    <h2>Đối chiếu sau khi làm bài</h2>
                  </div>
                </div>

                <div className="listening-answer-list">
                  {listeningLesson.answerGroups.map((group) => (
                    <section className="listening-answer-card" key={group.label}>
                      <div className="listening-answer-card-heading">
                        <span>{group.label}</span>
                      </div>
                      <ol>
                        {group.answers.map((answer) => (
                          <li key={answer}>{answer}</li>
                        ))}
                      </ol>
                      <p>
                        {group.note ||
                          `Giải thích nhẹ: nghe lại audio ${group.label}, rồi đối chiếu từng ý theo đúng thứ tự xuất hiện trong đoạn nghe.`}
                      </p>
                    </section>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <LessonCompletionPanel completed={completed} onComplete={completeLesson} />
          {loginPromptOpen ? (
            <LoginRequiredModal
              onClose={() => setLoginPromptOpen(false)}
              message={"Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để đánh dấu đã hoàn thành bài học."}
            />
          ) : null}
        </main>
      </StudyShell>
    );
  }

  return (
    <StudyShell active="Bài học" title={lesson.title}>
      <main className="study-main detail-page exercise-lesson-detail">
        <Link className="detail-back" to={categoryBackPath}>Quay lại lộ trình bài học</Link>

        <section className="detail-hero exercise-lesson-hero">
          <div>
            <span className="vocab-detail-level">JLPT {lesson.level.label} · {lesson.category.title}</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <Link to={`/grammar/${level}/${category}/${nextLessonNo}`}>Bài tiếp theo</Link>
        </section>

        <section className="vocab-detail-grid">
          <article className="vocab-detail-card large">
            <h2>Mục tiêu</h2>
            <p>{lesson.goal}</p>
          </article>
          <article className="vocab-detail-card">
            <h2>Khởi động</h2>
            <p>{lesson.warmup}</p>
          </article>
        </section>

        <section className="vocab-detail-card examples">
          <h2>Nội dung chính</h2>
          {lesson.content.map((line) => (
            <div className="detail-example" key={line}>
              <strong>{line}</strong>
            </div>
          ))}
        </section>

        <section className="vocab-detail-card examples">
          <h2>Ví dụ minh họa</h2>
          {lesson.examples.map((example) => (
            <div className="detail-example" key={example}>
              <strong>{example}</strong>
              <span>Đọc chậm, chú ý ý nghĩa và cách dùng trong ngữ cảnh.</span>
            </div>
          ))}
        </section>

        <section className="vocab-detail-card examples">
          <h2>Điểm cần nhớ</h2>
          {lesson.keyPoints.map((point, index) => (
            <div className="detail-example" key={point}>
              <strong>Ghi nhớ {index + 1}</strong>
              <p>{point}</p>
            </div>
          ))}
        </section>

        <section className="vocab-detail-card">
          <h2>Tự ôn sau bài học</h2>
          <p>{lesson.review}</p>
        </section>

        <section className="vocab-detail-card related">
          <h2>Học tiếp trong mục này</h2>
          <div>
            {relatedLessons.map((item) => (
              <Link to={`/grammar/${level}/${category}/${item.lessonNo}`} key={item.id}>
                Bài {String(item.lessonNo).padStart(2, "0")} - {item.title.split(": ")[1]}
              </Link>
            ))}
            <Link to={categoryBackPath}>Xem tất cả mục bài học</Link>
          </div>
        </section>
        <LessonCompletionPanel completed={completed} onComplete={completeLesson} />
        {loginPromptOpen ? (
          <LoginRequiredModal
            onClose={() => setLoginPromptOpen(false)}
            message="Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để đánh dấu đã hoàn thành bài học."
          />
        ) : null}
      </main>
    </StudyShell>
  );
}

function LessonCompletionPanel({ completed, onComplete }) {
  return (
    <section className={`lesson-complete-panel ${completed ? "is-completed" : ""}`}>
      <div className="lesson-complete-check" aria-hidden="true">✓</div>
      <div>
        <h2>{completed ? "Bạn đã hoàn thành bài này" : "Đã đọc đến cuối bài?"}</h2>
        <p>Đánh dấu hoàn thành để dashboard và danh sách bài học theo dõi đúng tiến độ của bạn.</p>
      </div>
      <button type="button" disabled={completed} onClick={onComplete}>
        {completed ? "Đã hoàn thành" : "Tích hoàn thành"}
      </button>
    </section>
  );
}
