package com.meteoinsight.backend.dto;

public class TemperatureDaily {

    private String date;
    private Double averageTemperature;
    private Double minTemperature;
    private Double maxTemperature;

    public TemperatureDaily(
            String date,
            Double averageTemperature,
            Double minTemperature,
            Double maxTemperature) {

        this.date = date;
        this.averageTemperature = averageTemperature;
        this.minTemperature = minTemperature;
        this.maxTemperature = maxTemperature;
    }

    public String getDate() {
        return date;
    }

    public Double getAverageTemperature() {
        return averageTemperature;
    }

    public Double getMinTemperature() {
        return minTemperature;
    }

    public Double getMaxTemperature() {
        return maxTemperature;
    }
}