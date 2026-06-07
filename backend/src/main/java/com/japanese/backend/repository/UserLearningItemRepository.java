package com.japanese.backend.repository;

import com.japanese.backend.entity.UserLearningItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserLearningItemRepository extends JpaRepository<UserLearningItem, Long> {
    List<UserLearningItem> findByUserIdAndItemType(Long userId, String itemType);

    Optional<UserLearningItem> findByUserIdAndItemTypeAndItemId(Long userId, String itemType, Long itemId);
}
