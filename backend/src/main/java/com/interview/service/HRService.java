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
public class HRService {

    private final GroqService groqService;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String GENERATE_SYSTEM = """
        You are an experienced HR interviewer at a top tech company.
        Generate 5 thoughtful HR interview questions that test personality, problem-solving, cultural fit,
        leadership, conflict resolution, and career goals. Mix behavioral (STAR format), situational,
        and motivational questions. Make them feel like a real HR interview.
        
        Respond ONLY with valid JSON:
        {
          "questions": [
            {
              "id": 1,
              "question": "Full question text",
              "type": "BEHAVIORAL|SITUATIONAL|MOTIVATIONAL|PERSONALITY",
              "what_they_look_for": "What ideal answer covers",
              "tips": ["tip 1", "tip 2"],
              "example_good_answer_structure": "Brief ideal answer structure"
            }
          ]
        }
        """;

    private static final String ANALYZE_SYSTEM = """
        You are an expert HR coach and communication analyst.
        Analyze the candidate's spoken answer (transcribed from audio) for an HR interview.
        Be specific, helpful, and encouraging. Focus on communication quality and content.
        
        Analyze:
        1. CONTENT: relevance, structure (STAR if behavioral), completeness
        2. GRAMMAR: grammatical errors, awkward phrasing
        3. TONE INDICATORS: word choice suggesting confidence/nervousness/enthusiasm
        4. CLARITY: clear communication, filler words (um, uh, like, you know)
        5. WORD MISTAKES: specific wrong/misused words
        6. PROFESSIONALISM: appropriate language for corporate setting
        
        Respond ONLY with valid JSON:
        {
          "score": 7,
          "contentScore": 7,
          "communicationScore": 8,
          "grammarScore": 9,
          "overallRemarks": "encouraging 2-3 sentence summary",
          "grammarErrors": [
            {"original": "...", "corrected": "...", "explanation": "..."}
          ],
          "wordMistakes": [
            {"word": "...", "correction": "...", "context": "..."}
          ],
          "fillerWords": {"count": 3, "examples": ["um", "like"], "advice": "..."},
          "toneAnalysis": {
            "confidence": "HIGH|MEDIUM|LOW",
            "enthusiasm": "HIGH|MEDIUM|LOW",
            "nervousness": "HIGH|MEDIUM|LOW",
            "professionalism": "HIGH|MEDIUM|LOW",
            "indicators": ["specific phrases that indicate tone"]
          },
          "strengths": ["strength 1", "strength 2"],
          "improvements": ["improvement 1", "improvement 2"],
          "betterPhrasings": [
            {"original": "...", "improved": "...", "why": "..."}
          ],
          "missedPoints": ["important points not covered"],
          "starAnalysis": {
            "situation": "present/missing/weak",
            "task": "present/missing/weak",
            "action": "present/missing/weak",
            "result": "present/missing/weak"
          }
        }
        """;

    public JsonNode generateQuestions() throws Exception {
        return generateQuestions(null);
    }

    public JsonNode generateQuestions(String expertiseContext) throws Exception {
        String contextClause = (expertiseContext != null && !expertiseContext.isBlank())
            ? "\n\nCANDIDATE PROFILE: " + expertiseContext +
              "\nAdapt the HR questions specifically to this candidate's domain and level: " +
              "- Ask about domain-specific team/project experiences " +
              "- For senior levels, include leadership, architecture decisions, and mentoring questions " +
              "- For freshers, focus on learning attitude, academics, projects, and career goals " +
              "- Reference their target role in the questions where appropriate"
            : "";

        String randomSeed = "Focus areas this session: " + getRandomFocus() +
            ". Make questions natural and conversational, not robotic." + contextClause;

        String response = groqService.chatJson(GENERATE_SYSTEM, randomSeed);
        return mapper.readTree(response);
    }

    public JsonNode analyzeAnswer(String questionJson, String transcribedAnswer, String audioDurationSeconds) throws Exception {
        String prompt = String.format("""
            HR Interview Question:
            %s
            
            Candidate's spoken answer (transcribed from audio):
            "%s"
            
            Audio duration: %s seconds
            
            Analyze this answer thoroughly for content, grammar, tone, word mistakes, and communication skills.
            Be specific about every grammatical error and word mistake with corrections.
            """, questionJson, transcribedAnswer, audioDurationSeconds);

        String response = groqService.chatJson(ANALYZE_SYSTEM, prompt);
        return mapper.readTree(response);
    }

    public JsonNode generateFinalReport(List<JsonNode> questionAnalyses) throws Exception {
        String analysesJson = mapper.writeValueAsString(questionAnalyses);

        String prompt = String.format("""
            Here are the analyses of all 5 HR interview answers for a candidate:
            %s
            
            Create a comprehensive final report.
            """, analysesJson);

        String response = groqService.chatJson("""
            You are creating a final HR interview performance report.
            Respond ONLY with JSON:
            {
              "overallScore": 75,
              "grade": "B+",
              "hiringRecommendation": "STRONG_YES|YES|MAYBE|NO",
              "executiveSummary": "3-4 sentence overall assessment",
              "averages": {
                "content": 7.5,
                "communication": 8.0,
                "grammar": 8.5
              },
              "topStrengths": ["strength 1", "strength 2", "strength 3"],
              "criticalImprovements": ["critical 1", "critical 2"],
              "commonPatterns": {
                "positives": ["pattern 1"],
                "negatives": ["pattern 2"]
              },
              "developmentPlan": [
                {"area": "...", "action": "...", "timeline": "2 weeks"}
              ],
              "motivationalMessage": "personalized encouraging closing message"
            }
            """, prompt);

        return mapper.readTree(response);
    }

    private String getRandomFocus() {
        List<String> focuses = Arrays.asList(
            "leadership and teamwork experiences",
            "conflict resolution and handling difficult situations",
            "career goals and motivation",
            "failures, learnings, and growth mindset",
            "problem-solving and initiative",
            "work-life balance and stress management",
            "adaptability and handling change",
            "communication and collaboration"
        );
        Collections.shuffle(focuses);
        return String.join(", ", focuses.subList(0, 2));
    }
}
