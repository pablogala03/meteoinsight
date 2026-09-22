package com.meteoinsight.backend.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class WeatherCloudClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public String downloadData(String url) {
        return restTemplate.getForObject(url, String.class);
    }
}