package com.japanese.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AiChatResponse(
        String answer,
        String model,
        LocalDateTime answeredAt,
        List<String> sources
) {
}
