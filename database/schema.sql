-- ─────────────────────────────────────────────────────────────
-- AI-Powered Code Interview Simulator - Database Schema
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS interview_sim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE interview_sim;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_email    (email)
);

-- Problems
CREATE TABLE IF NOT EXISTS problems (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    description  TEXT         NOT NULL,
    difficulty   ENUM('EASY','MEDIUM','HARD') NOT NULL,
    category     VARCHAR(100),
    constraints  TEXT,
    examples     TEXT,
    starter_code TEXT,
    time_limit   INT     NOT NULL DEFAULT 5000,
    memory_limit INT     NOT NULL DEFAULT 256,
    created_by   BIGINT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_problems_difficulty (difficulty),
    INDEX idx_problems_category   (category)
);

-- Test Cases
CREATE TABLE IF NOT EXISTS test_cases (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    problem_id    BIGINT   NOT NULL,
    input         TEXT     NOT NULL,
    expected_output TEXT   NOT NULL,
    is_hidden     BOOLEAN  NOT NULL DEFAULT FALSE,
    order_index   INT      NOT NULL DEFAULT 0,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_tc_problem (problem_id)
);

-- Interview Sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    title         VARCHAR(200) NOT NULL,
    duration_mins INT          NOT NULL DEFAULT 60,
    started_at    TIMESTAMP    NULL,
    ended_at      TIMESTAMP    NULL,
    status        ENUM('SCHEDULED','ACTIVE','COMPLETED','ABANDONED') NOT NULL DEFAULT 'SCHEDULED',
    problem_ids   JSON         NOT NULL,
    total_score   INT          NOT NULL DEFAULT 0,
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user   (user_id),
    INDEX idx_sessions_status (status)
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT   NOT NULL,
    problem_id    BIGINT   NOT NULL,
    session_id    BIGINT   NULL,
    language      VARCHAR(20) NOT NULL,
    code          LONGTEXT NOT NULL,
    status        ENUM('PENDING','RUNNING','ACCEPTED','WRONG_ANSWER',
                       'TIME_LIMIT_EXCEEDED','RUNTIME_ERROR','COMPILE_ERROR')
                  NOT NULL DEFAULT 'PENDING',
    runtime_ms    INT      NULL,
    memory_mb     FLOAT    NULL,
    tests_passed  INT      NOT NULL DEFAULT 0,
    tests_total   INT      NOT NULL DEFAULT 0,
    ai_score      INT      NULL,
    ai_feedback   JSON     NULL,
    error_message TEXT     NULL,
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)              ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id)           ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE SET NULL,
    INDEX idx_submissions_user    (user_id),
    INDEX idx_submissions_problem (problem_id),
    INDEX idx_submissions_status  (status),
    INDEX idx_submissions_session (session_id)
);
