package com.meteoinsight.backend.service;

import com.meteoinsight.backend.dto.WindDirectionStats;
import com.meteoinsight.backend.dto.TemperatureDaily;
import com.meteoinsight.backend.dto.RainDaily;
import com.meteoinsight.backend.dto.WeatherStatistics;
import com.meteoinsight.backend.entity.WeatherObservation;
import com.meteoinsight.backend.repository.WeatherObservationRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@Service
public class WeatherObservationService {

    private final WeatherObservationRepository repository;

    public WeatherObservationService(
            WeatherObservationRepository repository) {

        this.repository = repository;
    }

    public List<WeatherObservation> getAllObservations() {
        return repository.findAll();
    }

    public WeatherObservation saveObservation(
            WeatherObservation observation) {

        return repository.save(observation);
    }

    public Optional<WeatherObservation> getLatestObservation() {

        return repository.findTopByOrderByObservationTimeDesc();
    }

    public List<WeatherObservation> getRecentObservations(
            int limit) {

        return repository.findByOrderByObservationTimeDesc(
                PageRequest.of(0, limit)
        );
    }

    public Optional<WeatherObservation> getHistoricalObservation(
        LocalDateTime dateTime) {

    // ---------------------------------------------------------
    // Medición anterior o exactamente en la hora solicitada
    // ---------------------------------------------------------

    List<WeatherObservation> previous =
            repository.findPreviousObservation(
                    dateTime,
                    PageRequest.of(0, 1)
            );

    // ---------------------------------------------------------
    // Medición posterior o exactamente en la hora solicitada
    // ---------------------------------------------------------

    List<WeatherObservation> next =
            repository.findNextObservation(
                    dateTime,
                    PageRequest.of(0, 1)
            );

    // ---------------------------------------------------------
    // No existen datos alrededor de la fecha solicitada
    // ---------------------------------------------------------

    if (previous.isEmpty() && next.isEmpty()) {
        return Optional.empty();
    }

    // Si solo existe una de las dos mediciones
    if (previous.isEmpty()) {
        return Optional.of(next.get(0));
    }

    if (next.isEmpty()) {
        return Optional.of(previous.get(0));
    }

    // ---------------------------------------------------------
    // Tenemos una medición anterior y otra posterior.
    // Elegimos la que esté más cerca de la hora solicitada.
    // ---------------------------------------------------------

    WeatherObservation previousObservation =
            previous.get(0);

    WeatherObservation nextObservation =
            next.get(0);

    long previousDifference =
            Math.abs(
                    java.time.Duration.between(
                            previousObservation.getObservationTime(),
                            dateTime
                    ).toSeconds()
            );

    long nextDifference =
            Math.abs(
                    java.time.Duration.between(
                            dateTime,
                            nextObservation.getObservationTime()
                    ).toSeconds()
            );

    if (previousDifference <= nextDifference) {
        return Optional.of(previousObservation);
    }

    return Optional.of(nextObservation);
}

    public List<WeatherObservation> getObservationsAfter(
            LocalDateTime dateTime,
            int days) {

        List<WeatherObservation> observations =
                repository.findByObservationTimeAfterOrderByObservationTimeAsc(
                        dateTime
                );

        /*
         * Muestreo de datos para las gráficas.
         *
         * 24 horas -> todos los registros
         * 7 días   -> 1 de cada 3 registros (~30 min)
         * 30 días  -> 1 de cada 12 registros (~2 horas)
         */

        int intervalo;

        if (days <= 1) {
            intervalo = 1;
        } else if (days <= 7) {
            intervalo = 3;
        } else {
            intervalo = 12;
        }

        if (intervalo == 1) {
            return observations;
        }

        List<WeatherObservation> sampledObservations =
                new ArrayList<>();

        for (int i = 0;
             i < observations.size();
             i += intervalo) {

            sampledObservations.add(
                    observations.get(i)
            );
        }

        /*
         * Añadimos siempre la última medición disponible
         * para que la gráfica termine en el dato más reciente.
         */

        if (!observations.isEmpty()) {

            WeatherObservation lastObservation =
                    observations.get(
                            observations.size() - 1
                    );

            if (sampledObservations.isEmpty()
                    || sampledObservations.get(
                            sampledObservations.size() - 1
                    ).getId() != lastObservation.getId()) {

                sampledObservations.add(
                        lastObservation
                );
            }
        }

        return sampledObservations;
    }

    /*
     * =========================================================
     * LLUVIA DIARIA - TODOS LOS DATOS DISPONIBLES
     * =========================================================
     */

    public List<RainDaily> getDailyRain() {

        List<WeatherObservation> observations =
                repository.findAll();

        List<RainDaily> result =
                new ArrayList<>();

        if (observations.isEmpty()) {
            return result;
        }

        LocalDate currentDate = null;
        double dailyRain = 0.0;

        for (WeatherObservation observation : observations) {

            if (observation.getObservationTime() == null) {
                continue;
            }

            LocalDate observationDate =
                    observation.getObservationTime().toLocalDate();

            if (currentDate == null) {
                currentDate = observationDate;
            }

            if (!observationDate.equals(currentDate)) {

                result.add(
                        new RainDaily(
                                currentDate.toString(),
                                dailyRain
                        )
                );

                currentDate = observationDate;
                dailyRain = 0.0;
            }

            /*
             * "rain" es el acumulado diario.
             * El valor máximo representa la lluvia total
             * registrada durante ese día.
             */

            if (observation.getRain() != null) {

                dailyRain = Math.max(
                        dailyRain,
                        observation.getRain()
                );
            }
        }

        /*
         * Guardamos el último día.
         */

        if (currentDate != null) {

            result.add(
                    new RainDaily(
                            currentDate.toString(),
                            dailyRain
                    )
            );
        }

        return result;
    }

    /*
     * =========================================================
     * LLUVIA DIARIA - MES CONCRETO
     * =========================================================
     */

    public List<RainDaily> getDailyRain(
            int year,
            int month) {

        YearMonth yearMonth =
                YearMonth.of(year, month);

        LocalDateTime startDate =
                yearMonth
                        .atDay(1)
                        .atStartOfDay();

        LocalDateTime endDate =
                yearMonth
                        .plusMonths(1)
                        .atDay(1)
                        .atStartOfDay();

        List<Object[]> results =
                repository.findDailyRain(
                        startDate,
                        endDate
                );

        List<RainDaily> dailyRain =
                new ArrayList<>();

        for (Object[] row : results) {

            String date =
                    row[0].toString();

            Double rain =
                    row[1] != null
                            ? ((Number) row[1]).doubleValue()
                            : 0.0;

            dailyRain.add(
                    new RainDaily(
                            date,
                            rain
                    )
            );
        }

        return dailyRain;
    }

    /*
     * =========================================================
     * LLUVIA MENSUAL
     * =========================================================
     */

    public Double getMonthlyRain(
            int year,
            int month) {

        List<RainDaily> dailyRain =
                getDailyRain(
                        year,
                        month
                );

        return dailyRain.stream()
                .mapToDouble(
                        RainDaily::getRain
                )
                .sum();
    }

    public List<TemperatureDaily> getDailyTemperature(
        int year,
        int month) {

    YearMonth yearMonth =
            YearMonth.of(year, month);

    LocalDateTime startDate =
            yearMonth
                    .atDay(1)
                    .atStartOfDay();

    LocalDateTime endDate =
            yearMonth
                    .plusMonths(1)
                    .atDay(1)
                    .atStartOfDay();

    List<Object[]> results =
            repository.findDailyTemperature(
                    startDate,
                    endDate
            );

    List<TemperatureDaily> dailyTemperature =
            new ArrayList<>();

    for (Object[] row : results) {

        String date =
                row[0].toString();

        Double average =
                row[1] != null
                        ? ((Number) row[1]).doubleValue()
                        : null;

        Double minimum =
                row[2] != null
                        ? ((Number) row[2]).doubleValue()
                        : null;

        Double maximum =
                row[3] != null
                        ? ((Number) row[3]).doubleValue()
                        : null;

        dailyTemperature.add(
                new TemperatureDaily(
                        date,
                        average,
                        minimum,
                        maximum
                )
        );
    }

    return dailyTemperature;
}

    /*
     * =========================================================
     * FORECAST
     * =========================================================
     *
     * De momento devolvemos los últimos datos disponibles
     * para preparar la estructura del Forecast.
     *
     * En el siguiente paso sustituiremos esta lógica por
     * una previsión meteorológica real.
     */

    public List<?> getForecast() {

        List<WeatherObservation> observations =
                repository.findByOrderByObservationTimeDesc(
                        PageRequest.of(0, 5)
                );

        return observations;
    }

    public List<WindDirectionStats> getWindDirectionStats() {

    List<WeatherObservation> observations =
            repository.findAll();

    String[] directions = {
            "N",
            "NE",
            "E",
            "SE",
            "S",
            "SO",
            "O",
            "NO"
    };

    int[] degrees = {
            0,
            45,
            90,
            135,
            180,
            225,
            270,
            315
    };

    Map<String, Long> counts =
            new HashMap<>();

    for (String direction : directions) {
        counts.put(direction, 0L);
    }

    long total = 0;

    for (WeatherObservation observation : observations) {

        if (observation.getWindDirection() == null) {
            continue;
        }

        int windDirection =
                observation.getWindDirection();

        /*
         * Convertimos los grados en una de las
         * 8 direcciones principales.
         *
         * 0°   -> N
         * 45°  -> NE
         * 90°  -> E
         * etc.
         */

        int index =
                (int) Math.round(
                        windDirection / 45.0
                ) % 8;

        String direction =
                directions[index];

        counts.put(
                direction,
                counts.get(direction) + 1
        );

        total++;
    }

    List<WindDirectionStats> result =
            new ArrayList<>();

    for (int i = 0; i < directions.length; i++) {

        long count =
                counts.get(directions[i]);

        double percentage =
                total > 0
                        ? (count * 100.0) / total
                        : 0;

        result.add(
                new WindDirectionStats(
                        directions[i],
                        degrees[i],
                        count,
                        percentage
                )
        );
    }

    return result;
}

    /*
     * =========================================================
     * ESTADÍSTICAS GENERALES
     * =========================================================
     */

    public WeatherStatistics getStatistics() {

        List<WeatherObservation> observations =
                repository.findAll();

        if (observations.isEmpty()) {

            throw new RuntimeException(
                    "No hay observaciones disponibles"
            );
        }

        WeatherStatistics stats =
                new WeatherStatistics();

        WeatherObservation latest =
                repository
                        .findTopByOrderByObservationTimeDesc()
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "No hay observaciones disponibles"
                                )
                        );

        // =====================================================
        // TEMPERATURA
        // =====================================================

        stats.setCurrentTemperature(
                latest.getTemperature()
        );

        stats.setMinTemperature(
                observations.stream()
                        .map(
                                WeatherObservation::getTemperature
                        )
                        .filter(
                                value -> value != null
                        )
                        .min(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setMaxTemperature(
                observations.stream()
                        .map(
                                WeatherObservation::getTemperature
                        )
                        .filter(
                                value -> value != null
                        )
                        .max(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setAverageTemperature(
                observations.stream()
                        .map(
                                WeatherObservation::getTemperature
                        )
                        .filter(
                                value -> value != null
                        )
                        .mapToDouble(
                                Double::doubleValue
                        )
                        .average()
                        .orElse(0)
        );

        // =====================================================
        // HUMEDAD
        // =====================================================

        stats.setCurrentHumidity(
                latest.getHumidity()
        );

        stats.setMinHumidity(
                observations.stream()
                        .map(
                                WeatherObservation::getHumidity
                        )
                        .filter(
                                value -> value != null
                        )
                        .min(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setMaxHumidity(
                observations.stream()
                        .map(
                                WeatherObservation::getHumidity
                        )
                        .filter(
                                value -> value != null
                        )
                        .max(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setAverageHumidity(
                observations.stream()
                        .map(
                                WeatherObservation::getHumidity
                        )
                        .filter(
                                value -> value != null
                        )
                        .mapToDouble(
                                Double::doubleValue
                        )
                        .average()
                        .orElse(0)
        );

        // =====================================================
        // PRESIÓN
        // =====================================================

        stats.setCurrentPressure(
                latest.getPressure()
        );

        stats.setMinPressure(
                observations.stream()
                        .map(
                                WeatherObservation::getPressure
                        )
                        .filter(
                                value -> value != null
                        )
                        .min(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setMaxPressure(
                observations.stream()
                        .map(
                                WeatherObservation::getPressure
                        )
                        .filter(
                                value -> value != null
                        )
                        .max(
                                Double::compareTo
                        )
                        .orElse(null)
        );

        stats.setAveragePressure(
                observations.stream()
                        .map(
                                WeatherObservation::getPressure
                        )
                        .filter(
                                value -> value != null
                        )
                        .mapToDouble(
                                Double::doubleValue
                        )
                        .average()
                        .orElse(0)
        );

        // =====================================================
// VIENTO
// =====================================================

stats.setCurrentWindSpeed(
        latest.getAverageWindSpeed()
);

stats.setMinWindSpeed(
        observations.stream()
                .map(WeatherObservation::getAverageWindSpeed)
                .filter(value -> value != null)
                .min(Double::compareTo)
                .orElse(null)
);

stats.setMaxWindSpeed(
        observations.stream()
                .map(WeatherObservation::getAverageWindSpeed)
                .filter(value -> value != null)
                .max(Double::compareTo)
                .orElse(null)
);

stats.setAverageWindSpeed(
        observations.stream()
                .map(WeatherObservation::getAverageWindSpeed)
                .filter(value -> value != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0)
);

stats.setMaxWindGust(
        observations.stream()
                .map(WeatherObservation::getWindGust)
                .filter(value -> value != null)
                .max(Double::compareTo)
                .orElse(null)
);

        // =====================================================
        // LLUVIA
        // =====================================================

        /*
         * "rain" se reinicia cada día.
         *
         * Por eso no sumamos directamente todas las
         * observaciones.
         */

        List<RainDaily> dailyRain =
                getDailyRain();

        double totalRain =
                dailyRain.stream()
                        .mapToDouble(
                                RainDaily::getRain
                        )
                        .sum();

        stats.setTotalRain(
                totalRain
        );

        return stats;
    }
}

