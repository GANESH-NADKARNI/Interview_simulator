package com.interview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication(scanBasePackages = {"com.interview", "com.interviewsim"})
@EnableMongoRepositories(basePackages = {
    "com.interview.repository",
    "com.interviewsim.repository"
})
@EnableMongoAuditing  // needed for @CreatedDate / @LastModifiedDate on User
public class InterviewSimulatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(InterviewSimulatorApplication.class, args);
    }
}