package com.meteoinsight.backend.service;

import com.meteoinsight.backend.dto.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public HealthResponse getHealth() {

        return new HealthResponse(
                "UP",
                "MeteoInsight Backend",
                "0.1.0"
        );

    }

}
