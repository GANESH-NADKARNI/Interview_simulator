package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AptitudeService {

    private final GroqService groqService;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String GENERATE_SYSTEM = """
        You are an expert aptitude test designer for top tech companies (Google, Amazon, Microsoft, etc.).
        Generate exactly 10 aptitude questions that are genuinely challenging and helpful for interview preparation.
        Cover a MIX of: logical reasoning, quantitative aptitude, data interpretation, verbal reasoning, and pattern recognition.
        Make them varied - not all the same type. Include real difficulty like GATE, CAT, placement exam standards.
        
        Respond with ONLY valid JSON in this exact format:
        {
          "questions": [
            {
              "id": 1,
              "type": "QUANTITATIVE|LOGICAL|VERBAL|DATA_INTERPRETATION|PATTERN",
              "question": "Full question text",
              "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
              "correctAnswer": "A",
              "explanation": "Detailed step-by-step explanation",
              "topic": "Topic name",
              "difficulty": "EASY|MEDIUM|HARD"
            }
          ]
        }
        """;

    private static final String EVALUATE_SYSTEM = """
        You are a strict but encouraging aptitude evaluator for technical interviews.
        Analyze the user's answers against the correct answers.
        Give honest, constructive feedback. Be specific about mistakes.
        
        Respond with ONLY valid JSON:
        {
          "totalScore": <0-100>,
          "grade": "A+|A|B+|B|C|D|F",
          "overallRemarks": "2-3 sentence motivating summary",
          "topicWiseAnalysis": [
            {"topic": "...", "correct": 0, "total": 0, "advice": "..."}
          ],
          "improvements": ["specific improvement 1", "specific improvement 2", ...],
          "strongAreas": ["area1", "area2"],
          "weakAreas": ["area1", "area2"],
          "questionFeedback": [
            {
              "questionId": 1,
              "isCorrect": true,
              "userAnswer": "A",
              "correctAnswer": "B",
              "explanation": "why this answer is correct"
            }
          ]
        }
        """;

    public JsonNode generateQuestions() throws Exception {
        return generateQuestions(null);
    }

    public JsonNode generateQuestions(String expertiseContext) throws Exception {
        String contextClause = (expertiseContext != null && !expertiseContext.isBlank())
            ? "\n\nCANDIDATE PROFILE: " + expertiseContext +
              "\nTailor question difficulty, examples, and domain references to match this candidate's background. " +
              "For a senior engineer use harder questions; for a fresher keep them moderately challenging. " +
              "Still cover the standard aptitude areas but use domain-relevant examples where possible."
            : "";

        String randomSeed = "Focus on these specific topics this session: " +
            getRandomTopics() + ". Make questions unique and not repetitive." + contextClause;

        String response = groqService.chatJson(GENERATE_SYSTEM, randomSeed);
        return mapper.readTree(response);
    }

    public JsonNode evaluateAnswers(String questionsJson, String answersJson) throws Exception {
        String prompt = String.format("""
            Questions given to user:
            %s
            
            User's answers (map of questionId -> selectedOption letter):
            %s
            
            Evaluate all answers thoroughly and provide detailed feedback.
            """, questionsJson, answersJson);

        String response = groqService.chatJson(EVALUATE_SYSTEM, prompt);
        return mapper.readTree(response);
    }

    private String getRandomTopics() {
        List<String> allTopics = Arrays.asList(
            "Percentages and Profit/Loss",
            "Time, Speed, and Distance",
            "Logical Sequences and Patterns",
            "Data Sufficiency",
            "Probability and Permutations",
            "Ages and Ratios",
            "Syllogisms",
            "Blood Relations",
            "Coding-Decoding",
            "Number Series",
            "Analogies",
            "Data Interpretation with graphs",
            "Clocks and Calendars",
            "Pipes and Cisterns",
            "Work and Time"
        );
        Collections.shuffle(allTopics);
        return String.join(", ", allTopics.subList(0, 5));
    }
}
