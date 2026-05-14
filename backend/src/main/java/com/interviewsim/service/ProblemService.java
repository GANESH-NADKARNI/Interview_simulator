package com.interviewsim.service;

import com.interviewsim.exception.ApiException;
import com.interviewsim.model.dto.ProblemDTO;
import com.interviewsim.model.dto.TestCaseDTO;
import com.interviewsim.model.entity.Problem;
import com.interviewsim.model.enums.Difficulty;
import com.interviewsim.repository.ProblemRepository;
import com.interviewsim.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    public Page<ProblemDTO> getAll(String difficulty, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Problem> problems;
        if (difficulty != null && category != null) {
            problems = problemRepository.findByDifficultyAndCategory(
                    Difficulty.valueOf(difficulty.toUpperCase()), category, pageable);
        } else if (difficulty != null) {
            problems = problemRepository.findByDifficulty(
                    Difficulty.valueOf(difficulty.toUpperCase()), pageable);
        } else if (category != null) {
            problems = problemRepository.findByCategory(category, pageable);
        } else {
            problems = problemRepository.findAll(pageable);
        }
        return problems.map(p -> toDTO(p, false));
    }

    public ProblemDTO getById(String id) {
        return problemRepository.findById(id)
                .map(p -> toDTO(p, true))
                .orElseThrow(() -> new ApiException("Problem not found", HttpStatus.NOT_FOUND));
    }

    public ProblemDTO getBySlug(String slug) {
        return problemRepository.findBySlug(slug)
                .map(p -> toDTO(p, true))
                .orElseThrow(() -> new ApiException("Problem not found", HttpStatus.NOT_FOUND));
    }

    private ProblemDTO toDTO(Problem p, boolean includeTestCases) {
        ProblemDTO dto = ProblemDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .description(p.getDescription())
                .difficulty(p.getDifficulty().name())
                .category(p.getCategory())
                .constraints(p.getConstraints())
                .examples(p.getExamples())
                .starterCode(p.getStarterCode())
                .timeLimit(p.getTimeLimit())
                .memoryLimit(p.getMemoryLimit())
                .build();

        if (includeTestCases) {
            // Test cases are a separate collection — query by problemId, no join needed
            List<TestCaseDTO> visibleCases = testCaseRepository
                    .findByProblemIdOrderByOrderIndexAsc(p.getId())
                    .stream()
                    .filter(tc -> !tc.getIsHidden())
                    .map(tc -> TestCaseDTO.builder()
                            .id(tc.getId())
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .isHidden(false)
                            .orderIndex(tc.getOrderIndex())
                            .build())
                    .collect(Collectors.toList());
            dto.setTestCases(visibleCases);
        }
        return dto;
    }
}