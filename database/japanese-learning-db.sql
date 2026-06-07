SET FOREIGN_KEY_CHECKS = 0;

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table_name
           AND COLUMN_NAME = p_column_name
    ) THEN
        SET @add_column_sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_definition);
        PREPARE add_column_stmt FROM @add_column_sql;
        EXECUTE add_column_stmt;
        DEALLOCATE PREPARE add_column_stmt;
    END IF;
END $$

DELIMITER ;

CALL add_column_if_missing('exercise_sets', 'cau_hoi_json', 'JSON NULL');

UPDATE exercise_sets es
SET cau_hoi_json = (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', q.id,
            'questionText', q.question_text,
            'questionOrder', q.question_order,
            'explanation', q.explanation,
            'choices', COALESCE((
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', c.id,
                        'choiceText', c.choice_text,
                        'isCorrect', c.is_correct + 0,
                        'choiceOrder', c.choice_order
                    )
                )
                FROM exercise_choices c
                WHERE c.question_id = q.id
            ), JSON_ARRAY())
        )
    )
    FROM exercise_questions q
    WHERE q.exercise_set_id = es.id
);

CALL add_column_if_missing('exam_sets', 'cau_truc_json', 'JSON NULL');
CALL add_column_if_missing('exam_sets', 'cau_hoi_json', 'JSON NULL');

UPDATE exam_sets es
SET cau_truc_json = (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', s.id,
            'title', s.title,
            'type', s.type,
            'durationMinutes', s.duration_minutes,
            'orderIndex', s.order_index,
            'allowBack', s.allow_back + 0,
            'allowEarlySubmit', s.allow_early_submit + 0,
            'autoSubmit', s.auto_submit + 0,
            'scored', s.scored + 0,
            'instruction', s.instruction,
            'parts', COALESCE((
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', p.id,
                        'title', p.title,
                        'instruction', p.instruction,
                        'questionType', p.question_type,
                        'scorePerQuestion', p.score_per_question,
                        'orderIndex', p.order_index,
                        'sharedPassage', p.shared_passage + 0,
                        'sharedAudio', p.shared_audio + 0,
                        'sharedImage', p.shared_image + 0,
                        'groups', COALESCE((
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', g.id,
                                    'title', g.title,
                                    'passageText', g.passage_text,
                                    'passageImage', g.passage_image,
                                    'audioFile', g.audio_file,
                                    'transcript', g.transcript,
                                    'audioPlayLimit', g.audio_play_limit,
                                    'questionVisibility', g.question_visibility,
                                    'orderIndex', g.order_index,
                                    'questions', COALESCE((
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'id', q.id,
                                                'sectionType', q.section_type,
                                                'mondai', q.mondai,
                                                'questionType', q.question_type,
                                                'questionText', q.question_text,
                                                'underlinedText', q.underlined_text,
                                                'imageUrl', q.image_url,
                                                'passageImageUrl', q.passage_image_url,
                                                'audioFile', q.audio_file,
                                                'audioStartSec', q.audio_start_sec,
                                                'audioEndSec', q.audio_end_sec,
                                                'questionOrder', q.question_order,
                                                'score', q.score,
                                                'correctAnswer', q.correct_answer,
                                                'explanation', q.explanation,
                                                'translation', q.translation,
                                                'choices', COALESCE((
                                                    SELECT JSON_ARRAYAGG(
                                                        JSON_OBJECT(
                                                            'id', c.id,
                                                            'choiceText', c.choice_text,
                                                            'label', c.label,
                                                            'image', c.image,
                                                            'isCorrect', c.is_correct + 0,
                                                            'choiceOrder', c.choice_order
                                                        )
                                                    )
                                                    FROM exam_choices c
                                                    WHERE c.question_id = q.id
                                                ), JSON_ARRAY())
                                            )
                                        )
                                        FROM exam_questions q
                                        WHERE q.group_id = g.id
                                    ), JSON_ARRAY())
                                )
                            )
                            FROM question_groups g
                            WHERE g.part_id = p.id
                        ), JSON_ARRAY())
                    )
                )
                FROM exam_parts p
                WHERE p.section_id = s.id
            ), JSON_ARRAY())
        )
    )
    FROM exam_sections s
    WHERE s.exam_set_id = es.id
);

UPDATE exam_sets es
SET cau_hoi_json = (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', q.id,
            'sectionType', q.section_type,
            'mondai', q.mondai,
            'questionType', q.question_type,
            'questionText', q.question_text,
            'underlinedText', q.underlined_text,
            'imageUrl', q.image_url,
            'passageImageUrl', q.passage_image_url,
            'audioFile', q.audio_file,
            'audioStartSec', q.audio_start_sec,
            'audioEndSec', q.audio_end_sec,
            'questionOrder', q.question_order,
            'score', q.score,
            'correctAnswer', q.correct_answer,
            'explanation', q.explanation,
            'translation', q.translation,
            'choices', COALESCE((
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', c.id,
                        'choiceText', c.choice_text,
                        'label', c.label,
                        'image', c.image,
                        'isCorrect', c.is_correct + 0,
                        'choiceOrder', c.choice_order
                    )
                )
                FROM exam_choices c
                WHERE c.question_id = q.id
            ), JSON_ARRAY())
        )
    )
    FROM exam_questions q
    WHERE q.exam_set_id = es.id
      AND q.group_id IS NULL
);

CALL add_column_if_missing('exam_attempts', 'answers_json', 'JSON NULL');

UPDATE exam_attempts ea
SET answers_json = (
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', a.id,
            'examAttemptId', a.exam_attempt_id,
            'questionId', a.question_id,
            'selectedChoiceId', a.selected_choice_id,
            'correctChoiceId', a.correct_choice_id,
            'isCorrect', a.is_correct + 0
        )
    )
    FROM exam_attempt_answers a
    WHERE a.exam_attempt_id = ea.id
);

DROP TABLE IF EXISTS exam_attempt_answers;
DROP TABLE IF EXISTS exam_choices;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS question_groups;
DROP TABLE IF EXISTS exam_parts;
DROP TABLE IF EXISTS exam_sections;
DROP TABLE IF EXISTS exercise_choices;
DROP TABLE IF EXISTS exercise_questions;

DROP PROCEDURE IF EXISTS add_column_if_missing;

RENAME TABLE
    roles TO vai_tro,
    users TO nguoi_dung,
    vocabularies TO tu_vung,
    kanjis TO chu_han,
    grammar_lessons TO ngu_phap,
    exercise_sets TO bo_bai_tap,
    exercise_attempts TO luot_lam_bai_tap,
    exam_sets TO bo_de_thi,
    exam_attempts TO luot_lam_de_thi,
    flashcards TO the_ghi_nho,
    flashcard_decks TO bo_the_ghi_nho,
    flashcard_deck_cards TO chi_tiet_bo_the,
    flashcard_progress TO tien_do_the_ghi_nho,
    user_learning_items TO tien_do_hoc,
    payment_orders TO don_thanh_toan;

DELIMITER $$

DROP PROCEDURE IF EXISTS drop_fk_if_exists $$
CREATE PROCEDURE drop_fk_if_exists(
    IN p_table_name VARCHAR(64),
    IN p_constraint_name VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table_name
           AND CONSTRAINT_NAME = p_constraint_name
           AND REFERENCED_TABLE_NAME IS NOT NULL
    ) THEN
        SET @drop_fk_sql = CONCAT('ALTER TABLE `', p_table_name, '` DROP FOREIGN KEY `', p_constraint_name, '`');
        PREPARE drop_fk_stmt FROM @drop_fk_sql;
        EXECUTE drop_fk_stmt;
        DEALLOCATE PREPARE drop_fk_stmt;
    END IF;
END $$

DELIMITER ;

CALL drop_fk_if_exists('nguoi_dung', 'fk_users_role');
CALL drop_fk_if_exists('bo_bai_tap', 'fk_exercise_sets_created_by');
CALL drop_fk_if_exists('bo_bai_tap', 'fk_exercise_sets_grammar_lesson');
CALL drop_fk_if_exists('bo_de_thi', 'fk_exam_sets_created_by');
CALL drop_fk_if_exists('luot_lam_bai_tap', 'fk_exercise_attempts_set');
CALL drop_fk_if_exists('luot_lam_bai_tap', 'fk_exercise_attempts_user');
CALL drop_fk_if_exists('luot_lam_de_thi', 'fk_exam_attempts_set');
CALL drop_fk_if_exists('luot_lam_de_thi', 'fk_exam_attempts_user');
CALL drop_fk_if_exists('the_ghi_nho', 'fk_flashcards_created_by');
CALL drop_fk_if_exists('the_ghi_nho', 'fk_flashcards_kanji');
CALL drop_fk_if_exists('the_ghi_nho', 'fk_flashcards_vocabulary');
CALL drop_fk_if_exists('bo_the_ghi_nho', 'fk_flashcard_decks_user');
CALL drop_fk_if_exists('chi_tiet_bo_the', 'fk_flashcard_deck_cards_added_by');
CALL drop_fk_if_exists('chi_tiet_bo_the', 'fk_flashcard_deck_cards_deck');
CALL drop_fk_if_exists('chi_tiet_bo_the', 'fk_flashcard_deck_cards_flashcard');
CALL drop_fk_if_exists('tien_do_the_ghi_nho', 'fk_flashcard_progress_flashcard');
CALL drop_fk_if_exists('tien_do_the_ghi_nho', 'fk_flashcard_progress_user');
CALL drop_fk_if_exists('tien_do_hoc', 'fk_user_learning_items_user');
CALL drop_fk_if_exists('don_thanh_toan', 'fk_payment_orders_user');

DROP PROCEDURE IF EXISTS drop_fk_if_exists;

ALTER TABLE vai_tro
    CHANGE name ten VARCHAR(255) NULL;

ALTER TABLE nguoi_dung
    CHANGE full_name ho_ten VARCHAR(255) NULL,
    CHANGE password mat_khau VARCHAR(255) NULL,
    CHANGE status trang_thai VARCHAR(255) NULL,
    CHANGE is_verified da_xac_thuc BIT NULL,
    CHANGE created_at tao_luc DATETIME NULL,
    CHANGE vip_expires_at vip_het_han_luc DATETIME NULL,
    CHANGE role_id vai_tro_id BIGINT NULL;

ALTER TABLE tu_vung
    CHANGE word tu VARCHAR(255) NULL,
    CHANGE reading cach_doc VARCHAR(255) NULL,
    CHANGE meaning_vi nghia_vi TEXT NULL,
    CHANGE meaning_en nghia_en TEXT NULL,
    CHANGE word_type loai_tu VARCHAR(255) NULL,
    CHANGE level_id cap_do_id BIGINT NULL,
    CHANGE lesson_note ghi_chu_bai_hoc VARCHAR(255) NULL,
    CHANGE source nguon VARCHAR(255) NULL,
    CHANGE source_entry_id ma_muc_nguon VARCHAR(255) NULL,
    CHANGE is_common thong_dung BIT NULL,
    CHANGE priority_tags the_uu_tien VARCHAR(255) NULL,
    CHANGE search_text noi_dung_tim_kiem TEXT NULL,
    CHANGE created_at tao_luc DATETIME NULL,
    CHANGE updated_at cap_nhat_luc DATETIME NULL;

ALTER TABLE chu_han
    CHANGE `character` ky_tu VARCHAR(255) NULL,
    CHANGE meaning_vi nghia_vi TEXT NULL,
    CHANGE han_viet_reading am_han_viet VARCHAR(255) NULL,
    CHANGE meaning_en nghia_en TEXT NULL,
    CHANGE stroke_count so_net INT NULL,
    CHANGE radical bo_thu VARCHAR(255) NULL,
    CHANGE source nguon VARCHAR(255) NULL,
    CHANGE source_entry_id ma_muc_nguon VARCHAR(255) NULL,
    CHANGE jlpt_legacy jlpt_cu VARCHAR(255) NULL,
    CHANGE pen_strokes du_lieu_net_but TEXT NULL,
    CHANGE stroke_gif_url duong_dan_gif_net VARCHAR(255) NULL,
    CHANGE stroke_gif_source nguon_gif_net VARCHAR(255) NULL,
    CHANGE stroke_gif_quality chat_luong_gif_net VARCHAR(255) NULL,
    CHANGE shape hinh_dang TEXT NULL,
    CHANGE unicode_codepoint ma_unicode VARCHAR(255) NULL,
    CHANGE grade lop_hoc INT NULL,
    CHANGE level_id cap_do_id BIGINT NULL,
    CHANGE created_at tao_luc DATETIME NULL,
    CHANGE updated_at cap_nhat_luc DATETIME NULL;

ALTER TABLE ngu_phap
    CHANGE title tieu_de VARCHAR(255) NULL,
    CHANGE grammar_pattern mau_ngu_phap VARCHAR(255) NULL,
    CHANGE meaning_vi nghia_vi VARCHAR(255) NULL,
    CHANGE usage_text cach_dung VARCHAR(255) NULL,
    CHANGE note_text ghi_chu VARCHAR(255) NULL,
    CHANGE comparison_text so_sanh VARCHAR(255) NULL,
    CHANGE level_id cap_do_id BIGINT NULL;

ALTER TABLE bo_bai_tap
    CHANGE title tieu_de VARCHAR(255) NULL,
    CHANGE description mo_ta VARCHAR(255) NULL,
    CHANGE tags the VARCHAR(255) NULL,
    CHANGE grammar_lesson_id ngu_phap_id BIGINT NULL,
    CHANGE level_id cap_do_id BIGINT NULL,
    CHANGE exercise_type loai_bai_tap VARCHAR(255) NULL,
    CHANGE source_url duong_dan_nguon VARCHAR(255) NULL,
    CHANGE created_by nguoi_tao_id BIGINT NULL;

ALTER TABLE luot_lam_bai_tap
    CHANGE user_id nguoi_dung_id BIGINT NULL,
    CHANGE exercise_set_id bo_bai_tap_id BIGINT NULL,
    CHANGE score diem DOUBLE NULL,
    CHANGE correct_count so_cau_dung INT NULL,
    CHANGE wrong_count so_cau_sai INT NULL,
    CHANGE answers_json dap_an_json JSON NULL,
    CHANGE submitted_at nop_luc DATETIME NULL;

ALTER TABLE bo_de_thi
    CHANGE title tieu_de VARCHAR(255) NULL,
    CHANGE description mo_ta VARCHAR(255) NULL,
    CHANGE exam_code ma_de VARCHAR(255) NULL,
    CHANGE status trang_thai VARCHAR(255) NULL,
    CHANGE month thang INT NULL,
    CHANGE year nam INT NULL,
    CHANGE tags the VARCHAR(255) NULL,
    CHANGE folder_slug thu_muc VARCHAR(255) NULL,
    CHANGE audio_url duong_dan_am_thanh VARCHAR(255) NULL,
    CHANGE level_id cap_do_id BIGINT NULL,
    CHANGE duration_minutes thoi_luong_phut INT NULL,
    CHANGE available_from mo_tu_ngay VARCHAR(255) NULL,
    CHANGE allow_answer_review cho_xem_dap_an BIT NULL,
    CHANGE allow_retake cho_lam_lai BIT NULL,
    CHANGE max_attempts so_lan_lam_toi_da INT NULL;

ALTER TABLE luot_lam_de_thi
    CHANGE user_id nguoi_dung_id BIGINT NULL,
    CHANGE exam_set_id bo_de_thi_id BIGINT NULL,
    CHANGE score diem DOUBLE NULL,
    CHANGE correct_count so_cau_dung INT NULL,
    CHANGE wrong_count so_cau_sai INT NULL,
    CHANGE answers_json dap_an_json JSON NULL,
    CHANGE submitted_at nop_luc DATETIME NULL;

ALTER TABLE the_ghi_nho
    CHANGE card_type loai_the VARCHAR(255) NULL,
    CHANGE vocabulary_id tu_vung_id BIGINT NULL,
    CHANGE kanji_id chu_han_id BIGINT NULL,
    CHANGE front_text mat_truoc VARCHAR(255) NULL,
    CHANGE back_text mat_sau VARCHAR(255) NULL,
    CHANGE example_text vi_du VARCHAR(255) NULL,
    CHANGE example_translation dich_vi_du VARCHAR(255) NULL,
    CHANGE note_text ghi_chu VARCHAR(255) NULL,
    CHANGE image_url duong_dan_anh VARCHAR(255) NULL,
    CHANGE audio_url duong_dan_am_thanh VARCHAR(255) NULL,
    CHANGE created_by nguoi_tao_id BIGINT NULL,
    CHANGE created_at tao_luc DATETIME NULL,
    CHANGE updated_at cap_nhat_luc DATETIME NULL;

ALTER TABLE bo_the_ghi_nho
    CHANGE user_id nguoi_dung_id BIGINT NULL,
    CHANGE title tieu_de VARCHAR(255) NULL,
    CHANGE description mo_ta TEXT NULL,
    CHANGE cover_color mau_bia VARCHAR(255) NULL,
    CHANGE source_type loai_nguon VARCHAR(255) NULL,
    CHANGE is_system la_he_thong BIT NULL,
    CHANGE is_public cong_khai BIT NULL,
    CHANGE level_id cap_do_id BIGINT NULL,
    CHANGE created_at tao_luc DATETIME NULL,
    CHANGE updated_at cap_nhat_luc DATETIME NULL;

ALTER TABLE chi_tiet_bo_the
    CHANGE deck_id bo_the_id BIGINT NULL,
    CHANGE flashcard_id the_ghi_nho_id BIGINT NULL,
    CHANGE card_order thu_tu INT NULL,
    CHANGE added_by nguoi_them_id BIGINT NULL,
    CHANGE added_at them_luc DATETIME NULL;

ALTER TABLE tien_do_the_ghi_nho
    CHANGE user_id nguoi_dung_id BIGINT NULL,
    CHANGE flashcard_id the_ghi_nho_id BIGINT NULL,
    CHANGE memory_status trang_thai_nho VARCHAR(255) NULL,
    CHANGE review_count so_lan_on INT NULL,
    CHANGE last_reviewed_at on_lan_cuoi_luc DATETIME NULL,
    CHANGE next_review_at on_lan_tiep_luc DATETIME NULL;

ALTER TABLE tien_do_hoc
    CHANGE user_id nguoi_dung_id BIGINT NULL,
    CHANGE item_type loai_noi_dung VARCHAR(255) NULL,
    CHANGE item_id noi_dung_id BIGINT NULL,
    CHANGE learning_status trang_thai_hoc VARCHAR(255) NULL,
    CHANGE is_bookmarked da_luu BIT NULL,
    CHANGE saved_at luu_luc DATETIME NULL;

ALTER TABLE don_thanh_toan
    CHANGE order_code ma_don VARCHAR(255) NOT NULL,
    CHANGE user_id nguoi_dung_id BIGINT NOT NULL,
    CHANGE provider nha_cung_cap VARCHAR(255) NOT NULL,
    CHANGE amount_vnd so_tien_vnd BIGINT NOT NULL,
    CHANGE status trang_thai VARCHAR(255) NOT NULL,
    CHANGE bank_code ma_ngan_hang VARCHAR(255) NULL,
    CHANGE vnp_transaction_no ma_giao_dich_vnpay VARCHAR(255) NULL,
    CHANGE vnp_response_code ma_phan_hoi_vnpay VARCHAR(255) NULL,
    CHANGE vnp_transaction_status trang_thai_giao_dich_vnpay VARCHAR(255) NULL,
    CHANGE pay_url duong_dan_thanh_toan TEXT NULL,
    CHANGE created_at tao_luc DATETIME NOT NULL,
    CHANGE paid_at thanh_toan_luc DATETIME NULL,
    CHANGE expires_at het_han_luc DATETIME NULL,
    CHANGE raw_response phan_hoi_goc TEXT NULL;

ALTER TABLE bo_bai_tap
    DROP COLUMN created_at,
    DROP COLUMN updated_at;

ALTER TABLE bo_de_thi
    DROP COLUMN created_by,
    DROP COLUMN created_at,
    DROP COLUMN updated_at;

ALTER TABLE ngu_phap
    DROP COLUMN created_at,
    DROP COLUMN updated_at;

ALTER TABLE nguoi_dung
    DROP COLUMN target_level_id,
    DROP COLUMN updated_at;

ALTER TABLE vai_tro
    DROP COLUMN description;

SET FOREIGN_KEY_CHECKS = 1;
