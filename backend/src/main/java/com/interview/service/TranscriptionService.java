package com.interview.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@Service
public class TranscriptionService {

    @Value("${app.ai.api-key}")
    private String groqApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String WHISPER_MODEL = "whisper-large-v3-turbo";

    public String transcribe(MultipartFile audioFile) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(groqApiKey);

        // Wrap audio bytes as a named resource
        byte[] audioBytes = audioFile.getBytes();
        ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                // Groq requires a filename with a supported extension
                return "recording.webm";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audioResource);
        body.add("model", WHISPER_MODEL);
        body.add("language", "en");
        body.add("response_format", "verbose_json"); // get word timestamps too

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            GROQ_WHISPER_URL,
            HttpMethod.POST,
            request,
            Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object text = response.getBody().get("text");
            if (text != null) {
                return text.toString().trim();
            }
        }
        throw new RuntimeException("Failed to get transcript from Groq Whisper");
    }
}