package com.meteoinsight.backend.service;

import com.meteoinsight.backend.entity.WeatherObservation;
import com.meteoinsight.backend.repository.WeatherObservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CsvImportService {

    private final WeatherObservationRepository repository;

    public CsvImportService(WeatherObservationRepository repository) {
        this.repository = repository;
    }

    public void importCsv(MultipartFile file) {

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        int contador = 0;
        int duplicados = 0;
        int filasIgnoradas = 0;
        int fechasMostradas = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        file.getInputStream(),
                        StandardCharsets.UTF_16LE))) {

            String line;

            // Saltar cabecera
            reader.readLine();

            while ((line = reader.readLine()) != null) {

                // Ignorar líneas vacías
                if (line.isBlank()) {
                    filasIgnoradas++;
                    continue;
                }

                String[] row = line.split(";", -1);

                // Necesitamos al menos las columnas utilizadas
                if (row.length < 17) {
                    filasIgnoradas++;
                    continue;
                }

                // Comprobar que existe fecha
                if (row[0] == null || row[0].trim().isEmpty()) {
                    filasIgnoradas++;
                    continue;
                }

                LocalDateTime observationTime;

                try {
                    observationTime = LocalDateTime.parse(
                            row[0].trim(),
                            formatter
                    );

                    // PRUEBA TEMPORAL:
                    // Mostrar las primeras 5 fechas leídas del CSV
                    if (fechasMostradas < 5) {
                        System.out.println(
                                "FECHA LEÍDA DEL CSV: " + observationTime
                        );
                        fechasMostradas++;
                    }

                } catch (Exception e) {
                    filasIgnoradas++;
                    continue;
                }

                // Evitar duplicados
                if (repository.existsByObservationTime(observationTime)) {
                    duplicados++;
                    continue;
                }

                WeatherObservation observation =
                        new WeatherObservation();

                observation.setObservationTime(observationTime);

                // Temperaturas
                observation.setInsideTemperature(
                        parseDouble(row[1])
                );

                observation.setTemperature(
                        parseDouble(row[2])
                );

                observation.setWindChill(
                        parseDouble(row[3])
                );

                observation.setDewPoint(
                        parseDouble(row[5])
                );

                observation.setHeatIndex(
                        parseDouble(row[7])
                );

                // Humedad
                observation.setInsideHumidity(
                        parseDouble(row[8])
                );

                observation.setHumidity(
                        parseDouble(row[9])
                );

                // Viento
                observation.setWindGust(
                        parseDouble(row[10])
                );

                observation.setAverageWindSpeed(
                        parseDouble(row[11])
                );

                Double direccion = parseDouble(row[12]);

                if (direccion != null) {

                    observation.setAverageWindDirection(
                            direccion.intValue()
                    );

                    observation.setWindDirection(
                            direccion.intValue()
                    );
                }

                // Presión
                observation.setPressure(
                        parseDouble(row[13])
                );

                // Lluvia
                observation.setRain(
                        parseDouble(row[14])
                );

                observation.setRainRate(
                        parseDouble(row[16])
                );

                repository.save(observation);

                contador++;
            }

            System.out.println("==================================");
            System.out.println("IMPORTACIÓN FINALIZADA");
            System.out.println("Registros importados: " + contador);
            System.out.println("Duplicados ignorados: " + duplicados);
            System.out.println("Filas ignoradas: " + filasIgnoradas);
            System.out.println("==================================");

        } catch (Exception e) {

            e.printStackTrace();

            throw new RuntimeException(
                    "Error al importar el CSV",
                    e
            );
        }
    }

    private Double parseDouble(String value) {

        if (value == null) {
            return null;
        }

        value = value.trim();

        if (value.isEmpty()) {
            return null;
        }

        // Elimina separador de miles
        value = value.replace(",", "");

        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}