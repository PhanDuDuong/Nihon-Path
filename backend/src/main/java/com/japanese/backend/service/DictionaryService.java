package com.japanese.backend.service;

import com.japanese.backend.dto.DictionaryDtos.*;
import com.japanese.backend.entity.Kanji;
import com.japanese.backend.entity.Vocabulary;
import com.japanese.backend.repository.KanjiRepository;
import com.japanese.backend.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DictionaryService {

    private final VocabularyRepository vocabularyRepository;
    private final KanjiRepository kanjiRepository;

    public SearchResponse search(String q, int limit) {
        String keyword = q == null ? "" : q.trim();
        if (keyword.isEmpty()) {
            return new SearchResponse(List.of(), List.of());
        }

        int resultLimit = Math.max(1, Math.min(limit, 50));
        List<String> searchTerms = expandSearchTerms(keyword);

        Map<Long, VocabularySummary> vocabularies = new LinkedHashMap<>();
        for (String term : searchTerms) {
            vocabularyRepository.searchDictionaryExact(term).stream()
                    .map(this::toVocabularySummary)
                    .forEach(vocabulary -> vocabularies.putIfAbsent(vocabulary.id(), vocabulary));
            if (vocabularies.size() >= resultLimit) {
                break;
            }
        }
        for (String term : searchTerms) {
            vocabularyRepository.searchDictionary(term, PageRequest.of(0, resultLimit)).stream()
                    .map(this::toVocabularySummary)
                    .forEach(vocabulary -> vocabularies.putIfAbsent(vocabulary.id(), vocabulary));
            if (vocabularies.size() >= resultLimit) {
                break;
            }
        }

        Map<Long, KanjiSummary> kanjis = new LinkedHashMap<>();
        for (String term : searchTerms) {
            kanjiRepository.searchDictionaryExact(term).stream()
                    .map(this::toKanjiSummary)
                    .forEach(kanji -> kanjis.putIfAbsent(kanji.id(), kanji));
            if (kanjis.size() >= resultLimit) {
                break;
            }
        }
        for (String term : searchTerms) {
            kanjiRepository.searchDictionary(term, PageRequest.of(0, resultLimit)).stream()
                    .map(this::toKanjiSummary)
                    .forEach(kanji -> kanjis.putIfAbsent(kanji.id(), kanji));
            if (kanjis.size() >= resultLimit) {
                break;
            }
        }

        return new SearchResponse(
                vocabularies.values().stream().limit(resultLimit).toList(),
                kanjis.values().stream().limit(resultLimit).toList()
        );
    }

    public VocabularyDetail getWord(Long id) {
        Vocabulary vocabulary = vocabularyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy từ vựng"));

        List<KanjiSummary> kanjis = relatedKanjis(vocabulary).stream()
                .map(this::toKanjiSummary)
                .toList();

        return new VocabularyDetail(
                vocabulary.getId(),
                vocabulary.getWord(),
                vocabulary.getKanji(),
                vocabulary.getReading(),
                display(vocabulary.getMeaningVi(), "Đang cập nhật nghĩa tiếng Việt"),
                vocabulary.getMeaningEn(),
                display(vocabulary.getWordType(), "Đang cập nhật từ loại"),
                vocabulary.getLevelId(),
                vocabulary.getLessonNote(),
                vocabulary.getIsCommon(),
                vocabulary.getSource(),
                vocabulary.getSourceEntryId(),
                vocabulary.getPriorityTags(),
                List.of(),
                List.of(),
                kanjis
        );
    }

    public KanjiDetail getKanji(String character) {
        String normalizedCharacter = firstCodePoint(character);
        Kanji kanji = kanjiRepository.findByKanjiChar(normalizedCharacter)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kanji"));

        List<VocabularySummary> vocabularies = vocabularyRepository
                .findRelatedToKanji(kanji.getKanjiChar(), -1L, PageRequest.of(0, 20))
                .stream()
                .map(this::toVocabularySummary)
                .toList();

        return new KanjiDetail(
                kanji.getId(),
                kanji.getKanjiChar(),
                display(kanji.getMeaningVi(), "Đang cập nhật nghĩa tiếng Việt"),
                kanji.getHanVietReading(),
                kanji.getMeaningEn(),
                kanji.getOnyomi(),
                kanji.getKunyomi(),
                kanji.getNanori(),
                kanji.getStrokeCount(),
                kanji.getRadical(),
                kanji.getLevelId(),
                kanji.getGrade(),
                kanji.getJlptLegacy(),
                strokeOrderSvgUrl(kanji.getKanjiChar()),
                strokeOrderSvgUrl(kanji.getKanjiChar()),
                strokeOrderGifUrl(kanji.getKanjiChar()),
                kanji.getPenStrokes(),
                kanji.getShape(),
                kanji.getUnicodeCodepoint(),
                kanji.getSource(),
                kanji.getSourceEntryId(),
                vocabularies
        );
    }

    private List<Kanji> relatedKanjis(Vocabulary vocabulary) {
        Set<String> characters = kanjiCharacters(vocabulary.getKanji());
        if (characters.isEmpty()) {
            characters = kanjiCharacters(vocabulary.getWord());
        }
        if (characters.isEmpty()) {
            return List.of();
        }

        Map<String, Kanji> kanjiByCharacter = kanjiRepository.findByKanjiCharIn(characters)
                .stream()
                .collect(Collectors.toMap(Kanji::getKanjiChar, Function.identity(), (left, right) -> left));

        return characters.stream()
                .map(kanjiByCharacter::get)
                .filter(kanji -> kanji != null)
                .toList();
    }

    private Set<String> kanjiCharacters(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        return text.codePoints()
                .filter(codePoint -> Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN)
                .mapToObj(codePoint -> new String(Character.toChars(codePoint)))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private VocabularySummary toVocabularySummary(Vocabulary vocabulary) {
        String meaningVi = display(vocabulary.getMeaningVi(), "Đang cập nhật nghĩa tiếng Việt");
        return new VocabularySummary(
                vocabulary.getId(),
                vocabulary.getWord(),
                vocabulary.getKanji(),
                vocabulary.getReading(),
                meaningVi,
                vocabulary.getMeaningEn(),
                display(vocabulary.getWordType(), "Đang cập nhật từ loại"),
                vocabulary.getLevelId(),
                vocabulary.getIsCommon(),
                vocabulary.getSource(),
                vocabulary.getSourceEntryId(),
                vocabulary.getPriorityTags()
        );
    }

    private KanjiSummary toKanjiSummary(Kanji kanji) {
        String meaningVi = display(kanji.getMeaningVi(), "Đang cập nhật nghĩa tiếng Việt");
        return new KanjiSummary(
                kanji.getId(),
                kanji.getKanjiChar(),
                meaningVi,
                kanji.getHanVietReading(),
                kanji.getMeaningEn(),
                kanji.getOnyomi(),
                kanji.getKunyomi(),
                kanji.getStrokeCount(),
                kanji.getRadical(),
                kanji.getLevelId(),
                strokeOrderSvgUrl(kanji.getKanjiChar()),
                strokeOrderSvgUrl(kanji.getKanjiChar()),
                strokeOrderGifUrl(kanji.getKanjiChar()),
                kanji.getPenStrokes(),
                kanji.getShape(),
                kanji.getUnicodeCodepoint(),
                kanji.getSource(),
                kanji.getSourceEntryId()
        );
    }

    private String strokeOrderSvgUrl(String kanjiChar) {
        if (kanjiChar == null || kanjiChar.isBlank()) {
            return null;
        }
        return "/api/dictionary/kanji/" + kanjiChar + "/stroke-order.svg";
    }

    public String getKanjiStrokeOrderGifUrl(String character) {
        String normalizedCharacter = firstCodePoint(character);
        return kanjiRepository.findByKanjiChar(normalizedCharacter)
                .map(this::databaseStrokeGifUrl)
                .orElseGet(() -> strokeOrderGifRawUrl(normalizedCharacter));
    }

    private String strokeOrderGifUrl(String kanjiChar) {
        if (kanjiChar == null || kanjiChar.isBlank()) {
            return null;
        }
        return "/api/dictionary/kanji/" + kanjiChar + "/stroke-order.gif";
    }

    private String databaseStrokeGifUrl(Kanji kanji) {
        String dbUrl = kanji.getStrokeGifUrl();
        if (dbUrl == null || dbUrl.isBlank()) {
            return strokeOrderGifRawUrl(kanji.getKanjiChar());
        }
        if (dbUrl.startsWith("http://") || dbUrl.startsWith("https://")) {
            return dbUrl;
        }
        if (dbUrl.startsWith("/assets/kanji-gif/")) {
            String fileName = dbUrl.substring(dbUrl.lastIndexOf('/') + 1);
            return "https://raw.githubusercontent.com/jcsirot/kanji.gif/master/kanji/gif/150x150/" + fileName;
        }
        return dbUrl;
    }

    private String strokeOrderGifRawUrl(String kanjiChar) {
        String encodedCharacter = URLEncoder.encode(kanjiChar, StandardCharsets.UTF_8).replace("+", "%20");
        return "https://raw.githubusercontent.com/jcsirot/kanji.gif/master/kanji/gif/150x150/" + encodedCharacter + ".gif";
    }

    public String getKanjiStrokeOrderSvg(String character) {
        String normalizedCharacter = firstCodePoint(character);
        Kanji kanji = kanjiRepository.findByKanjiChar(normalizedCharacter)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kanji"));

        String penStrokes = display(kanji.getPenStrokes(), "Chưa có dữ liệu nét bút");
        String[] strokes = penStrokes.codePoints()
                .mapToObj(codePoint -> new String(Character.toChars(codePoint)))
                .toArray(String[]::new);
        StringBuilder cells = new StringBuilder();
        for (int i = 0; i < Math.min(strokes.length, 36); i++) {
            int x = 28 + (i % 12) * 42;
            int y = 238 + (i / 12) * 42;
            cells.append("<g><rect x=\"").append(x - 16).append("\" y=\"").append(y - 26)
                    .append("\" width=\"34\" height=\"34\" rx=\"6\" fill=\"#eef7f2\" stroke=\"#c9ded5\"/>")
                    .append("<text x=\"").append(x).append("\" y=\"").append(y)
                    .append("\" text-anchor=\"middle\" font-size=\"20\" font-family=\"serif\">")
                    .append(escapeXml(strokes[i])).append("</text>")
                    .append("<text x=\"").append(x).append("\" y=\"").append(y + 14)
                    .append("\" text-anchor=\"middle\" font-size=\"8\" fill=\"#61716d\">")
                    .append(i + 1).append("</text></g>");
        }

        return """
                <svg xmlns="http://www.w3.org/2000/svg" width="560" height="380" viewBox="0 0 560 380" role="img">
                  <rect width="560" height="380" rx="18" fill="#fbfdfc"/>
                  <rect x="20" y="20" width="180" height="180" rx="14" fill="#ffffff" stroke="#d9e3df"/>
                  <text x="110" y="145" text-anchor="middle" font-size="128" font-family="serif" fill="#182321">%s</text>
                  <text x="228" y="58" font-size="18" font-weight="700" fill="#182321">Hướng dẫn nét viết</text>
                  <text x="228" y="88" font-size="14" fill="#61716d">Nguồn: KanjiDictVN PenStrokes</text>
                  <text x="228" y="120" font-size="14" fill="#61716d">Hán Việt: %s</text>
                  <text x="228" y="150" font-size="14" fill="#61716d">Số nét: %s</text>
                  <text x="28" y="222" font-size="13" fill="#61716d">Thứ tự nét bút</text>
                  %s
                </svg>
                """.formatted(
                escapeXml(kanji.getKanjiChar()),
                escapeXml(display(kanji.getHanVietReading(), "Chưa có")),
                kanji.getStrokeCount() == null ? "?" : kanji.getStrokeCount(),
                cells
        );
    }

    private String display(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String firstCodePoint(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kanji không hợp lệ");
        }
        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFKC);
        int codePoint = normalized.codePointAt(0);
        return new String(Character.toChars(codePoint));
    }

    private List<String> expandSearchTerms(String keyword) {
        List<String> terms = new ArrayList<>();
        addTerm(terms, keyword);

        String normalized = Normalizer.normalize(keyword, Normalizer.Form.NFKC);
        addTerm(terms, normalized);
        addTerm(terms, katakanaToHiragana(normalized));
        addTerm(terms, hiraganaToKatakana(normalized));

        String romaji = normalizeRomaji(normalized);
        if (romaji.matches("[a-zA-Z\\-\\s']+")) {
            String hiragana = romajiToHiragana(romaji);
            addTerm(terms, hiragana);
            addTerm(terms, hiraganaToKatakana(hiragana));
        }

        return terms;
    }

    private void addTerm(List<String> terms, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        String trimmed = value.trim();
        if (!terms.contains(trimmed)) {
            terms.add(trimmed);
        }
    }

    private String normalizeRomaji(String value) {
        String expandedLongVowels = value
                .replace("ā", "aa").replace("Ā", "aa")
                .replace("ī", "ii").replace("Ī", "ii")
                .replace("ū", "uu").replace("Ū", "uu")
                .replace("ē", "ee").replace("Ē", "ee")
                .replace("ō", "ou").replace("Ō", "ou")
                .replace("ô", "ou").replace("Ô", "ou")
                .replace("â", "aa").replace("Â", "aa")
                .replace("ê", "ee").replace("Ê", "ee")
                .replace("û", "uu").replace("Û", "uu")
                .replace("î", "ii").replace("Î", "ii");
        return Normalizer.normalize(expandedLongVowels, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    private String hiraganaToKatakana(String value) {
        StringBuilder result = new StringBuilder();
        value.codePoints().forEach(codePoint -> {
            if (codePoint >= 0x3041 && codePoint <= 0x3096) {
                result.appendCodePoint(codePoint + 0x60);
            } else {
                result.appendCodePoint(codePoint);
            }
        });
        return result.toString();
    }

    private String katakanaToHiragana(String value) {
        StringBuilder result = new StringBuilder();
        value.codePoints().forEach(codePoint -> {
            if (codePoint >= 0x30A1 && codePoint <= 0x30F6) {
                result.appendCodePoint(codePoint - 0x60);
            } else {
                result.appendCodePoint(codePoint);
            }
        });
        return result.toString();
    }

    private String romajiToHiragana(String raw) {
        String text = normalizeRomaji(raw)
                .replaceAll("[\\s\\-']", "")
                .replace("ltsu", "xtsu");
        StringBuilder result = new StringBuilder();
        int index = 0;
        while (index < text.length()) {
            if (index + 1 < text.length()
                    && text.charAt(index) == text.charAt(index + 1)
                    && isConsonant(text.charAt(index))
                    && text.charAt(index) != 'n') {
                result.append("っ");
                index++;
                continue;
            }

            String match = null;
            for (int length = Math.min(4, text.length() - index); length > 0; length--) {
                String chunk = text.substring(index, index + length);
                if (ROMAJI_TO_HIRAGANA.containsKey(chunk)) {
                    match = chunk;
                    break;
                }
            }

            if (match != null) {
                result.append(ROMAJI_TO_HIRAGANA.get(match));
                index += match.length();
            } else if (text.charAt(index) == 'n') {
                result.append("ん");
                index++;
            } else {
                result.append(text.charAt(index));
                index++;
            }
        }
        return result.toString();
    }

    private boolean isConsonant(char value) {
        return "bcdfghjklmnpqrstvwxyz".indexOf(value) >= 0;
    }

    private static final Map<String, String> ROMAJI_TO_HIRAGANA = Map.ofEntries(
            Map.entry("a", "あ"), Map.entry("i", "い"), Map.entry("u", "う"), Map.entry("e", "え"), Map.entry("o", "お"),
            Map.entry("ka", "か"), Map.entry("ki", "き"), Map.entry("ku", "く"), Map.entry("ke", "け"), Map.entry("ko", "こ"),
            Map.entry("kya", "きゃ"), Map.entry("kyu", "きゅ"), Map.entry("kyo", "きょ"),
            Map.entry("sa", "さ"), Map.entry("shi", "し"), Map.entry("si", "し"), Map.entry("su", "す"), Map.entry("se", "せ"), Map.entry("so", "そ"),
            Map.entry("sha", "しゃ"), Map.entry("shu", "しゅ"), Map.entry("sho", "しょ"),
            Map.entry("ta", "た"), Map.entry("chi", "ち"), Map.entry("ti", "ち"), Map.entry("tsu", "つ"), Map.entry("tu", "つ"), Map.entry("te", "て"), Map.entry("to", "と"),
            Map.entry("cha", "ちゃ"), Map.entry("chu", "ちゅ"), Map.entry("cho", "ちょ"),
            Map.entry("na", "な"), Map.entry("ni", "に"), Map.entry("nu", "ぬ"), Map.entry("ne", "ね"), Map.entry("no", "の"),
            Map.entry("nya", "にゃ"), Map.entry("nyu", "にゅ"), Map.entry("nyo", "にょ"),
            Map.entry("ha", "は"), Map.entry("hi", "ひ"), Map.entry("fu", "ふ"), Map.entry("hu", "ふ"), Map.entry("he", "へ"), Map.entry("ho", "ほ"),
            Map.entry("hya", "ひゃ"), Map.entry("hyu", "ひゅ"), Map.entry("hyo", "ひょ"),
            Map.entry("ma", "ま"), Map.entry("mi", "み"), Map.entry("mu", "む"), Map.entry("me", "め"), Map.entry("mo", "も"),
            Map.entry("mya", "みゃ"), Map.entry("myu", "みゅ"), Map.entry("myo", "みょ"),
            Map.entry("ya", "や"), Map.entry("yu", "ゆ"), Map.entry("yo", "よ"),
            Map.entry("ra", "ら"), Map.entry("ri", "り"), Map.entry("ru", "る"), Map.entry("re", "れ"), Map.entry("ro", "ろ"),
            Map.entry("rya", "りゃ"), Map.entry("ryu", "りゅ"), Map.entry("ryo", "りょ"),
            Map.entry("wa", "わ"), Map.entry("wo", "を"), Map.entry("n", "ん"),
            Map.entry("ga", "が"), Map.entry("gi", "ぎ"), Map.entry("gu", "ぐ"), Map.entry("ge", "げ"), Map.entry("go", "ご"),
            Map.entry("gya", "ぎゃ"), Map.entry("gyu", "ぎゅ"), Map.entry("gyo", "ぎょ"),
            Map.entry("za", "ざ"), Map.entry("ji", "じ"), Map.entry("zi", "じ"), Map.entry("zu", "ず"), Map.entry("ze", "ぜ"), Map.entry("zo", "ぞ"),
            Map.entry("ja", "じゃ"), Map.entry("ju", "じゅ"), Map.entry("jo", "じょ"),
            Map.entry("da", "だ"), Map.entry("di", "ぢ"), Map.entry("du", "づ"), Map.entry("de", "で"), Map.entry("do", "ど"),
            Map.entry("ba", "ば"), Map.entry("bi", "び"), Map.entry("bu", "ぶ"), Map.entry("be", "べ"), Map.entry("bo", "ぼ"),
            Map.entry("bya", "びゃ"), Map.entry("byu", "びゅ"), Map.entry("byo", "びょ"),
            Map.entry("pa", "ぱ"), Map.entry("pi", "ぴ"), Map.entry("pu", "ぷ"), Map.entry("pe", "ぺ"), Map.entry("po", "ぽ"),
            Map.entry("pya", "ぴゃ"), Map.entry("pyu", "ぴゅ"), Map.entry("pyo", "ぴょ"),
            Map.entry("va", "ゔぁ"), Map.entry("vi", "ゔぃ"), Map.entry("vu", "ゔ"), Map.entry("ve", "ゔぇ"), Map.entry("vo", "ゔぉ"),
            Map.entry("xtsu", "っ"), Map.entry("la", "ぁ"), Map.entry("li", "ぃ"), Map.entry("lu", "ぅ"), Map.entry("le", "ぇ"), Map.entry("lo", "ぉ")
    );

}
