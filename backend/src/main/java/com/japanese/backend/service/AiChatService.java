package com.japanese.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.japanese.backend.dto.AiChatRequest;
import com.japanese.backend.dto.AiChatResponse;
import com.japanese.backend.entity.User;
import com.japanese.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private static final int MAX_HISTORY_TURNS = 8;
    private static final int MAX_FILES = 4;
    private static final long MAX_FILE_BYTES = 8L * 1024 * 1024;
    private static final int MAX_EXTRACTED_TEXT_CHARS = 12000;
    private static final String SYSTEM_INSTRUCTIONS = """
            Bạn là trợ lý AI tích hợp trong một website học tiếng Nhật. Nhiệm vụ chính của bạn là hỗ trợ người dùng học tiếng Nhật và hướng dẫn sử dụng các chức năng trong hệ thống.

Bạn chỉ được trả lời các nội dung liên quan đến:
- học tiếng Nhật
- từ vựng tiếng Nhật
- kanji
- ngữ pháp
- dịch Nhật - Việt, Việt - Nhật
- luyện đọc hiểu
- luyện nghe, luyện nói, luyện viết
- làm bài tập tiếng Nhật
- giải thích đáp án bài tập
- luyện thi JLPT N5, N4, N3, N2, N1
- hướng dẫn sử dụng website học tiếng Nhật
- hướng dẫn dùng các chức năng như tra cứu, flashcard, bài học, bài tập, đề thi, dashboard, tài khoản, VIP nếu có

Nếu người dùng hỏi ngoài phạm vi trên, hãy lịch sự từ chối và hướng người dùng quay lại chủ đề học tiếng Nhật hoặc cách sử dụng hệ thống.

Vai trò của bạn:
1. Là gia sư tiếng Nhật thân thiện, dễ hiểu.
2. Là trợ lý hướng dẫn người dùng thao tác trên website.
3. Là người giải thích bài học, bài tập, đề thi một cách rõ ràng.
4. Là công cụ hỗ trợ tra cứu, dịch, luyện tập và ôn thi JLPT.

Nguyên tắc trả lời chung:
- Trả lời bằng tiếng Việt là chính.
- Khi cần đưa ví dụ tiếng Nhật, hãy viết kèm hiragana/furigana nếu phù hợp.
- Với người mới học, ưu tiên giải thích đơn giản, dễ hiểu.
- Không trả lời quá dài nếu người dùng chỉ hỏi ngắn.
- Nếu người dùng yêu cầu giải thích chi tiết thì hãy trả lời đầy đủ hơn.
- Khi giải thích ngữ pháp, cần có: cấu trúc, ý nghĩa, cách dùng, ví dụ, dịch nghĩa.
- Khi giải thích từ vựng, cần có: từ tiếng Nhật, cách đọc, nghĩa tiếng Việt, loại từ nếu biết, ví dụ.
- Khi giải thích kanji, cần có: chữ kanji, âm On, âm Kun nếu biết, nghĩa, ví dụ từ vựng.
- Khi dịch, cần dịch tự nhiên, dễ hiểu, không dịch máy móc.
- Khi sửa câu tiếng Nhật, cần chỉ ra lỗi và đưa câu đúng.
- Khi người dùng làm bài tập, cần giải thích vì sao chọn đáp án đó nếu người dùng yêu cầu.
- Khi người dùng hỏi về JLPT, cần trả lời theo cấp độ phù hợp N5 đến N1.

Phạm vi hỗ trợ học tiếng Nhật:
- Tra cứu từ vựng
- Giải nghĩa từ
- Đặt câu ví dụ
- Phân biệt các từ gần nghĩa
- Giải thích kanji
- Giải thích ngữ pháp
- Dịch câu, đoạn văn
- Sửa lỗi câu tiếng Nhật
- Tạo bài tập luyện tập
- Chấm bài tập dạng cơ bản
- Giải thích đáp án
- Gợi ý cách học
- Gợi ý lộ trình học JLPT
- Luyện hội thoại
- Luyện phỏng vấn bằng tiếng Nhật nếu liên quan học tập
- Tạo flashcard nội dung học
- Tóm tắt bài học
- Giảng lại bài học theo cách dễ hiểu hơn

Phạm vi hướng dẫn sử dụng hệ thống:
- Hướng dẫn đăng ký, đăng nhập, đăng xuất
- Hướng dẫn cập nhật hồ sơ cá nhân
- Hướng dẫn tra cứu từ vựng
- Hướng dẫn tra cứu kanji
- Hướng dẫn xem bài học ngữ pháp
- Hướng dẫn làm bài tập
- Hướng dẫn làm đề thi JLPT
- Hướng dẫn xem kết quả bài làm
- Hướng dẫn sử dụng flashcard
- Hướng dẫn thêm từ vào flashcard
- Hướng dẫn theo dõi tiến độ học trên dashboard
- Hướng dẫn sử dụng tính năng VIP nếu hệ thống có
- Hướng dẫn liên hệ admin hoặc báo lỗi nếu không xử lý được

Khi người dùng hỏi cách sử dụng website:
- Trả lời theo từng bước ngắn gọn.
- Dùng cách diễn đạt như: “Bạn vào trang…”, “Sau đó nhấn nút…”, “Hệ thống sẽ hiển thị…”.
- Nếu chưa có thông tin chính xác trong User Guide, hãy nói rõ: “Hiện tại mình chưa có hướng dẫn chi tiết phần này, bạn có thể kiểm tra trong trang hướng dẫn hoặc liên hệ admin.”
- Không bịa ra chức năng nếu không chắc hệ thống có chức năng đó.

Quy tắc xử lý yêu cầu dịch:
- Nếu người dùng yêu cầu dịch Nhật sang Việt: dịch tự nhiên sang tiếng Việt.
- Nếu người dùng yêu cầu dịch Việt sang Nhật: dùng câu tiếng Nhật phù hợp trình độ, ưu tiên dễ hiểu.
- Nếu câu có nhiều cách dịch, đưa 1 bản dịch chính và có thể thêm cách nói tự nhiên hơn.
- Nếu câu tiếng Nhật có kanji khó, có thể thêm cách đọc hiragana.

Quy tắc xử lý yêu cầu ngữ pháp:
Khi người dùng hỏi một mẫu ngữ pháp, hãy trả lời theo dạng:
1. Mẫu câu
2. Ý nghĩa
3. Cách dùng
4. Ví dụ
5. Lưu ý nếu có

Ví dụ định dạng:
「Vます + ながら」
Nghĩa: vừa làm gì vừa làm gì.
Cách dùng: dùng khi một người thực hiện hai hành động cùng lúc.
Ví dụ: 音楽を聞きながら勉強します。
Dịch: Tôi vừa nghe nhạc vừa học bài.

Quy tắc xử lý yêu cầu từ vựng:
Khi người dùng hỏi một từ, hãy trả lời theo dạng:
- Từ:
- Cách đọc:
- Nghĩa:
- Loại từ:
- Ví dụ:
- Dịch ví dụ:

Quy tắc xử lý yêu cầu kanji:
Khi người dùng hỏi một kanji, hãy trả lời theo dạng:
- Kanji:
- Nghĩa:
- Âm On:
- Âm Kun:
- Số nét nếu biết:
- Ví dụ từ vựng:
- Ví dụ câu nếu cần:

Quy tắc xử lý bài tập:
- Nếu người dùng đưa câu hỏi trắc nghiệm, hãy chọn đáp án đúng.
- Nếu người dùng yêu cầu giải thích, giải thích ngắn gọn vì sao đúng và vì sao các đáp án khác sai.
- Nếu người dùng chỉ muốn đáp án, chỉ trả lời đáp án.
- Nếu thiếu dữ liệu đề bài, hãy hỏi lại thông tin còn thiếu.

Quy tắc tạo bài tập:
- Có thể tạo bài tập từ vựng, kanji, ngữ pháp, đọc hiểu.
- Câu hỏi phải phù hợp cấp độ JLPT mà người dùng yêu cầu.
- Nếu không có cấp độ, mặc định tạo ở mức dễ hoặc N5-N4.
- Có thể tạo kèm đáp án nếu người dùng yêu cầu.

Quy tắc về flashcard:
- Khi người dùng yêu cầu tạo flashcard, hãy tạo nội dung gồm mặt trước và mặt sau.
- Mặt trước có thể là từ vựng/kanji/câu tiếng Nhật.
- Mặt sau gồm nghĩa, cách đọc, ví dụ.
- Có thể gợi ý nhóm flashcard theo cấp độ JLPT hoặc chủ đề.

Quy tắc về dashboard và tiến độ học:
- Nếu người dùng hỏi về tiến độ học, hãy hướng dẫn họ vào dashboard.
- Nếu không có dữ liệu thực tế từ hệ thống, không tự bịa số liệu.
- Chỉ nói chung rằng dashboard hiển thị số từ đã học, bài tập đã làm, điểm số, tiến độ flashcard nếu hệ thống hỗ trợ.

Quy tắc về dữ liệu hệ thống:
- Bạn không được tự ý khẳng định dữ liệu cá nhân, điểm số, lịch sử học, trạng thái VIP nếu backend không cung cấp.
- Nếu cần dữ liệu thật, hãy nói người dùng kiểm tra trong tài khoản hoặc dashboard.
- Nếu hệ thống có API cung cấp dữ liệu, hãy dựa trên dữ liệu đó để trả lời.

Quy tắc an toàn và giới hạn:
- Không tư vấn các nội dung nguy hiểm, vi phạm pháp luật hoặc không liên quan.
- Không tạo nội dung xúc phạm, phân biệt đối xử, bạo lực hoặc người lớn.
- Không yêu cầu người dùng cung cấp mật khẩu, mã OTP, token hoặc thông tin nhạy cảm.
- Nếu người dùng hỏi về tài khoản, chỉ hướng dẫn thao tác, không yêu cầu mật khẩu.
- Không giả vờ là giáo viên thật, admin thật hoặc nhân viên hỗ trợ thật.
- Không hứa thực hiện hành động ngoài khả năng của chatbot.

Cách xử lý khi không biết:
- Không bịa câu trả lời.
- Hãy nói: “Mình chưa có đủ thông tin để trả lời chính xác phần này.”
- Sau đó gợi ý người dùng cung cấp thêm ảnh, câu hỏi, bài học, từ vựng hoặc nội dung cần giải thích.

Phong cách trả lời:
- Thân thiện
- Dễ hiểu
- Ngắn gọn vừa đủ
- Ưu tiên giải thích theo từng bước
- Phù hợp với người Việt học tiếng Nhật
- Không dùng quá nhiều thuật ngữ khó nếu không cần thiết

Mục tiêu cuối cùng:
Giúp người dùng học tiếng Nhật hiệu quả hơn, hiểu bài rõ hơn, sử dụng website dễ dàng hơn và có trải nghiệm học tập tốt hơn trong hệ thống.
""";

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final AiRagService aiRagService;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.fallback-models:gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-flash-lite-latest,gemma-3-4b-it}")
    private String fallbackModels;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com}")
    private String baseUrl;

    public AiChatResponse chat(String email, AiChatRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập"));
        if (!hasVipAccess(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ tài khoản VIP mới được dùng chatbot AI");
        }
        if (request == null || !StringUtils.hasText(request.message())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập câu hỏi");
        }
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chatbot AI chưa được cấu hình GEMINI_API_KEY trên server"
            );
        }

        AiRagContext ragContext = aiRagService.retrieve(request.message());
        GeminiAnswer answer = callGemini(request, ragContext, List.of(), "");
        return new AiChatResponse(answer.text(), answer.model(), LocalDateTime.now(), ragContext.sources());
    }

    public AiChatResponse chatWithFiles(String email, String message, String historyJson, List<MultipartFile> files) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập"));
        if (!hasVipAccess(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ tài khoản VIP mới được dùng chatbot AI");
        }
        List<MultipartFile> safeFiles = files == null ? List.of() : files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
        if (!StringUtils.hasText(message) && safeFiles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập câu hỏi hoặc đính kèm tài liệu");
        }
        if (safeFiles.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ được đính kèm tối đa " + MAX_FILES + " tệp");
        }
        if (!StringUtils.hasText(apiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chatbot AI chưa được cấu hình GEMINI_API_KEY trên server"
            );
        }

        String finalMessage = StringUtils.hasText(message)
                ? message.trim()
                : "Hãy đ𞳜c tài liệu/ảnh đính kèm và hỗ trợ mình h𞳜c tiếng Nhật.";
        AiChatRequest request = new AiChatRequest(finalMessage, parseHistory(historyJson));
        AttachmentContext attachmentContext = buildAttachmentContext(safeFiles);
        AiRagContext ragContext = aiRagService.retrieve(finalMessage + " " + attachmentContext.extractedText());
        GeminiAnswer answer = callGemini(request, ragContext, attachmentContext.inlineParts(), attachmentContext.extractedText());
        return new AiChatResponse(answer.text(), answer.model(), LocalDateTime.now(), ragContext.sources());
    }

    private boolean hasVipAccess(User user) {
        String role = user.getRole() == null ? "USER" : user.getRole().getName();
        String normalized = role == null ? "" : role.toUpperCase();
        if (normalized.contains("ADMIN")) {
            return true;
        }
        return normalized.contains("VIP")
                && user.getVipExpiresAt() != null
                && user.getVipExpiresAt().isAfter(LocalDateTime.now());
    }

    private GeminiAnswer callGemini(
            AiChatRequest request,
            AiRagContext ragContext,
            List<Map<String, Object>> attachmentParts,
            String attachmentText
    ) {
        RestClient client = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTIONS))));
        body.put("contents", buildContents(request, ragContext, attachmentParts, attachmentText));
        body.put("generationConfig", Map.of(
                "temperature", 0.35,
                "maxOutputTokens", 650
        ));

        String lastError = null;
        for (String selectedModel : candidateModels()) {
            try {
                String raw = client.post()
                        .uri(uriBuilder -> uriBuilder
                                .path("/v1beta/models/{model}:generateContent")
                                .queryParam("key", apiKey)
                                .build(selectedModel))
                        .body(body)
                        .retrieve()
                        .body(String.class);
                String answer = extractOutputText(raw);
                if (!StringUtils.hasText(answer)) {
                    lastError = "AI không trả về nội dung phù hợp";
                    continue;
                }
                return new GeminiAnswer(answer.trim(), selectedModel);
            } catch (RestClientResponseException exception) {
                lastError = extractGeminiError(exception.getResponseBodyAsString());
            } catch (Exception exception) {
                lastError = "Không thể kết nối chatbot AI lúc này";
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                StringUtils.hasText(lastError)
                        ? lastError
                        : "Tất cả model Google AI Studio hiện không sẵn sàng. Vui lòng thử lại sau"
        );
    }

    private List<String> candidateModels() {
        List<String> candidates = new ArrayList<>();
        addModelCandidate(candidates, model);
        if (StringUtils.hasText(fallbackModels)) {
            for (String fallbackModel : fallbackModels.split(",")) {
                addModelCandidate(candidates, fallbackModel);
            }
        }
        return candidates.isEmpty() ? List.of("gemini-2.5-flash-lite") : candidates;
    }

    private void addModelCandidate(List<String> candidates, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        String candidate = value.trim();
        if (candidate.startsWith("models/")) {
            candidate = candidate.substring("models/".length());
        }
        if (!candidate.startsWith("gemini-")) {
            return;
        }
        if (!candidates.contains(candidate)) {
            candidates.add(candidate);
        }
    }

    private List<Map<String, Object>> buildContents(
            AiChatRequest request,
            AiRagContext ragContext,
            List<Map<String, Object>> attachmentParts,
            String attachmentText
    ) {
        List<Map<String, Object>> contents = new ArrayList<>();
        if (request.history() != null) {
            request.history().stream()
                    .filter(turn -> turn != null && StringUtils.hasText(turn.content()))
                    .skip(Math.max(0, request.history().size() - MAX_HISTORY_TURNS))
                    .forEach(turn -> contents.add(Map.of(
                            "role", normalizeGeminiRole(turn.role()),
                            "parts", List.of(Map.of("text", turn.content().trim()))
                    )));
        }
        List<Map<String, Object>> userParts = new ArrayList<>();
        userParts.add(Map.of("text", buildRagPrompt(request.message(), ragContext, attachmentText)));
        userParts.addAll(attachmentParts);
        contents.add(Map.of("role", "user", "parts", userParts));
        return contents;
    }

    private String normalizeGeminiRole(String role) {
        return "assistant".equalsIgnoreCase(role) || "model".equalsIgnoreCase(role) ? "model" : "user";
    }

    private String buildRagPrompt(String message, AiRagContext ragContext, String attachmentText) {
        return """
                Câu hỏi người dùng:
                %s

                N?i dung tr?ch xu?t t? t?i li?u n?u c?:
                %s

                Ng? c?nh RAG t? vector DB n?i b?:
                %s

                Yêu cầu thực thi:
                - Trả lời dựa trên ngữ cảnh nếu có liên quan.
                - Nếu có ảnh, PDF hoặc tài liệu đính kèm, hãy đọc nội dung đính kèm để dịch, giải bài tập, tra từ, tóm tắt hoặc giải thích theo yêu cầu của người dùng.
                - Nếu ngữ cảnh không đủ, vẫn được trả lời bằng kiến thức tiếng Nhật phổ biến, nhất là dịch câu, giải bài tập, tra từ, sửa lỗi, và giải thích ngữ pháp.
                - Không được bịa thông tin về hệ thống NihonPath.
                - Chỉ từ chối nếu câu hỏi hoàn toàn ngoài phạm vi học tiếng Nhật hoặc NihonPath.
                """.formatted(message.trim(), StringUtils.hasText(attachmentText) ? attachmentText : "Không có.", ragContext.contextText());
    }

    private String extractOutputText(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw);
        StringBuilder builder = new StringBuilder();
        for (JsonNode candidate : root.path("candidates")) {
            for (JsonNode contentItem : candidate.path("content").path("parts")) {
                JsonNode text = contentItem.path("text");
                if (text.isTextual()) {
                    builder.append(text.asText()).append("\n");
                }
            }
        }
        return builder.toString();
    }

    private String extractGeminiError(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "Google AI Studio đang không phản hồi. Vui lòng thử lại sau";
        }
        try {
            JsonNode root = objectMapper.readTree(raw);
            String message = root.path("error").path("message").asText();
            if (StringUtils.hasText(message)) {
                return "Google AI Studio: " + message;
            }
        } catch (Exception ignored) {
            return "Google AI Studio đang báo lỗi. Vui lòng kiểm tra API key, quota hoặc model";
        }
        return "Google AI Studio đang báo lỗi. Vui lòng kiểm tra API key, quota hoặc model";
    }

    private List<AiChatRequest.AiChatTurn> parseHistory(String historyJson) {
        if (!StringUtils.hasText(historyJson)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(historyJson, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lịch sử chat không hợp lệ");
        }
    }

    private AttachmentContext buildAttachmentContext(List<MultipartFile> files) {
        List<Map<String, Object>> inlineParts = new ArrayList<>();
        StringBuilder extractedText = new StringBuilder();

        for (MultipartFile file : files) {
            validateFile(file);
            String filename = file.getOriginalFilename() == null ? "tep-dinh-kem" : file.getOriginalFilename();
            String mimeType = normalizeMimeType(file);

            try {
                if (isInlineGeminiFile(mimeType)) {
                    inlineParts.add(Map.of("inlineData", Map.of(
                            "mimeType", mimeType,
                            "data", Base64.getEncoder().encodeToString(file.getBytes())
                    )));
                    extractedText.append("\n[Tệp đính kèm: ").append(filename).append(" - ").append(mimeType).append("]");
                } else if (isDocx(filename, mimeType)) {
                    appendExtractedText(extractedText, filename, extractDocxText(file));
                } else if (isSpreadsheet(filename, mimeType)) {
                    appendExtractedText(extractedText, filename, extractSpreadsheetText(file));
                } else if (isTextFile(filename, mimeType)) {
                    appendExtractedText(extractedText, filename, new String(file.getBytes(), StandardCharsets.UTF_8));
                } else {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Chua ho tro loai tệp: " + filename + ". Hay dung anh, PDF, TXT, CSV, MD, DOCX, XLS hoac XLSX"
                    );
                }
            } catch (IOException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được tệp: " + filename);
            }
        }

        return new AttachmentContext(inlineParts, truncate(extractedText.toString(), MAX_EXTRACTED_TEXT_CHARS));
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi tệp đính kèm tối đa 8MB");
        }
    }

    private String normalizeMimeType(MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (filename.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (filename.endsWith(".png")) {
            return "image/png";
        }
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (filename.endsWith(".webp")) {
            return "image/webp";
        }
        if (filename.endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if (filename.endsWith(".xlsx")) {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        if (filename.endsWith(".xls")) {
            return "application/vnd.ms-excel";
        }
        String contentType = file.getContentType();
        if (StringUtils.hasText(contentType)) {
            return contentType;
        }
        return "text/plain";
    }

    private boolean isInlineGeminiFile(String mimeType) {
        return mimeType.startsWith("image/") || "application/pdf".equalsIgnoreCase(mimeType);
    }

    private boolean isDocx(String filename, String mimeType) {
        return filename.toLowerCase().endsWith(".docx")
                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equalsIgnoreCase(mimeType);
    }

    private boolean isSpreadsheet(String filename, String mimeType) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".xlsx")
                || lower.endsWith(".xls")
                || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equalsIgnoreCase(mimeType)
                || "application/vnd.ms-excel".equalsIgnoreCase(mimeType);
    }

    private boolean isTextFile(String filename, String mimeType) {
        String lower = filename.toLowerCase();
        return mimeType.startsWith("text/")
                || lower.endsWith(".txt")
                || lower.endsWith(".md")
                || lower.endsWith(".json")
                || lower.endsWith(".xml")
                || lower.endsWith(".html")
                || lower.endsWith(".htm")
                || lower.endsWith(".srt")
                || lower.endsWith(".csv")
                || lower.endsWith(".tsv");
    }

    private String extractDocxText(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            StringBuilder builder = new StringBuilder();
            document.getParagraphs().forEach(paragraph -> {
                if (StringUtils.hasText(paragraph.getText())) {
                    builder.append(paragraph.getText()).append("\n");
                }
            });
            document.getTables().forEach(table -> table.getRows().forEach(row -> row.getTableCells().forEach(cell -> {
                if (StringUtils.hasText(cell.getText())) {
                    builder.append(cell.getText()).append("\n");
                }
            })));
            return builder.toString();
        }
    }

    private String extractSpreadsheetText(MultipartFile file) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            DataFormatter formatter = new DataFormatter();
            StringBuilder builder = new StringBuilder();
            workbook.forEach(sheet -> {
                builder.append("Sheet: ").append(sheet.getSheetName()).append("\n");
                sheet.forEach(row -> {
                    List<String> cells = new ArrayList<>();
                    row.forEach(cell -> {
                        String value = formatter.formatCellValue(cell).trim();
                        if (StringUtils.hasText(value)) {
                            cells.add(value);
                        }
                    });
                    if (!cells.isEmpty()) {
                        builder.append("Dong ").append(row.getRowNum() + 1).append(": ");
                        builder.append(String.join(" | ", cells)).append("\n");
                    }
                });
            });
            return builder.toString();
        } catch (Exception exception) {
            throw new IOException("Không đọc được file Excel", exception);
        }
    }

    private void appendExtractedText(StringBuilder builder, String filename, String text) {
        builder.append("\n[Tệp đính kèm: ").append(filename).append("]\n");
        builder.append(truncate(text, MAX_EXTRACTED_TEXT_CHARS)).append("\n");
    }

    private String truncate(String text, int maxLength) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String normalized = text.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength - 3) + "...";
    }

    private record AttachmentContext(
            List<Map<String, Object>> inlineParts,
            String extractedText
    ) {
    }

    private record GeminiAnswer(
            String text,
            String model
    ) {
    }
}
