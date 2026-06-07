package com.japanese.backend.repository;

import com.japanese.backend.entity.Vocabulary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    List<Vocabulary> findByWordContainingIgnoreCase(String keyword);

    List<Vocabulary> findByMeaningViContainingIgnoreCase(String keyword);

    @Query(value = """
            select *
            from tu_vung v
            where binary v.tu = binary :q
               or binary v.kanji = binary :q
               or binary v.cach_doc = binary :q
               or binary coalesce(v.ma_muc_nguon, '') = binary :q
               or binary coalesce(v.nghia_en, '') like concat('%', binary :q, '%')
               or binary coalesce(v.nghia_vi, '') like concat('%', binary :q, '%')
            order by v.thong_dung desc, v.cap_nhat_luc desc
            limit 20
            """, nativeQuery = true)
    List<Vocabulary> searchDictionaryExact(@Param("q") String q);

    @Query("""
            select v from Vocabulary v
            where v.word like concat('%', :q, '%')
               or v.kanji like concat('%', :q, '%')
               or v.reading like concat('%', :q, '%')
               or lower(coalesce(v.meaningEn, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(v.meaningVi, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(v.sourceEntryId, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(v.priorityTags, '')) like lower(concat('%', :q, '%'))
               or lower(coalesce(v.searchText, '')) like lower(concat('%', :q, '%'))
            order by coalesce(v.isCommon, false) desc, v.updatedAt desc
            """)
    List<Vocabulary> searchDictionary(@Param("q") String q, Pageable pageable);

    @Query("""
            select v from Vocabulary v
            where v.id <> :excludedId
              and (
                   v.kanji like concat('%', :kanjiChar, '%')
                or v.word like concat('%', :kanjiChar, '%')
              )
            order by coalesce(v.isCommon, false) desc, v.updatedAt desc
            """)
    List<Vocabulary> findRelatedToKanji(
            @Param("kanjiChar") String kanjiChar,
            @Param("excludedId") Long excludedId,
            Pageable pageable
    );

    @Query("""
            select v from Vocabulary v
            where (:levelId is null or v.levelId = :levelId)
              and (:lesson is null or lower(coalesce(v.lessonNote, '')) like lower(concat('%', :lesson, '%')))
              and (
                   :q is null
                or v.word like concat('%', :q, '%')
                or v.kanji like concat('%', :q, '%')
                or v.reading like concat('%', :q, '%')
                or lower(coalesce(v.meaningVi, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(v.meaningEn, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(v.searchText, '')) like lower(concat('%', :q, '%'))
              )
            order by coalesce(v.updatedAt, v.createdAt) desc, v.id desc
            """)
    Page<Vocabulary> searchAdmin(
            @Param("q") String q,
            @Param("levelId") Long levelId,
            @Param("lesson") String lesson,
            Pageable pageable
    );
}
