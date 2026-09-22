package com.meteoinsight.backend.controller;

import com.meteoinsight.backend.dto.TemperatureDaily;
import com.meteoinsight.backend.dto.RainDaily;
import com.meteoinsight.backend.dto.WeatherStatistics;
import com.meteoinsight.backend.entity.WeatherObservation;
import com.meteoinsight.backend.service.CsvImportService;
import com.meteoinsight.backend.service.WeatherObservationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.meteoinsight.backend.dto.WindDirectionStats;

import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/observations")
public class WeatherObservationController {

    private final WeatherObservationService service;
    private final CsvImportService csvImportService;

    public WeatherObservationController(
            WeatherObservationService service,
            CsvImportService csvImportService) {

        this.service = service;
        this.csvImportService = csvImportService;
    }

    @GetMapping
    public List<WeatherObservation> getAllObservations() {
        return service.getAllObservations();
    }

    @PostMapping
    public WeatherObservation saveObservation(
            @RequestBody WeatherObservation observation) {

        return service.saveObservation(observation);
    }

    @GetMapping("/latest")
    public WeatherObservation getLatestObservation() {

        return service.getLatestObservation()
                .orElseThrow(() ->
                        new RuntimeException(
                                "No hay observaciones disponibles"
                        )
                );
    }

    @GetMapping("/recent")
    public List<WeatherObservation> getRecentObservations(
            @RequestParam(defaultValue = "24") int limit) {

        return service.getRecentObservations(limit);
    }

    @GetMapping("/history")
    public List<WeatherObservation> getHistory(
            @RequestParam(defaultValue = "1") int days) {

        LocalDateTime dateTime =
                LocalDateTime.now().minusDays(days);

        return service.getObservationsAfter(
                dateTime,
                days
        );
    }

    @GetMapping("/stats")
    public WeatherStatistics getStatistics() {
        return service.getStatistics();
    }

    @GetMapping("/wind/directions")
public List<WindDirectionStats> getWindDirectionStats() {

    return service.getWindDirectionStats();
}

    @GetMapping("/rain/monthly")
    public List<RainDaily> getMonthlyRain(
            @RequestParam int year,
            @RequestParam int month) {

        return service.getDailyRain(year, month);
    }

    @GetMapping("/temperature/monthly")
public List<TemperatureDaily> getMonthlyTemperature(
        @RequestParam int year,
        @RequestParam int month) {

    return service.getDailyTemperature(
            year,
            month
    );
}

    @GetMapping("/rain/daily")
    public List<RainDaily> getDailyRain() {
        return service.getDailyRain();
    }

    /*
     * =========================================================
     * FORECAST
     * =========================================================
     */

    @GetMapping("/forecast")
    public List<?> getForecast() {
        return service.getForecast();
    }

    @PostMapping("/import")
    public String importCsv(
            @RequestParam("file") MultipartFile file) {

        csvImportService.importCsv(file);

        return "CSV importado correctamente";
    }

    @GetMapping("/historical")
public WeatherObservation getHistoricalObservation(
        @RequestParam String date,
        @RequestParam String time) {

    LocalDate selectedDate =
            LocalDate.parse(date);

    LocalTime selectedTime =
            LocalTime.parse(time);

    LocalDateTime dateTime =
            LocalDateTime.of(
                    selectedDate,
                    selectedTime
            );

    return service
            .getHistoricalObservation(dateTime)
            .orElseThrow(() ->
                    new RuntimeException(
                            "No hay mediciones disponibles para la fecha y hora solicitadas"
                    )
            );
}
}

