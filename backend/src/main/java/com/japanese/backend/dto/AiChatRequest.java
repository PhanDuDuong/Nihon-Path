package com.japanese.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiChatRequest(
        @NotBlank(message = "Vui lòng nhập câu hỏi")
        @Size(max = 1200, message = "Câu hỏi quá dài")
        String message,
        List<AiChatTurn> history
) {
    public record AiChatTurn(
            String role,
            @Size(max = 1200, message = "Nội dung lịch sử chat quá dài")
            String content
    ) {
    }
}
