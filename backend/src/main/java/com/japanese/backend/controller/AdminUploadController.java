package com.japanese.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uploads")
public class AdminUploadController {

    private static final long MAX_UPLOAD_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif",
            ".mp3", ".wav", ".m4a", ".ogg",
            ".pdf", ".csv", ".xlsx"
    );

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam MultipartFile file, @RequestParam(defaultValue = "exam") String folder) throws Exception {
        validateFile(file);
        String safeFolder = folder.replaceAll("[^a-zA-Z0-9_-]", "-");
        if (!StringUtils.hasText(safeFolder)) {
            safeFolder = "exam";
        }
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String extension = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalName.substring(dot).toLowerCase(Locale.ROOT);
        }
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String fileName = UUID.randomUUID() + extension;
        Path directory = Path.of(uploadDir, safeFolder, date);
        Files.createDirectories(directory);
        Path target = directory.resolve(fileName);
        file.transferTo(target);
        return Map.of("url", "/uploads/" + safeFolder + "/" + date + "/" + fileName);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File upload la bat buoc");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File upload khong duoc vuot qua 10MB");
        }
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        int dot = originalName.lastIndexOf('.');
        String extension = dot >= 0 ? originalName.substring(dot).toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dinh dang file upload khong duoc ho tro");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        boolean knownContentType = contentType.startsWith("image/")
                || contentType.startsWith("audio/")
                || contentType.equals("application/pdf")
                || contentType.equals("text/csv")
                || contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                || contentType.equals("application/octet-stream");
        if (!knownContentType) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content-Type upload khong duoc ho tro");
        }
    }
}
