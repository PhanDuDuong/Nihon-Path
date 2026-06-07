package com.japanese.backend.importer;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.xml.sax.Attributes;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import javax.xml.parsers.SAXParserFactory;
import java.io.BufferedInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(1)
@RequiredArgsConstructor
public class DictionaryImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DictionaryImportRunner.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${dictionary.import:false}")
    private boolean importEnabled;

    @Value("${dictionary.import.force:false}")
    private boolean forceImport;

    @Value("${dictionary.import.min-vocabularies:100000}")
    private int minImportedVocabularies;

    @Value("${dictionary.import.min-kanjis:10000}")
    private int minImportedKanjis;

    @Value("${dictionary.jmdict-path:data/dictionary/JMdict_e}")
    private String jmdictPath;

    @Value("${dictionary.kanjidic-path:data/dictionary/kanjidic2.xml}")
    private String kanjidicPath;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!importEnabled) {
            return;
        }

        if (!forceImport && dictionaryAlreadyImported()) {
            log.info("Dictionary XML import skipped: JMDICT and KANJIDIC2 data already exist.");
            return;
        }

        DictionaryXmlImporter importer = new DictionaryXmlImporter(jdbcTemplate);
        importer.importKanjidic(resolveDictionaryPath(kanjidicPath));
        importer.importJmdict(resolveDictionaryPath(jmdictPath));
    }

    private boolean dictionaryAlreadyImported() {
        Integer jmdictCount = jdbcTemplate.queryForObject(
                "select count(*) from tu_vung where nguon = 'JMDICT'",
                Integer.class
        );
        Integer kanjidicCount = jdbcTemplate.queryForObject(
                "select count(*) from chu_han",
                Integer.class
        );
        return Objects.requireNonNullElse(jmdictCount, 0) >= minImportedVocabularies
                && Objects.requireNonNullElse(kanjidicCount, 0) >= minImportedKanjis;
    }

    private Path resolveDictionaryPath(String configuredPath) {
        Path path = Path.of(configuredPath);
        if (Files.exists(path)) {
            return path;
        }

        Path parentPath = Path.of("..").resolve(configuredPath).normalize();
        if (Files.exists(parentPath)) {
            return parentPath;
        }

        return path;
    }

    private static final class DictionaryXmlImporter {

        private final JdbcTemplate jdbcTemplate;

        private DictionaryXmlImporter(JdbcTemplate jdbcTemplate) {
            this.jdbcTemplate = jdbcTemplate;
        }

        private void importKanjidic(Path path) throws Exception {
            parse(path, new KanjidicHandler(jdbcTemplate));
        }

        private void importJmdict(Path path) throws Exception {
            parse(path, new JmdictHandler(jdbcTemplate));
        }

        private void parse(Path path, DefaultHandler handler) throws Exception {
            System.setProperty("jdk.xml.entityExpansionLimit", "0");
            SAXParserFactory factory = SAXParserFactory.newInstance();
            factory.setNamespaceAware(false);
            try (InputStream inputStream = new BufferedInputStream(Files.newInputStream(path))) {
                factory.newSAXParser().parse(new InputSource(inputStream), handler);
            }
        }

    }

    private static final class JmdictHandler extends DefaultHandler {

        private final JdbcTemplate jdbcTemplate;
        private final StringBuilder text = new StringBuilder();
        private JmdictEntry entry;
        private Sense sense;
        private String parent = "";
        private long count = 0;

        private JmdictHandler(JdbcTemplate jdbcTemplate) {
            this.jdbcTemplate = jdbcTemplate;
        }

        @Override
        public void startElement(String uri, String localName, String qName, Attributes attributes) {
            text.setLength(0);
            if ("entry".equals(qName)) {
                entry = new JmdictEntry();
            } else if ("sense".equals(qName)) {
                sense = new Sense();
            } else if ("k_ele".equals(qName) || "r_ele".equals(qName)) {
                parent = qName;
            }
        }

        @Override
        public void characters(char[] ch, int start, int length) {
            text.append(ch, start, length);
        }

        @Override
        public void skippedEntity(String name) {
            text.append('&').append(name).append(';');
        }

        @Override
        public void endElement(String uri, String localName, String qName) {
            String value = text.toString().trim();
            if (entry != null && !value.isEmpty()) {
                switch (qName) {
                    case "ent_seq" -> entry.entSeq = value;
                    case "keb" -> entry.kebs.add(value);
                    case "reb" -> entry.rebs.add(value);
                    case "ke_pri", "re_pri" -> entry.priorityTags.add(value);
                    case "pos" -> {
                        if (sense != null) {
                            sense.partsOfSpeech.add(cleanEntity(value));
                        }
                    }
                    case "field" -> {
                        if (sense != null) {
                            sense.fields.add(cleanEntity(value));
                        }
                    }
                    case "misc" -> {
                        if (sense != null) {
                            sense.misc.add(cleanEntity(value));
                        }
                    }
                    case "gloss" -> {
                        if (sense != null) {
                            sense.glosses.add(value);
                        }
                    }
                    default -> {
                    }
                }
            }

            if ("sense".equals(qName) && entry != null && sense != null) {
                entry.senses.add(sense);
                sense = null;
            } else if ("entry".equals(qName) && entry != null) {
                saveEntry(entry);
                count++;
                if (count % 10000 == 0) {
                    log.info("Imported JMdict entries: {}", count);
                }
                entry = null;
            } else if ("k_ele".equals(qName) || "r_ele".equals(qName)) {
                parent = "";
            }

            text.setLength(0);
        }

        private void saveEntry(JmdictEntry source) {
            if (source.entSeq == null || source.rebs.isEmpty()) {
                return;
            }

            String kanji = source.kebs.isEmpty() ? null : source.kebs.get(0);
            String reading = source.rebs.get(0);
            String word = kanji != null ? kanji : reading;
            List<String> meanings = source.senses.stream()
                    .flatMap(s -> s.glosses.stream())
                    .filter(s -> !s.isBlank())
                    .distinct()
                    .toList();
            String meaningEn = join(meanings, "; ", 6000);
            String wordType = source.senses.stream()
                    .flatMap(s -> s.partsOfSpeech.stream())
                    .filter(s -> !s.isBlank())
                    .findFirst()
                    .orElse("unknown");
            wordType = truncate(wordType, 50);
            String priorityTags = join(new ArrayList<>(source.priorityTags), ",", 255);
            boolean isCommon = source.priorityTags.stream()
                    .anyMatch(tag -> tag.startsWith("news1") || tag.startsWith("ichi1") || tag.startsWith("spec1") || tag.startsWith("gai1"));
            String searchText = join(List.of(word, Objects.toString(kanji, ""), reading, meaningEn), " ", 6000);
            word = truncate(word, 100);
            kanji = truncate(kanji, 100);
            reading = truncate(reading, 100);

            jdbcTemplate.update("""
                    insert into tu_vung
                    (tu, kanji, cach_doc, nghia_vi, nghia_en, loai_tu, cap_do_id, nguon, ma_muc_nguon,
                     thong_dung, the_uu_tien, noi_dung_tim_kiem, tao_luc, cap_nhat_luc)
                    values (?, ?, ?, ?, ?, ?, 1, 'JMDICT', ?, ?, ?, ?, now(), now())
                    on duplicate key update
                        tu = values(tu),
                        kanji = values(kanji),
                        cach_doc = values(cach_doc),
                        nghia_vi = if(nghia_vi is null or nghia_vi = '', values(nghia_vi), nghia_vi),
                        nghia_en = values(nghia_en),
                        loai_tu = values(loai_tu),
                        thong_dung = values(thong_dung),
                        the_uu_tien = values(the_uu_tien),
                        noi_dung_tim_kiem = values(noi_dung_tim_kiem),
                        cap_nhat_luc = now()
                    """,
                    word,
                    kanji,
                    reading,
                    null,
                    meaningEn,
                    wordType,
                    source.entSeq,
                    isCommon,
                    priorityTags,
                    searchText
            );

        }

        private String cleanEntity(String value) {
            if (value.startsWith("&") && value.endsWith(";")) {
                return value.substring(1, value.length() - 1);
            }
            return value;
        }
    }

    private static final class KanjidicHandler extends DefaultHandler {

        private final JdbcTemplate jdbcTemplate;
        private final StringBuilder text = new StringBuilder();
        private KanjiEntry entry;
        private String readingType;
        private boolean englishMeaning;
        private long count = 0;

        private KanjidicHandler(JdbcTemplate jdbcTemplate) {
            this.jdbcTemplate = jdbcTemplate;
        }

        @Override
        public void startElement(String uri, String localName, String qName, Attributes attributes) {
            text.setLength(0);
            if ("character".equals(qName)) {
                entry = new KanjiEntry();
            } else if ("rad_value".equals(qName)) {
                entry.radicalType = attributes.getValue("rad_type");
            } else if ("reading".equals(qName)) {
                readingType = attributes.getValue("r_type");
            } else if ("meaning".equals(qName)) {
                englishMeaning = attributes.getValue("m_lang") == null;
            }
        }

        @Override
        public void characters(char[] ch, int start, int length) {
            text.append(ch, start, length);
        }

        @Override
        public void endElement(String uri, String localName, String qName) {
            String value = text.toString().trim();
            if (entry != null && !value.isEmpty()) {
                switch (qName) {
                    case "literal" -> entry.character = value;
                    case "rad_value" -> {
                        if ("classical".equals(entry.radicalType) && entry.radical == null) {
                            entry.radical = value;
                        }
                    }
                    case "rad_name" -> entry.radicalNames.add(value);
                    case "grade" -> entry.grade = parseInteger(value);
                    case "stroke_count" -> {
                        if (entry.strokeCount == null) {
                            entry.strokeCount = parseInteger(value);
                        }
                    }
                    case "jlpt" -> entry.jlpt = value;
                    case "reading" -> {
                        if ("ja_on".equals(readingType)) {
                            entry.onyomi.add(value);
                        } else if ("ja_kun".equals(readingType)) {
                            entry.kunyomi.add(value);
                        }
                    }
                    case "meaning" -> {
                        if (englishMeaning) {
                            entry.meanings.add(value);
                        }
                    }
                    case "nanori" -> entry.nanori.add(value);
                    default -> {
                    }
                }
            }

            if ("character".equals(qName) && entry != null) {
                saveEntry(entry);
                count++;
                if (count % 1000 == 0) {
                    log.info("Imported KANJIDIC2 characters: {}", count);
                }
                entry = null;
            } else if ("reading".equals(qName)) {
                readingType = null;
            } else if ("meaning".equals(qName)) {
                englishMeaning = false;
            }

            text.setLength(0);
        }

        private void saveEntry(KanjiEntry source) {
            if (source.character == null || source.strokeCount == null) {
                return;
            }
            String meaningEn = join(source.meanings, "; ", 6000);
            String radical = firstOrDefault(source.radicalNames, source.radical);
            jdbcTemplate.update("""
                    insert into chu_han
                    (ky_tu, nghia_vi, nghia_en, onyomi, kunyomi, so_net, bo_thu,
                     cap_do_id, nguon, ma_muc_nguon, nanori, jlpt_cu, lop_hoc, tao_luc, cap_nhat_luc)
                    values (?, ?, ?, ?, ?, ?, ?, ?, 'KANJIDIC2', ?, ?, ?, ?, now(), now())
                    on duplicate key update
                        nghia_vi = if(nghia_vi is null or nghia_vi = '', values(nghia_vi), nghia_vi),
                        nghia_en = values(nghia_en),
                        onyomi = values(onyomi),
                        kunyomi = values(kunyomi),
                        so_net = values(so_net),
                        bo_thu = values(bo_thu),
                        nguon = values(nguon),
                        ma_muc_nguon = values(ma_muc_nguon),
                        nanori = values(nanori),
                        jlpt_cu = values(jlpt_cu),
                        lop_hoc = values(lop_hoc),
                        cap_nhat_luc = now()
                    """,
                    source.character,
                    null,
                    meaningEn,
                    join(source.onyomi, ", ", 255),
                    join(source.kunyomi, ", ", 255),
                    source.strokeCount,
                    radical,
                    mapJlptLevelId(source.jlpt),
                    source.character,
                    join(source.nanori, ", ", 255),
                    source.jlpt,
                    source.grade
            );
        }
    }

    private static final class JmdictEntry {
        private String entSeq;
        private final List<String> kebs = new ArrayList<>();
        private final List<String> rebs = new ArrayList<>();
        private final Set<String> priorityTags = new LinkedHashSet<>();
        private final List<Sense> senses = new ArrayList<>();
    }

    private static final class Sense {
        private final List<String> glosses = new ArrayList<>();
        private final List<String> partsOfSpeech = new ArrayList<>();
        private final List<String> fields = new ArrayList<>();
        private final List<String> misc = new ArrayList<>();
    }

    private static final class KanjiEntry {
        private String character;
        private String radical;
        private String radicalType;
        private Integer strokeCount;
        private Integer grade;
        private String jlpt;
        private final List<String> meanings = new ArrayList<>();
        private final List<String> radicalNames = new ArrayList<>();
        private final List<String> onyomi = new ArrayList<>();
        private final List<String> kunyomi = new ArrayList<>();
        private final List<String> nanori = new ArrayList<>();
    }

    private static Integer parseInteger(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static long mapJlptLevelId(String jlpt) {
        if (jlpt == null) {
            return 1L;
        }
        return switch (jlpt) {
            case "4" -> 1L;
            case "3" -> 2L;
            case "2" -> 3L;
            case "1" -> 4L;
            default -> 1L;
        };
    }

    private static String firstOrDefault(List<String> values, String fallback) {
        return values.stream().filter(value -> !value.isBlank()).findFirst().orElse(fallback);
    }

    private static String join(List<String> values, String delimiter, int maxLength) {
        String joined = values.stream()
                .filter(Objects::nonNull)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.joining(delimiter));
        if (joined.length() <= maxLength) {
            return joined;
        }
        return joined.substring(0, maxLength);
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
