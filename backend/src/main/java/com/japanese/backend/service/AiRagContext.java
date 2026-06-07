package com.japanese.backend.service;

import java.util.List;

public record AiRagContext(
        String contextText,
        List<String> sources
) {
}
