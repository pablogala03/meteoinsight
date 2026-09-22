package com.meteoinsight.backend.dto;

public class StationDTO {

    private String name;
    private String location;
    private double latitude;
    private double longitude;

    public StationDTO(String name, String location, double latitude, double longitude) {
        this.name = name;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getName() {
        return name;
    }

    public String getLocation() {
        return location;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}