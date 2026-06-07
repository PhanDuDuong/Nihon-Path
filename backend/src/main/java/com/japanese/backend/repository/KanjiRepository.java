package com.japanese.backend.repository;

import com.japanese.backend.entity.Kanji;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface KanjiRepository extends JpaRepository<Kanji, Long> {

    List<Kanji> findByKanjiCharContaining(String keyword);

    Optional<Kanji> findByKanjiChar(String kanjiChar);

    List<Kanji> findByKanjiCharIn(Set<String> kanjiChars);

    List<Kanji> findByMeaningViContainingIgnoreCase(String keyword);

    @Query(value = """
            select *
            from chu_han k
            where binary k.ky_tu = binary :q
               or binary k.onyomi = binary :q
               or binary k.kunyomi = binary :q
               or binary coalesce(k.nanori, '') = binary :q
               or binary coalesce(k.ma_muc_nguon, '') = binary :q
               or binary coalesce(k.am_han_viet, '') like concat('%', binary :q, '%')
               or binary coalesce(k.nghia_en, '') like concat('%', binary :q, '%')
               or binary coalesce(k.nghia_vi, '') like concat('%', binary :q, '%')
            order by k.cap_nhat_luc desc
            limit 20
            """, nativeQuery = true)
    List<Kanji> searchDictionaryExact(@Param("q") String q);

    @Query("""
            select k from Kanji k
            where k.kanjiChar like concat('%', :q, '%')
               or k.onyomi like concat('%', :q, '%')
               or k.kunyomi like concat('%', :q, '%')
               or k.nanori like concat('%', :q, '%')
               or lower(coalesce(k.sourceEntryId, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(k.hanVietReading, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(k.meaningEn, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(k.meaningVi, '')) like lower(concat('%', :q, '%'))
            order by k.updatedAt desc
            """)
    List<Kanji> searchDictionary(@Param("q") String q, Pageable pageable);

    @Query("""
            select k from Kanji k
            where (:levelId is null or k.levelId = :levelId)
              and (
                   :q is null
                or k.kanjiChar like concat('%', :q, '%')
                or k.onyomi like concat('%', :q, '%')
                or k.kunyomi like concat('%', :q, '%')
                or lower(coalesce(k.hanVietReading, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(k.meaningVi, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(k.meaningEn, '')) like lower(concat('%', :q, '%'))
              )
            order by coalesce(k.updatedAt, k.createdAt) desc, k.id desc
            """)
    Page<Kanji> searchAdmin(@Param("q") String q, @Param("levelId") Long levelId, Pageable pageable);
}
