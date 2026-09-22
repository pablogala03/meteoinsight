package com.meteoinsight.backend.dto;

public class RainDaily {

    private String date;
    private Double rain;

    public RainDaily() {
    }

    public RainDaily(String date, Double rain) {
        this.date = date;
        this.rain = rain;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Double getRain() {
        return rain;
    }

    public void setRain(Double rain) {
        this.rain = rain;
    }
}
