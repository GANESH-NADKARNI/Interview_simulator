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
public class CodingService {

    private final GroqService groqService;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String GENERATE_SYSTEM = """
        You are a senior software engineer at FAANG creating DSA interview problems.
        Generate exactly 5 DSA problems that are FREQUENTLY asked in real interviews at top companies.
        Cover different topics: arrays, strings, trees, graphs, dynamic programming, etc.
        Mix difficulty levels. Each problem should be clear with examples.
        
        Respond ONLY with valid JSON:
        {
          "problems": [
            {
              "id": 1,
              "title": "Problem Title",
              "difficulty": "EASY|MEDIUM|HARD",
              "topic": "Arrays|Strings|Trees|Graphs|DP|Linked Lists|Stack/Queue|Binary Search|Sorting|Recursion",
              "description": "Full problem description",
              "examples": [
                {"input": "...", "output": "...", "explanation": "..."}
              ],
              "constraints": ["1 <= n <= 10^5", "etc"],
              "hints": ["hint 1", "hint 2"],
              "optimalApproach": "Brief description of optimal solution",
              "timeComplexity": "O(n log n)",
              "spaceComplexity": "O(n)",
              "companiesAsked": ["Google", "Amazon", "Microsoft"]
            }
          ]
        }
        """;

    private static final String EVALUATE_SYSTEM = """
        You are a senior FAANG interviewer evaluating a coding solution.
        Be thorough: check correctness, edge cases, complexity, code quality, and style.
        Be encouraging but honest. Give specific, actionable feedback.
        
        Respond ONLY with valid JSON:
        {
          "isCorrect": true,
          "score": 8,
          "verdict": "ACCEPTED|WRONG_ANSWER|TIME_LIMIT|COMPILE_ERROR|PARTIAL",
          "errors": ["specific error if any"],
          "hints": ["hint if wrong"],
          "correctApproach": "step by step optimal approach",
          "bestSolution": "clean optimal code in same language",
          "improvements": ["improvement 1", "improvement 2"],
          "timeComplexity": {"user": "O(n^2)", "optimal": "O(n)"},
          "spaceComplexity": {"user": "O(1)", "optimal": "O(n)"},
          "codeQualityFeedback": "feedback on naming, style, readability",
          "edgeCasesHandled": ["edge case 1"],
          "edgeCasesMissed": ["edge case 2"],
          "remarks": "overall encouraging remark"
        }
        """;

    public JsonNode generateProblems() throws Exception {
        return generateProblems(null);
    }

    public JsonNode generateProblems(String expertiseContext) throws Exception {
        String contextClause = (expertiseContext != null && !expertiseContext.isBlank())
            ? "\n\nCANDIDATE PROFILE: " + expertiseContext +
              "\nAdapt the problems to this candidate: " +
              "- For FRESHER/JUNIOR: include more EASY problems, focus on arrays, strings, basic DP. " +
              "- For MID/SENIOR: include more MEDIUM/HARD, focus on graphs, advanced DP, system-thinking problems. " +
              "- For LEAD/PRINCIPAL: include design-flavored algorithmic problems and optimization challenges. " +
              "Match the domain if relevant (e.g., for ML engineers include matrix/math problems)."
            : "";

        String randomSeed = "Session topics focus: " + getRandomTopics() +
            ". Include at least one HARD problem. Make them real FAANG interview questions, not trivial."
            + contextClause;

        String response = groqService.chatJson(GENERATE_SYSTEM, randomSeed);
        return mapper.readTree(response);
    }

    public JsonNode evaluateSolution(String problemJson, String userCode, String language) throws Exception {
        String prompt = String.format("""
            Problem:
            %s
            
            User's solution in %s:
            ```%s
            %s
            ```
            
            Evaluate this solution thoroughly. Check for correctness, edge cases, and quality.
            If there are errors, give helpful hints rather than the full solution immediately.
            """, problemJson, language, language.toLowerCase(), userCode);

        String response = groqService.chatJson(EVALUATE_SYSTEM, prompt);
        return mapper.readTree(response);
    }

    public JsonNode getHint(String problemJson, String userCode, String language, int hintLevel) throws Exception {
        String prompt = String.format("""
            Problem:
            %s
            
            User's current attempt in %s:
            ```
            %s
            ```
            
            Hint level requested: %d (1=gentle nudge, 2=approach hint, 3=detailed hint)
            
            Give a hint appropriate for level %d. Do NOT give away the full solution.
            
            Respond with JSON: {"hint": "...", "encouragement": "..."}
            """, problemJson, language, userCode, hintLevel, hintLevel);

        String response = groqService.chatJson(
            "You are a coding mentor. Give helpful hints without spoiling the solution.",
            prompt
        );
        return mapper.readTree(response);
    }

    private String getRandomTopics() {
        List<String> topics = Arrays.asList(
            "Two Pointers and Sliding Window",
            "Binary Search and its variations",
            "Tree traversals and BST",
            "Dynamic Programming (1D and 2D)",
            "Graph BFS/DFS",
            "Stack and Monotonic Stack",
            "HashMap and HashSet tricks",
            "Recursion and Backtracking",
            "Heap and Priority Queue",
            "Greedy algorithms"
        );
        Collections.shuffle(topics);
        return String.join(", ", topics.subList(0, 3));
    }
}
