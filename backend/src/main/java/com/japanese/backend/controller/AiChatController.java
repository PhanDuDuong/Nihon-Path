package com.japanese.backend.controller;

import com.japanese.backend.dto.AiChatRequest;
import com.japanese.backend.dto.AiChatResponse;
import com.japanese.backend.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/vip/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request, Principal principal) {
        return aiChatService.chat(principal.getName(), request);
    }

    @PostMapping(value = "/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AiChatResponse chatWithFiles(
            @RequestPart(value = "message", required = false) String message,
            @RequestPart(value = "history", required = false) String history,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Principal principal
    ) {
        return aiChatService.chatWithFiles(principal.getName(), message, history, files);
    }
}
