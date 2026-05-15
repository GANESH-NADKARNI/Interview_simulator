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
        Cover a MIX of: logical reasoning, quantitative aptitude, verbal reasoning, and pattern recognition.
        
        CRITICAL RULES:
        - NEVER generate questions that reference graphs, charts, tables, figures, diagrams, or images
        - NEVER say "refer to the graph below", "from the table", "as shown in the figure", etc.
        - ALL data needed to answer must be fully contained in the question text itself
        - Questions must be self-contained and answerable with text only
        - The correctAnswer field must be EXACTLY one letter: A, B, C, or D (no punctuation, no extra text)
        - The options must start with exactly "A) ", "B) ", "C) ", "D) "
        
        Respond with ONLY valid JSON in this exact format:
        {
          "questions": [
            {
              "id": 1,
              "type": "QUANTITATIVE|LOGICAL|VERBAL|PATTERN",
              "question": "Full self-contained question text with all data included",
              "options": ["A) option text", "B) option text", "C) option text", "D) option text"],
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
        You will be given a list of questions with their correct answers, and the user's selected answers.
        Compare each user answer to the correct answer EXACTLY.
        
        CRITICAL: 
        - userAnswer is a single letter (A, B, C, or D)
        - correctAnswer in the question is also a single letter (A, B, C, or D)
        - isCorrect = true ONLY if userAnswer exactly matches correctAnswer (case-insensitive)
        - Do NOT be lenient - if they picked B and correct is A, isCorrect = false
        - Calculate totalScore as (number correct / total questions) * 100, rounded to nearest integer
        
        Respond with ONLY valid JSON:
        {
          "totalScore": <0-100>,
          "grade": "A+|A|B+|B|C|D|F",
          "overallRemarks": "2-3 sentence motivating summary",
          "topicWiseAnalysis": [
            {"topic": "...", "correct": 0, "total": 0, "advice": "..."}
          ],
          "improvements": ["specific improvement 1", "specific improvement 2"],
          "strongAreas": ["area1", "area2"],
          "weakAreas": ["area1", "area2"],
          "questionFeedback": [
            {
              "questionId": 1,
              "isCorrect": true,
              "userAnswer": "A",
              "correctAnswer": "A",
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
              "\nTailor question difficulty and domain references to match this candidate's background. " +
              "Still cover standard aptitude areas but use domain-relevant examples where possible. " +
              "Remember: NO graph or visual questions regardless of profile."
            : "";

        String randomSeed = "Focus on these specific topics this session: " +
            getRandomTopics() + ". Make questions unique and not repetitive. " +
            "Remember: ALL questions must be fully text-based with no visual references." + contextClause;

        String response = groqService.chatJson(GENERATE_SYSTEM, randomSeed);
        return mapper.readTree(response);
    }

    public JsonNode evaluateAnswers(String questionsJson, String answersJson) throws Exception {
        String prompt = String.format("""
            Here are the questions with their correct answers:
            %s
            
            Here are the user's answers (questionId -> selected letter):
            %s
            
            For each question:
            1. Look up the question by its id
            2. Get the correctAnswer letter from that question
            3. Get the user's answer letter from the answers map
            4. Set isCorrect = true ONLY if they match exactly (case-insensitive)
            5. Include both userAnswer and correctAnswer in the feedback
            
            Calculate totalScore = (correct count / total count) * 100, rounded.
            Be strict and accurate in your evaluation.
            """, questionsJson, answersJson);

        String response = groqService.chatJson(EVALUATE_SYSTEM, prompt);
        return mapper.readTree(response);
    }

    private String getRandomTopics() {
        List<String> allTopics = Arrays.asList(
            "Percentages and Profit/Loss",
            "Time, Speed, and Distance",
            "Logical Sequences and Patterns",
            "Probability and Permutations",
            "Ages and Ratios",
            "Syllogisms",
            "Blood Relations",
            "Coding-Decoding",
            "Number Series",
            "Analogies",
            "Clocks and Calendars",
            "Pipes and Cisterns",
            "Work and Time",
            "Simple and Compound Interest",
            "Directions and Distances"
        );
        Collections.shuffle(allTopics);
        return String.join(", ", allTopics.subList(0, 5));
    }
}