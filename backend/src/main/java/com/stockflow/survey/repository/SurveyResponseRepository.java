package com.stockflow.survey.repository;

import com.stockflow.survey.entity.SurveyResponse;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    long countByCreatedAtGreaterThanEqual(LocalDateTime since);
}
