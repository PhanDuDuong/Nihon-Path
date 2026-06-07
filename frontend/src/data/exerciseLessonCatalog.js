export const jlptLevels = [
  { label: "N5", value: 1, slug: "n5", description: "Nền tảng kana, từ vựng đời sống, câu đơn và đoạn ngắn." },
  { label: "N4", value: 2, slug: "n4", description: "Mở rộng hội thoại, liên kết câu và đọc hiểu tình huống quen thuộc." },
  { label: "N3", value: 3, slug: "n3", description: "Chuyển tiếp trung cấp với sắc thái ngữ pháp và bài đọc dài hơn." },
  { label: "N2", value: 4, slug: "n2", description: "Ngôn ngữ học thuật, công việc, báo chí và lập luận trừu tượng." },
  { label: "N1", value: 5, slug: "n1", description: "Diễn đạt tự nhiên, văn bản chuyên sâu và nghe hiểu tốc độ thật." },
];

export const exerciseCategories = [
  {
    slug: "vocabulary",
    title: "Từ vựng",
    shortTitle: "Từ vựng",
    description: "Học nghĩa, cách đọc, sắc thái dùng và cụm từ thường gặp.",
    icon: "語",
  },
  {
    slug: "grammar",
    title: "Ngữ pháp",
    shortTitle: "Ngữ pháp",
    description: "Nắm mẫu câu, cách chia, vị trí trong câu và lỗi dễ nhầm.",
    icon: "文",
  },
  {
    slug: "reading",
    title: "Đọc hiểu",
    shortTitle: "Đọc hiểu",
    description: "Học cách đọc câu, đoạn văn, biển báo, email và bài luận ngắn.",
    icon: "読",
  },
  {
    slug: "listening",
    title: "Nghe hiểu",
    shortTitle: "Nghe hiểu",
    description: "Học cách bắt từ khóa, ý chính, phản hồi hội thoại và thông báo.",
    icon: "聞",
  },
];

const focusBank = {
  n5: {
    vocabulary: ["chào hỏi", "gia đình", "trường học", "thời gian", "đồ vật", "địa điểm", "động từ sinh hoạt", "tính từ cơ bản"],
    grammar: ["は・が・を", "です・ます", "これ・それ・あれ", "に・で・へ", "たいです", "てください", "ない形", "過去形"],
    reading: ["câu tự giới thiệu", "lịch học", "tin nhắn ngắn", "biển báo đơn giản", "đoạn văn gia đình", "thời khóa biểu"],
    listening: ["lời chào", "số đếm", "giờ giấc", "mua đồ", "hỏi đường", "lịch hẹn"],
  },
  n4: {
    vocabulary: ["cảm xúc", "sức khỏe", "du lịch", "mua sắm", "công việc bán thời gian", "thời tiết", "giao thông", "thói quen"],
    grammar: ["可能形", "ている", "ながら", "予定です", "そうです", "なら", "とき", "なければならない"],
    reading: ["email ngắn", "thông báo lớp học", "hướng dẫn sử dụng", "đoạn kể trải nghiệm", "bảng nội quy", "tin nhắn đặt lịch"],
    listening: ["xin phép", "nhờ vả", "đổi lịch", "mô tả triệu chứng", "mua vé", "chỉ dẫn trong ga"],
  },
  n3: {
    vocabulary: ["quan hệ xã hội", "công sở", "tin tức đời sống", "học tập", "ý kiến cá nhân", "vấn đề xã hội", "cụm phó từ", "từ đồng nghĩa"],
    grammar: ["ように", "ばかり", "はず", "わけではない", "ことになった", "ても", "ほど", "一方で"],
    reading: ["bài blog", "thư góp ý", "thông báo công ty", "đoạn giải thích", "ý kiến người viết", "so sánh lựa chọn"],
    listening: ["trao đổi công việc", "lời khuyên", "phàn nàn lịch sự", "thảo luận kế hoạch", "bản tin ngắn", "hỏi ý kiến"],
  },
  n2: {
    vocabulary: ["kinh tế", "môi trường", "công nghệ", "giáo dục", "quản lý thời gian", "sắc thái trang trọng", "từ Hán Nhật", "cụm thành ngữ"],
    grammar: ["にかかわらず", "ものの", "上で", "に伴って", "限り", "かねない", "ざるを得ない", "というものだ"],
    reading: ["bài báo ngắn", "bình luận xã hội", "quy định công ty", "email trang trọng", "lập luận hai phía", "tóm tắt khảo sát"],
    listening: ["cuộc họp", "thông báo công cộng", "phỏng vấn", "tranh luận nhẹ", "báo cáo tiến độ", "hướng dẫn nghiệp vụ"],
  },
  n1: {
    vocabulary: ["học thuật", "chính sách", "văn học", "tâm lý", "ngôn ngữ trừu tượng", "sắc thái phê bình", "quán dụng ngữ", "từ chuyên môn"],
    grammar: ["いかんによらず", "をもって", "に至っては", "までもない", "べく", "ともなると", "ならでは", "を余儀なくされる"],
    reading: ["xã luận", "tiểu luận", "nghiên cứu ngắn", "phê bình sách", "văn bản hành chính", "quan điểm ẩn"],
    listening: ["bài giảng", "tọa đàm", "bản tin chuyên sâu", "thuyết trình", "trao đổi chiến lược", "ẩn ý trong hội thoại"],
  },
};

const categoryReview = {
  vocabulary: "Sau khi học, hãy chọn 5 từ dễ dùng nhất và ghi lại một tình huống đời thật cho mỗi từ.",
  grammar: "Sau khi học, hãy tự viết 3 câu cùng một mẫu nhưng đổi chủ thể, thời điểm hoặc sắc thái.",
  reading: "Sau khi học, hãy tóm tắt đoạn đọc bằng 2 câu tiếng Việt rồi gạch chân câu chứa ý chính.",
  listening: "Sau khi học, hãy nghe lại một đoạn ngắn và ghi 3 từ khóa trước khi xem transcript.",
};

const categoryKeyPoints = {
  vocabulary: ["Nhìn từ trong cụm, không học rời từng chữ.", "Ghi cách đọc trước nghĩa để tránh nhầm kanji giống nhau.", "Ưu tiên ví dụ ngắn gắn với sinh hoạt hằng ngày."],
  grammar: ["Xác định vị trí mẫu câu trong câu trước khi dịch.", "Chú ý dạng động từ/danh từ đứng ngay trước mẫu.", "So sánh với mẫu gần nghĩa để hiểu sắc thái."],
  reading: ["Đọc tiêu đề và câu đầu để đoán chủ đề.", "Khoanh từ nối vì chúng thường báo hiệu lý do, kết quả hoặc đối lập.", "Không dịch từng chữ; hãy tìm ý chính trước."],
  listening: ["Bắt danh từ, số, thời gian, địa điểm trước.", "Nghe thái độ người nói qua các cụm kết câu.", "Nếu hụt một câu, tiếp tục nghe ý chính thay vì dừng lại."],
};

export function getLevelBySlug(slug) {
  return jlptLevels.find((level) => level.slug === slug);
}

export function getCategoryBySlug(slug) {
  return exerciseCategories.find((category) => category.slug === slug);
}

export function getLessonsForCategory(levelSlug, categorySlug) {
  const level = getLevelBySlug(levelSlug);
  const category = getCategoryBySlug(categorySlug);
  if (!level || !category) {
    return [];
  }

  const { start, count } = getLessonRange(level.slug);
  return Array.from({ length: count }, (_, index) => buildLesson(level, category, start + index, index));
}

export function getLessonDetail(levelSlug, categorySlug, lessonNo) {
  const lessonNumber = Number(lessonNo);
  if (!Number.isInteger(lessonNumber)) {
    return null;
  }
  const [lesson] = getLessonsForCategory(levelSlug, categorySlug).filter((item) => item.lessonNo === lessonNumber);
  return lesson ?? null;
}

function getLessonRange(levelSlug) {
  if (levelSlug === "n4") {
    return { start: 26, count: 25 };
  }
  return { start: 1, count: 25 };
}

function buildLesson(level, category, lessonNo, index) {
  const focuses = focusBank[level.slug][category.slug];
  const focus = focuses[index % focuses.length];
  const cycle = Math.floor(index / focuses.length) + 1;
  const { start, count } = getLessonRange(level.slug);
  const nextLessonNo = index + 1 < count ? lessonNo + 1 : start;
  const title = `${level.label} ${category.title} - Bài ${String(lessonNo).padStart(2, "0")}: ${capitalize(focus)}`;

  return {
    id: `${level.slug}-${category.slug}-${lessonNo}`,
    level,
    category,
    lessonNo,
    title,
    summary: `Bài ${lessonNo} giới thiệu chủ điểm ${focus} trong mục ${category.shortTitle.toLowerCase()} cấp ${level.label}.`,
    goal: `Sau bài này, bạn hiểu được vai trò của ${focus} và biết cách dùng trong ngữ cảnh ${level.label}.`,
    warmup: `Trước khi học, hãy nhìn chủ điểm "${focus}" và nhớ lại những từ, mẫu câu hoặc tình huống bạn đã gặp.`,
    content: buildContent(level, category, focus, nextLessonNo, cycle),
    examples: buildExamples(level, category, focus),
    keyPoints: categoryKeyPoints[category.slug],
    review: categoryReview[category.slug],
  };
}

function buildContent(level, category, focus, nextLessonNo, cycle) {
  const pace = cycle === 1 ? "nhận diện" : cycle === 2 ? "áp dụng" : cycle === 3 ? "mở rộng" : "tổng hợp";
  return [
    `Trọng tâm bài học là ${focus}. Ở cấp ${level.label}, bạn nên ${pace} cách dùng trong ngữ cảnh thay vì học rời rạc.`,
    `Ý nghĩa chính: ${focus} thường xuất hiện khi người nói muốn truyền đạt thông tin quen thuộc nhưng cần chọn đúng từ, mẫu câu hoặc chiến lược nghe đọc.`,
    `Cách học: đọc ví dụ mẫu, đánh dấu phần lặp lại, sau đó thay bằng thông tin của chính bạn.`,
    `Kết nối bài sau: bài ${nextLessonNo} sẽ tiếp tục mở rộng cùng kỹ năng để bạn học liền mạch.`,
  ];
}

function buildExamples(level, category, focus) {
  if (category.slug === "vocabulary") {
    return [
      `${focus}: học theo cụm, không chỉ học một từ riêng lẻ.`,
      `Ví dụ ${level.label}: khi gặp một từ mới, ghi cách đọc, nghĩa tiếng Việt, sắc thái và một câu minh họa.`,
    ];
  }
  if (category.slug === "grammar") {
    return [
      `Mẫu trọng tâm: ${focus}.`,
      `Ví dụ ${level.label}: đọc mẫu câu, xác định phần đứng trước/sau, rồi mới dịch nghĩa toàn câu.`,
    ];
  }
  if (category.slug === "reading") {
    return [
      `Đọc chủ điểm: ${focus}.`,
      "Khi đọc, hãy tìm câu nêu ý chính và chú ý từ nối như しかし, だから, そのため.",
    ];
  }
  return [
    `Nghe chủ điểm: ${focus}.`,
    "Khi nghe, hãy bắt từ khóa trước rồi mới ghép lại thành ý đầy đủ.",
  ];
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
