package com.meteoinsight.backend.dto;

public class WeatherStatistics {

    private Double currentTemperature;
    private Double minTemperature;
    private Double maxTemperature;
    private Double averageTemperature;

    private Double currentHumidity;
    private Double minHumidity;
    private Double maxHumidity;
    private Double averageHumidity;

    private Double currentPressure;
    private Double minPressure;
    private Double maxPressure;
    private Double averagePressure;

    // =====================================================
    // VIENTO
    // =====================================================

    private Double currentWindSpeed;
    private Double minWindSpeed;
    private Double maxWindSpeed;
    private Double averageWindSpeed;
    private Double maxWindGust;

    private Double totalRain;

    public WeatherStatistics() {
    }

    public Double getCurrentTemperature() {
        return currentTemperature;
    }

    public void setCurrentTemperature(Double currentTemperature) {
        this.currentTemperature = currentTemperature;
    }

    public Double getMinTemperature() {
        return minTemperature;
    }

    public void setMinTemperature(Double minTemperature) {
        this.minTemperature = minTemperature;
    }

    public Double getMaxTemperature() {
        return maxTemperature;
    }

    public void setMaxTemperature(Double maxTemperature) {
        this.maxTemperature = maxTemperature;
    }

    public Double getAverageTemperature() {
        return averageTemperature;
    }

    public void setAverageTemperature(Double averageTemperature) {
        this.averageTemperature = averageTemperature;
    }

    public Double getCurrentHumidity() {
        return currentHumidity;
    }

    public void setCurrentHumidity(Double currentHumidity) {
        this.currentHumidity = currentHumidity;
    }

    public void setMinHumidity(Double minHumidity) {
        this.minHumidity = minHumidity;
    }

    public Double getMinHumidity() {
        return minHumidity;
    }

    public Double getMaxHumidity() {
        return maxHumidity;
    }

    public void setMaxHumidity(Double maxHumidity) {
        this.maxHumidity = maxHumidity;
    }

    public Double getAverageHumidity() {
        return averageHumidity;
    }

    public void setAverageHumidity(Double averageHumidity) {
        this.averageHumidity = averageHumidity;
    }

    public Double getCurrentPressure() {
        return currentPressure;
    }

    public void setCurrentPressure(Double currentPressure) {
        this.currentPressure = currentPressure;
    }

    public Double getMinPressure() {
        return minPressure;
    }

    public void setMinPressure(Double minPressure) {
        this.minPressure = minPressure;
    }

    public Double getMaxPressure() {
        return maxPressure;
    }

    public void setMaxPressure(Double maxPressure) {
        this.maxPressure = maxPressure;
    }

    public Double getAveragePressure() {
        return averagePressure;
    }

    public void setAveragePressure(Double averagePressure) {
        this.averagePressure = averagePressure;
    }

    // =====================================================
    // VIENTO
    // =====================================================

    public Double getCurrentWindSpeed() {
        return currentWindSpeed;
    }

    public void setCurrentWindSpeed(Double currentWindSpeed) {
        this.currentWindSpeed = currentWindSpeed;
    }

    public Double getMinWindSpeed() {
        return minWindSpeed;
    }

    public void setMinWindSpeed(Double minWindSpeed) {
        this.minWindSpeed = minWindSpeed;
    }

    public Double getMaxWindSpeed() {
        return maxWindSpeed;
    }

    public void setMaxWindSpeed(Double maxWindSpeed) {
        this.maxWindSpeed = maxWindSpeed;
    }

    public Double getAverageWindSpeed() {
        return averageWindSpeed;
    }

    public void setAverageWindSpeed(Double averageWindSpeed) {
        this.averageWindSpeed = averageWindSpeed;
    }

    public Double getMaxWindGust() {
        return maxWindGust;
    }

    public void setMaxWindGust(Double maxWindGust) {
        this.maxWindGust = maxWindGust;
    }

    // =====================================================
    // LLUVIA
    // =====================================================

    public Double getTotalRain() {
        return totalRain;
    }

    public void setTotalRain(Double totalRain) {
        this.totalRain = totalRain;
    }
}