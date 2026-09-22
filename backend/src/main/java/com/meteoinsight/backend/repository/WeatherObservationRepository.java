package com.meteoinsight.backend.repository;

import com.meteoinsight.backend.entity.WeatherObservation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WeatherObservationRepository
        extends JpaRepository<WeatherObservation, Long> {

    Optional<WeatherObservation> findTopByOrderByObservationTimeDesc();

    List<WeatherObservation> findByOrderByObservationTimeDesc(
            Pageable pageable
    );

    List<WeatherObservation> findByObservationTimeAfterOrderByObservationTimeAsc(
            LocalDateTime dateTime
    );

    boolean existsByObservationTime(
            LocalDateTime observationTime
    );

    @Query(value = """
            SELECT
                DATE(observation_time) AS date,
                MAX(rain) AS rain
            FROM weather_observations
            WHERE observation_time >= :startDate
              AND observation_time < :endDate
            GROUP BY DATE(observation_time)
            ORDER BY DATE(observation_time)
            """, nativeQuery = true)
    List<Object[]> findDailyRain(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query(value = """
        SELECT
            DATE(observation_time) AS date,
            AVG(temperature) AS average_temperature,
            MIN(temperature) AS min_temperature,
            MAX(temperature) AS max_temperature
        FROM weather_observations
        WHERE observation_time >= :startDate
          AND observation_time < :endDate
          AND temperature IS NOT NULL
        GROUP BY DATE(observation_time)
        ORDER BY DATE(observation_time)
        """, nativeQuery = true)
List<Object[]> findDailyTemperature(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
);

@Query("""
    SELECT w
    FROM WeatherObservation w
    WHERE w.observationTime <= :dateTime
    ORDER BY w.observationTime DESC
""")
List<WeatherObservation> findPreviousObservation(
        @Param("dateTime") LocalDateTime dateTime,
        Pageable pageable
);

@Query("""
    SELECT w
    FROM WeatherObservation w
    WHERE w.observationTime >= :dateTime
    ORDER BY w.observationTime ASC
""")
List<WeatherObservation> findNextObservation(
        @Param("dateTime") LocalDateTime dateTime,
        Pageable pageable
);
}
