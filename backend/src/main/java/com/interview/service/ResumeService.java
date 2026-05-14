package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final GroqService groqService;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String ATS_SYSTEM = """
        You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter
        with 15+ years of experience at top tech companies like Google, Amazon, Microsoft, and startups.

        Analyze the given resume text thoroughly and provide a detailed ATS compatibility report.

        You MUST respond with ONLY valid JSON in this exact structure:
        {
          "overallScore": 78,
          "atsCompatibilityScore": 82,
          "contentScore": 75,
          "formatScore": 80,
          "grade": "B+",
          "summary": "2-3 sentence executive summary of the resume quality",

          "sections": {
            "contact": { "present": true, "score": 9, "issues": [], "suggestions": [] },
            "summary": { "present": true, "score": 7, "issues": ["Too generic"], "suggestions": ["Add specific technologies"] },
            "experience": { "present": true, "score": 8, "issues": [], "suggestions": [] },
            "education": { "present": true, "score": 9, "issues": [], "suggestions": [] },
            "skills": { "present": true, "score": 7, "issues": ["Missing trending technologies"], "suggestions": [] },
            "projects": { "present": false, "score": 0, "issues": ["No projects section"], "suggestions": ["Add 2-3 projects"] },
            "certifications": { "present": false, "score": 0, "issues": [], "suggestions": [] },
            "achievements": { "present": false, "score": 0, "issues": [], "suggestions": ["Add quantified achievements"] }
          },

          "atsIssues": [
            { "severity": "HIGH|MEDIUM|LOW", "issue": "Issue description", "fix": "How to fix it" }
          ],

          "keywordsFound": ["Java", "Spring Boot", "REST API"],
          "keywordsMissing": ["Docker", "Kubernetes", "CI/CD"],
          "keywordsDensity": "Good|Low|Excessive",

          "strengthPoints": ["Strength 1", "Strength 2"],
          "weaknessPoints": ["Weakness 1", "Weakness 2"],

          "actionVerbs": {
            "used": ["Developed", "Implemented"],
            "missing": ["Optimized", "Architected", "Led"],
            "score": 7
          },

          "quantification": {
            "score": 6,
            "found": ["Increased performance by 40%"],
            "missing": ["Add metrics to your experience bullets"],
            "advice": "Only 2/8 bullets have numbers. Add metrics to at least 70% of bullets."
          },

          "detectedRole": "Backend Software Engineer",
          "detectedLevel": "Mid-Level (2-4 years)",
          "detectedSkills": ["Java", "Spring Boot", "MongoDB"],

          "improvements": [
            { "priority": "HIGH", "area": "Area", "current": "What exists now", "improved": "How to improve it", "example": "Concrete example" }
          ],

          "industryBenchmark": {
            "percentile": 65,
            "message": "Your resume is better than 65% of candidates for similar roles",
            "topRecommendation": "The single most impactful change you can make"
          },

          "jobRoleMatch": [
            { "role": "Backend Developer", "matchScore": 85, "missingSkills": ["Docker"] },
            { "role": "Full Stack Developer", "matchScore": 60, "missingSkills": ["React", "Vue"] }
          ]
        }
        """;

    public JsonNode analyzeResume(String resumeText) throws Exception {
        if (resumeText == null || resumeText.trim().length() < 50) {
            throw new IllegalArgumentException("Resume text too short or empty");
        }

        // Truncate if too long to avoid token limits
        String truncated = resumeText.length() > 6000
            ? resumeText.substring(0, 6000) + "\n[TRUNCATED]"
            : resumeText;

        String prompt = "Analyze this resume comprehensively:\n\n" + truncated;
        String response = groqService.chatJson(ATS_SYSTEM, prompt);
        return mapper.readTree(response);
    }

    public JsonNode getResumeImprovement(String resumeText, String targetRole, String targetLevel) throws Exception {
        String prompt = String.format("""
            Resume text:
            %s

            Target Role: %s
            Target Level: %s

            Rewrite and improve the resume summary/objective section and top 3 bullet points
            to be perfectly optimized for this target role and ATS systems.
            """, resumeText.substring(0, Math.min(resumeText.length(), 3000)), targetRole, targetLevel);

        String response = groqService.chatJson("""
            You are an expert resume writer. Respond ONLY with JSON:
            {
              "improvedSummary": "Rewritten professional summary optimized for ATS and the target role",
              "improvedBullets": [
                { "original": "original bullet", "improved": "improved bullet with metrics and action verbs" }
              ],
              "additionalKeywords": ["keyword1", "keyword2"],
              "atsOptimizationTips": ["tip1", "tip2", "tip3"]
            }
            """, prompt);

        return mapper.readTree(response);
    }
}
