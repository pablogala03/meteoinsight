package com.meteoinsight.backend.dto;

public class WindDirectionStats {

    private String direction;
    private int degrees;
    private long count;
    private double percentage;

    public WindDirectionStats(
            String direction,
            int degrees,
            long count,
            double percentage) {

        this.direction = direction;
        this.degrees = degrees;
        this.count = count;
        this.percentage = percentage;
    }

    public String getDirection() {
        return direction;
    }

    public int getDegrees() {
        return degrees;
    }

    public long getCount() {
        return count;
    }

    public double getPercentage() {
        return percentage;
    }
}