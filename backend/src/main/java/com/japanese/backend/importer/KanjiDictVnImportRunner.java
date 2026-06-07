package com.japanese.backend.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Component
@Order(2)
@RequiredArgsConstructor
public class KanjiDictVnImportRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${dictionary.kanjidictvn.enabled:true}")
    private boolean enabled;

    @Value("${dictionary.kanjidictvn-path:data/dictionary/kanjidictvn/out_vn}")
    private String dataPath;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            return;
        }

        ensureColumns();
        Path directory = resolveDataPath();
        if (!Files.isDirectory(directory)) {
            System.out.printf("KanjiDictVN import skipped: directory not found %s%n", directory.toAbsolutePath());
            return;
        }

        List<Path> banks;
        try (Stream<Path> stream = Files.list(directory)) {
            banks = stream
                    .filter(path -> path.getFileName().toString().matches("kanji_bank_\\d+\\.json"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
        }

        int updates = 0;
        for (Path bank : banks) {
            updates += importBank(bank);
        }

        if (updates > 0) {
            System.out.printf("KanjiDictVN import completed: %d kanji rows updated.%n", updates);
        }
    }

    private Path resolveDataPath() {
        Path path = Path.of(dataPath);
        if (Files.exists(path)) {
            return path;
        }

        Path parentPath = Path.of("..").resolve(dataPath).normalize();
        if (Files.exists(parentPath)) {
            return parentPath;
        }

        return path;
    }

    private void ensureColumns() {
        jdbcTemplate.execute("alter table chu_han modify column nghia_vi text null");
        addColumnIfMissing("am_han_viet", "varchar(255) null");
        addColumnIfMissing("du_lieu_net_but", "text null");
        addColumnIfMissing("hinh_dang", "text null");
        addColumnIfMissing("ma_unicode", "varchar(32) null");
    }

    private void addColumnIfMissing(String columnName, String definition) {
        Integer count = jdbcTemplate.queryForObject("""
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'chu_han'
                          and column_name = ?
                        """,
                Integer.class,
                columnName
        );
        if (count != null && count == 0) {
            jdbcTemplate.execute("alter table chu_han add column " + columnName + " " + definition);
        }
    }

    private int importBank(Path bank) throws Exception {
        JsonNode rows = objectMapper.readTree(bank.toFile());
        List<Object[]> batch = new ArrayList<>();
        for (JsonNode row : rows) {
            String character = text(row.get(0));
            if (!StringUtils.hasText(character)) {
                continue;
            }

            String hanViet = text(row.get(1));
            String meaningVi = meanings(row.get(4));
            JsonNode tags = row.get(5);
            Integer strokeCount = intTag(tags, "Strokes");
            String radical = textTag(tags, "Radical");
            String penStrokes = textTag(tags, "PenStrokes");
            String shape = textTag(tags, "Shape");
            String unicode = textTag(tags, "Unicode");

            batch.add(new Object[]{
                    blankToNull(meaningVi),
                    blankToNull(hanViet),
                    strokeCount,
                    blankToNull(radical),
                    blankToNull(penStrokes),
                    blankToNull(shape),
                    blankToNull(unicode),
                    "KanjiDictVN",
                    character
            });
        }

        int total = 0;
        for (int start = 0; start < batch.size(); start += 500) {
            List<Object[]> slice = batch.subList(start, Math.min(start + 500, batch.size()));
            int[] counts = jdbcTemplate.batchUpdate("""
                    update chu_han
                    set nghia_vi = coalesce(?, nghia_vi),
                        am_han_viet = coalesce(?, am_han_viet),
                        so_net = coalesce(?, so_net),
                        bo_thu = coalesce(?, bo_thu),
                        du_lieu_net_but = coalesce(?, du_lieu_net_but),
                        hinh_dang = coalesce(?, hinh_dang),
                        ma_unicode = coalesce(?, ma_unicode),
                        nguon = coalesce(?, nguon),
                        cap_nhat_luc = now()
                    where ky_tu = ?
                    """, slice);
            for (int count : counts) {
                total += Math.max(count, 0);
            }
        }
        return total;
    }

    private String meanings(JsonNode node) {
        if (node == null || !node.isArray()) {
            return null;
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : node) {
            String value = text(item);
            if (StringUtils.hasText(value)) {
                values.add(value.trim());
            }
        }
        return String.join("; ", values);
    }

    private Integer intTag(JsonNode tags, String field) {
        String value = textTag(tags, field);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String textTag(JsonNode tags, String field) {
        if (tags == null || tags.get(field) == null) {
            return null;
        }
        return text(tags.get(field));
    }

    private String text(JsonNode node) {
        return node == null || node.isNull() ? null : node.asText();
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
