package com.meteoinsight.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "weather_observations")
@Getter
@Setter
@NoArgsConstructor
public class WeatherObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime observationTime;

    private Double temperature;

    private Double humidity;

    private Double pressure;

    private Double dewPoint;

    private Double windChill;

    private Double heatIndex;

    private Double windSpeed;

    private Double averageWindSpeed;

    private Double windGust;

    private Integer windDirection;

    private Integer averageWindDirection;

    private Double rain;

    private Double rainRate;

    private Double insideTemperature;

    private Double insideHumidity;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}