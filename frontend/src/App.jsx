import StationMap from "./Components/StationMap";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentObservations, setRecentObservations] = useState([]);
  const [rainDaily, setRainDaily] = useState([]);
  const [temperatureDaily, setTemperatureDaily] = useState([]);

  const [period, setPeriod] = useState(1);

  const [windDirections, setWindDirections] = useState([]);

  const [forecast, setForecast] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

    // =========================================================
  // CONSULTA HISTÓRICA
  // =========================================================

  const [historicalDate, setHistoricalDate] = useState("");
  const [historicalTime, setHistoricalTime] = useState("");

  const [historicalObservation, setHistoricalObservation] =
    useState(null);

  const [historicalLoading, setHistoricalLoading] =
    useState(false);

  const [historicalError, setHistoricalError] =
    useState(null);

  const [rainYear, setRainYear] = useState(2026);
  const [rainMonth, setRainMonth] = useState(8);

  const [temperatureYear, setTemperatureYear] = useState(2026);
  const [temperatureMonth, setTemperatureMonth] = useState(8);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================================
  // FUNCIONES PARA LAS ESTADÍSTICAS
  // =========================================================

  const getNumericValues = (data, field) => {
    return data
      .map((item) => item[field])
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !Number.isNaN(Number(value))
      )
      .map(Number);
  };

  const getMin = (data, field) => {
    const values = getNumericValues(data, field);

    if (values.length === 0) {
      return null;
    }

    return Math.min(...values);
  };

  const getMax = (data, field) => {
    const values = getNumericValues(data, field);

    if (values.length === 0) {
      return null;
    }

    return Math.max(...values);
  };

  const getAverage = (data, field) => {
    const values = getNumericValues(data, field);

    if (values.length === 0) {
      return null;
    }

    return (
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length
    );
  };

  // =========================================================
  // COLOR DE TEMPERATURA
  // =========================================================

  const getTemperatureColor = (temperature) => {
    const value = Number(temperature);

    if (value < 0) {
      return "#8b5cf6";
    }

    if (value < 10) {
      return "#3b82f6";
    }

    if (value < 15) {
      return "#14b8a6";
    }

    if (value < 20) {
      return "#22c55e";
    }

    if (value < 30) {
      return "#f97316";
    }

    if (value <= 40) {
      return "#ef4444";
    }

    return "#7f1d1d";
  };

  // =========================================================
  // ESTADO METEOROLÓGICO
  // =========================================================

  const getWeatherCondition = (weather) => {
    if (!weather) {
      return {
        icon: "🌤️",
        text: "Sin datos",
      };
    }

    const rain = Number(weather.rain || 0);
    const rainRate = Number(weather.rainRate || 0);
    const humidity = Number(weather.humidity || 0);

    if (rainRate > 0 || rain > 0) {
      return {
        icon: "🌧️",
        text: "Lluvia",
      };
    }

    if (humidity >= 85) {
      return {
        icon: "☁️",
        text: "Muy nuboso",
      };
    }

    if (humidity >= 70) {
      return {
        icon: "⛅",
        text: "Parcialmente nuboso",
      };
    }

    return {
      icon: "☀️",
      text: "Despejado",
    };
  };

  // =========================================================
  // INTERPRETAR CÓDIGOS DE PREVISIÓN
  // =========================================================

  const getForecastCondition = (code) => {
    const weatherCode = Number(code);

    if (weatherCode === 0) {
      return { icon: "☀️", text: "Despejado" };
    }

    if ([1, 2].includes(weatherCode)) {
      return { icon: "⛅", text: "Parcialmente nuboso" };
    }

    if (weatherCode === 3) {
      return { icon: "☁️", text: "Nublado" };
    }

    if ([45, 48].includes(weatherCode)) {
      return { icon: "🌫️", text: "Niebla" };
    }

    if ([51, 53, 55, 56, 57].includes(weatherCode)) {
      return { icon: "🌦️", text: "Llovizna" };
    }

    if ([61, 63, 65, 66, 67].includes(weatherCode)) {
      return { icon: "🌧️", text: "Lluvia" };
    }

    if ([71, 73, 75, 77].includes(weatherCode)) {
      return { icon: "🌨️", text: "Nieve" };
    }

    if ([80, 81, 82].includes(weatherCode)) {
      return { icon: "🌦️", text: "Chubascos" };
    }

    if ([85, 86].includes(weatherCode)) {
      return { icon: "🌨️", text: "Chubascos de nieve" };
    }

    if ([95, 96, 99].includes(weatherCode)) {
      return { icon: "⛈️", text: "Tormenta" };
    }

    return { icon: "🌤️", text: "Variable" };
  };

  // =========================================================
  // NORMALIZAR DATOS DE LAS OBSERVACIONES
  // =========================================================

  const normalizeObservation = (observation) => {
    return {
      ...observation,

      temperature:
        observation.temperature !== null &&
        observation.temperature !== undefined &&
        observation.temperature !== ""
          ? Number(observation.temperature)
          : null,

      humidity:
        observation.humidity !== null &&
        observation.humidity !== undefined &&
        observation.humidity !== ""
          ? Number(observation.humidity)
          : null,

      pressure:
        observation.pressure !== null &&
        observation.pressure !== undefined &&
        observation.pressure !== ""
          ? Number(observation.pressure)
          : null,
    };
  };

    // =========================================================
  // BUSCAR MEDICIÓN HISTÓRICA
  // =========================================================

  const searchHistoricalObservation = async () => {

    if (!historicalDate || !historicalTime) {
      setHistoricalError(
        "Selecciona una fecha y una hora."
      );

      setHistoricalObservation(null);

      return;
    }

    setHistoricalLoading(true);
    setHistoricalError(null);
    setHistoricalObservation(null);

    try {

      const response = await fetch(
        `http://localhost:8080/api/v1/observations/historical?date=${historicalDate}&time=${historicalTime}`
      );

      if (!response.ok) {
        throw new Error(
          "No existe ninguna medición para la fecha solicitada."
        );
      }

      const data = await response.json();

      setHistoricalObservation(
        normalizeObservation(data)
      );

    } catch (error) {

      console.error(error);

      setHistoricalError(
        error.message ||
        "No se ha podido obtener la medición."
      );

    } finally {

      setHistoricalLoading(false);

    }
  };

  const setHistoricalPreset = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const localDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    setHistoricalDate(localDate);
    setHistoricalTime("12:00");
    setHistoricalError(null);
    setHistoricalObservation(null);
  };

  // =========================================================
  // CARGA DE DATOS RECIENTES
  // =========================================================

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(
        "http://localhost:8080/api/v1/observations/latest"
      ),

      fetch(
        "http://localhost:8080/api/v1/observations/stats"
      ),

      fetch(
        `http://localhost:8080/api/v1/observations/history?days=${period}`
      ),
    ])
      .then(
        async ([
          weatherResponse,
          statsResponse,
          historyResponse,
        ]) => {
          if (
            !weatherResponse.ok ||
            !statsResponse.ok ||
            !historyResponse.ok
          ) {
            throw new Error(
              "No se han podido obtener las mediciones"
            );
          }

          const weatherData =
            await weatherResponse.json();

          const statsData =
            await statsResponse.json();

          const historyData =
            await historyResponse.json();

          setWeather(weatherData);
          setStats(statsData);

          // ---------------------------------------------------
          // NORMALIZAR HISTÓRICO
          // ---------------------------------------------------

          const historyArray = Array.isArray(historyData)
            ? historyData
            : [];

          const chartData = historyArray
            .map(normalizeObservation)
            .filter(
              (observation) =>
                observation.observationTime
            );

          setRecentObservations(chartData);

          setLoading(false);
        }
      )
      .catch((error) => {
        console.error(error);

        setError(error.message);

        setLoading(false);
      });
  }, [period]);

  useEffect(() => {

  fetch(
    "http://localhost:8080/api/v1/observations/wind/directions"
  )
    .then((response) => {

      if (!response.ok) {
        throw new Error(
          "No se han podido obtener los datos del viento"
        );
      }

      return response.json();

    })
    .then((data) => {

      setWindDirections(data);

    })
    .catch((error) => {

      console.error(error);

      setWindDirections([]);

    });

}, []);

  // =========================================================
  // CARGA DE PREVISIÓN METEOROLÓGICA
  // =========================================================

  useEffect(() => {
    const loadForecast = async () => {
      setForecastLoading(true);
      setForecastError(null);

      try {
        const stationResponse = await fetch(
          "http://localhost:8080/api/v1/station"
        );

        if (!stationResponse.ok) {
          throw new Error("No se pudo obtener la ubicación de la estación.");
        }

        const stationData = await stationResponse.json();

        const forecastResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${stationData.latitude}&longitude=${stationData.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=5`
        );

        if (!forecastResponse.ok) {
          throw new Error("No se pudo obtener la previsión meteorológica.");
        }

        const forecastData = await forecastResponse.json();

        const daily = forecastData.daily;

        const formattedForecast = daily.time.map((date, index) => ({
          date,
          weatherCode: daily.weather_code[index],
          maxTemperature: daily.temperature_2m_max[index],
          minTemperature: daily.temperature_2m_min[index],
          precipitationProbability:
            daily.precipitation_probability_max[index],
          precipitation: daily.precipitation_sum[index],
        }));

        setForecast(formattedForecast);
      } catch (error) {
        console.error("Error obteniendo la previsión:", error);
        setForecast([]);
        setForecastError(
          "No se ha podido cargar la previsión meteorológica."
        );
      } finally {
        setForecastLoading(false);
      }
    };

    loadForecast();
  }, []);

  // =========================================================
  // CARGA DE LLUVIA SEGÚN MES Y AÑO
  // =========================================================

  useEffect(() => {
    fetch(
      `http://localhost:8080/api/v1/observations/rain/monthly?year=${rainYear}&month=${rainMonth}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "No se han podido obtener los datos de lluvia"
          );
        }

        return response.json();
      })
      .then((rainData) => {
        setRainDaily(
          [...rainData].sort(
            (a, b) =>
              new Date(`${a.date}T00:00:00`) -
              new Date(`${b.date}T00:00:00`)
          )
        );
      })
      .catch((error) => {
        console.error(error);
        setRainDaily([]);
      });
  }, [rainYear, rainMonth]);

  // =========================================================
  // CARGA DE TEMPERATURA SEGÚN MES Y AÑO
  // =========================================================

  useEffect(() => {
    fetch(
      `http://localhost:8080/api/v1/observations/temperature/monthly?year=${temperatureYear}&month=${temperatureMonth}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "No se han podido obtener los datos de temperatura"
          );
        }

        return response.json();
      })
      .then((temperatureData) => {
        const formattedData = [...temperatureData]
          .map((day) => {
            const min =
              day.minTemperature !== null &&
              day.minTemperature !== undefined
                ? Number(day.minTemperature)
                : null;

            const max =
              day.maxTemperature !== null &&
              day.maxTemperature !== undefined
                ? Number(day.maxTemperature)
                : null;

            const average =
              day.averageTemperature !== null &&
              day.averageTemperature !== undefined
                ? Number(day.averageTemperature)
                : null;

            return {
              ...day,

              averageTemperature: average,

              minTemperature: min,

              maxTemperature: max,

              // Diferencia entre máxima y mínima.
              // Se utilizará para construir la barra de rango.
              temperatureRange:
                min !== null &&
                max !== null
                  ? max - min
                  : null,
            };
          })
          .sort(
            (a, b) =>
              new Date(`${a.date}T00:00:00`) -
              new Date(`${b.date}T00:00:00`)
          );

        setTemperatureDaily(formattedData);
      })
      .catch((error) => {
        console.error(error);
        setTemperatureDaily([]);
      });
  }, [
    temperatureYear,
    temperatureMonth,
  ]);

  // =========================================================
  // RESUMEN DEL VIENTO
  // =========================================================

  const validWindDirections = windDirections
    .map((item) => ({
      ...item,
      percentage: Number(item.percentage || 0),
      degrees: Number(item.degrees || 0),
    }))
    .filter((item) => Number.isFinite(item.percentage));

  const predominantWindDirection =
    validWindDirections.length > 0
      ? validWindDirections.reduce((max, item) =>
          item.percentage > max.percentage ? item : max
        )
      : null;

  const activeWindDirections = validWindDirections.filter(
    (item) => item.percentage > 0
  ).length;

  // =========================================================
  // TENDENCIAS METEOROLÓGICAS
  // =========================================================

  const getTrendAnalysis = (data, field, unit, options = {}) => {
    const values = data
      .map((item) => Number(item[field]))
      .filter((value) => Number.isFinite(value));

    if (values.length < 4) {
      return {
        direction: "stable",
        icon: "→",
        label: "Sin comparación",
        change: null,
        unit,
      };
    }

    const segmentSize = Math.max(2, Math.floor(values.length * 0.2));
    const firstSegment = values.slice(0, segmentSize);
    const lastSegment = values.slice(-segmentSize);

    const firstAverage =
      firstSegment.reduce((sum, value) => sum + value, 0) /
      firstSegment.length;

    const lastAverage =
      lastSegment.reduce((sum, value) => sum + value, 0) /
      lastSegment.length;

    const change = lastAverage - firstAverage;
    const threshold = options.threshold ?? 0.05;

    let direction = "stable";

    if (change > threshold) {
      direction = "up";
    } else if (change < -threshold) {
      direction = "down";
    }

    const labels = {
      up: options.upLabel || "En aumento",
      down: options.downLabel || "En descenso",
      stable: options.stableLabel || "Estable",
    };

    const icons = {
      up: "↗️",
      down: "↘️",
      stable: "→",
    };

    return {
      direction,
      icon: icons[direction],
      label: labels[direction],
      change,
      unit,
    };
  };

  const trendTemperature = getTrendAnalysis(
    recentObservations,
    "temperature",
    "°C",
    { threshold: 0.15 }
  );

  const trendHumidity = getTrendAnalysis(
    recentObservations,
    "humidity",
    "%",
    { threshold: 1.5 }
  );

  const trendPressure = getTrendAnalysis(
    recentObservations,
    "pressure",
    "hPa",
    { threshold: 0.8 }
  );

  const trendWind = getTrendAnalysis(
    recentObservations,
    "averageWindSpeed",
    "km/h",
    {
      threshold: 0.5,
      upLabel: "Aumentando",
      downLabel: "Disminuyendo",
      stableLabel: "Estable",
    }
  );

  const formatTrendChange = (trend) => {
    if (trend.change === null || !Number.isFinite(trend.change)) {
      return "--";
    }

    return `${trend.change > 0 ? "+" : ""}${trend.change.toFixed(1)} ${trend.unit}`;
  };

  const trendPeriodLabel =
    period === 1 ? "últimas 24 horas" : period === 7 ? "últimos 7 días" : "últimos 30 días";

  const trendResults = [
    {
      key: "temperature",
      icon: "🌡️",
      name: "Temperatura",
      trend: trendTemperature,
      description: "Comparación entre el inicio y el final del periodo.",
    },
    {
      key: "humidity",
      icon: "💧",
      name: "Humedad",
      trend: trendHumidity,
      description: "Evolución media de la humedad registrada.",
    },
    {
      key: "pressure",
      icon: "📊",
      name: "Presión",
      trend: trendPressure,
      description: "Variación de la presión atmosférica.",
    },
    {
      key: "wind",
      icon: "💨",
      name: "Viento",
      trend: trendWind,
      description: "Evolución de la velocidad media del viento.",
    },
  ];

  const trendSummaryParts = trendResults
    .filter((item) => item.trend.change !== null)
    .filter((item) => item.trend.direction !== "stable")
    .map((item) => `${item.name.toLowerCase()} ${item.trend.direction === "up" ? "en aumento" : "en descenso"}`);

  const trendSummary =
    trendSummaryParts.length === 0
      ? "Las variables analizadas se mantienen relativamente estables durante el periodo seleccionado."
      : trendSummaryParts.length === 1
        ? `Se observa ${trendSummaryParts[0]} durante el periodo seleccionado.`
        : `Se observa ${trendSummaryParts.slice(0, -1).join(", ")} y ${trendSummaryParts.at(-1)} durante el periodo seleccionado.`;

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  if (loading) {
    return (
      <div className="app">
        Cargando datos meteorológicos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        Error: {error}
      </div>
    );
  }

  // =========================================================
  // LLUVIA
  // =========================================================

  const totalMonthlyRain =
    rainDaily.reduce(
      (sum, day) =>
        sum + Number(day.rain || 0),
      0
    );

  const rainyDays =
    rainDaily.filter(
      (day) =>
        Number(day.rain || 0) > 0
    ).length;

  const maximumDailyRain =
    rainDaily.length > 0
      ? Math.max(
          ...rainDaily.map(
            (day) =>
              Number(day.rain || 0)
          )
        )
      : 0;

  // =========================================================
  // ESTADÍSTICAS DE TEMPERATURA MENSUAL
  // =========================================================

  const monthlyAverageValues =
    temperatureDaily
      .map(
        (day) =>
          day.averageTemperature
      )
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          !Number.isNaN(Number(value))
      )
      .map(Number);

  const monthlyMinimumValues =
    temperatureDaily
      .map(
        (day) =>
          day.minTemperature
      )
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          !Number.isNaN(Number(value))
      )
      .map(Number);

  const monthlyMaximumValues =
    temperatureDaily
      .map(
        (day) =>
          day.maxTemperature
      )
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          !Number.isNaN(Number(value))
      )
      .map(Number);

  const monthlyTemperatureAverage =
    monthlyAverageValues.length > 0
      ? monthlyAverageValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        monthlyAverageValues.length
      : null;

  const monthlyTemperatureMinimum =
    monthlyMinimumValues.length > 0
      ? Math.min(
          ...monthlyMinimumValues
        )
      : null;

  const monthlyTemperatureMaximum =
    monthlyMaximumValues.length > 0
      ? Math.max(
          ...monthlyMaximumValues
        )
      : null;

  const monthlyTemperatureAmplitude =
    monthlyTemperatureMinimum !== null &&
    monthlyTemperatureMaximum !== null
      ? monthlyTemperatureMaximum - monthlyTemperatureMinimum
      : null;

  const hotDays = temperatureDaily.filter(
    (day) =>
      day.maxTemperature !== null &&
      Number(day.maxTemperature) >= 30
  ).length;

  const coldestDay =
    temperatureDaily.length > 0
      ? temperatureDaily.reduce((best, day) => {
          if (day.minTemperature === null) return best;
          if (!best || Number(day.minTemperature) < Number(best.minTemperature)) {
            return day;
          }
          return best;
        }, null)
      : null;

  const hottestDay =
    temperatureDaily.length > 0
      ? temperatureDaily.reduce((best, day) => {
          if (day.maxTemperature === null) return best;
          if (!best || Number(day.maxTemperature) > Number(best.maxTemperature)) {
            return day;
          }
          return best;
        }, null)
      : null;

  // =========================================================
  // ESTADO ACTUAL
  // =========================================================

  const weatherCondition =
    getWeatherCondition(weather);

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="app">

      <header className="dashboard-header">

        <div>
          <h1>MeteoInsight</h1>

          <p>
            Monitorización meteorológica en tiempo real
          </p>
        </div>

        <div className="station-status">

          <span className="status-dot"></span>

          <span>
            Estación conectada
          </span>

        </div>

      </header>

      <main>

        {/* =====================================================
            TIEMPO ACTUAL
        ===================================================== */}

        <section className="current-weather">

          <div className="current-header">

            <div>

              <span className="section-label">
                CONDICIONES ACTUALES
              </span>

              <h2>
                Tiempo actual
              </h2>

            </div>

            <div className="current-time">

              {new Date(
                weather.observationTime
              ).toLocaleTimeString(
                "es-ES",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}

            </div>

          </div>

          <div className="weather-condition">

            <div className="weather-condition-icon">
              {weatherCondition.icon}
            </div>

            <div>

              <span className="detail-label">
                Condiciones
              </span>

              <strong>
                {weatherCondition.text}
              </strong>

            </div>

          </div>

          <div className="main-temperature">

            <span className="temperature">

              {weather.temperature !== null
                ? Number(
                    weather.temperature
                  ).toFixed(1)
                : "--"}°

            </span>

            <span className="temperature-unit">
              C
            </span>

            <span className="label">
              Temperatura actual
            </span>

          </div>

          <div className="weather-details">

            <div className="detail">

              <span className="detail-icon">
                💧
              </span>

              <div>

                <span className="detail-label">
                  Humedad
                </span>

                <strong>
                  {weather.humidity} %
                </strong>

              </div>

            </div>

            <div className="detail">

              <span className="detail-icon">
                ◉
              </span>

              <div>

                <span className="detail-label">
                  Presión
                </span>

                <strong>
                  {weather.pressure} hPa
                </strong>

              </div>

            </div>

            <div className="detail">

              <span className="detail-icon">
                ↗
              </span>

              <div>

                <span className="detail-label">
                  Viento
                </span>

                <strong>
                  {weather.averageWindSpeed} km/h
                </strong>

              </div>

            </div>

            <div className="detail">

              <span className="detail-icon">
                🧭
              </span>

              <div>

                <span className="detail-label">
                  Dirección
                </span>

                <strong>
                  {weather.averageWindDirection}°
                </strong>

              </div>

            </div>

            <div className="detail">

              <span className="detail-icon">
                ☔
              </span>

              <div>

                <span className="detail-label">
                  Lluvia
                </span>

                <strong>
                  {weather.rain} mm
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            FORECAST
        ===================================================== */}

        <section className="forecast-section">

          <div className="forecast-header">

            <div>
              <span className="section-label">
                PREVISIÓN METEOROLÓGICA
              </span>

              <h2>
                Previsión de los próximos días
              </h2>

              <p className="forecast-description">
                Previsión meteorológica para la ubicación de la estación.
              </p>
            </div>

            <div className="forecast-location">
              📍 Estación MeteoInsight
            </div>

          </div>

          <div className="forecast-model-status">

            <div className="forecast-model-icon">
              🌐
            </div>

            <div>
              <strong>
                Previsión meteorológica
              </strong>

              <span>
                Datos externos actuales · Modelo propio próximamente
              </span>
            </div>

            <div className="forecast-model-badge">
              PREVISIÓN
            </div>

          </div>

          {forecastLoading ? (

            <div className="forecast-grid">

              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  className="forecast-card forecast-pending"
                  key={item}
                >
                  <div className="forecast-day">
                    Cargando...
                  </div>

                  <div className="forecast-icon">
                    ⏳
                  </div>

                  <div className="forecast-condition">
                    Obteniendo previsión
                  </div>

                  <div className="forecast-temperature">
                    --°C
                  </div>

                  <div className="forecast-details">
                    <span>💧 --%</span>
                    <span>☔ -- mm</span>
                  </div>
                </div>
              ))}

            </div>

          ) : forecastError ? (

            <div className="forecast-grid">
              <div className="forecast-card forecast-pending">
                <div className="forecast-day">
                  Previsión
                </div>

                <div className="forecast-icon">
                  ⚠️
                </div>

                <div className="forecast-condition">
                  No disponible
                </div>

                <div className="forecast-temperature">
                  --°C
                </div>

                <div className="forecast-details">
                  <span>{forecastError}</span>
                </div>
              </div>
            </div>

          ) : (

            <div className="forecast-grid">

              {forecast.map((day, index) => {

                const condition =
                  getForecastCondition(day.weatherCode);

                const formattedDate =
                  new Date(`${day.date}T12:00:00`).toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }
                  );

                const dayLabel =
                  index === 0
                    ? "Hoy"
                    : formattedDate.charAt(0).toUpperCase() +
                      formattedDate.slice(1);

                return (
                  <div
                    className={`forecast-card ${
                      index === 0
                        ? "forecast-today"
                        : ""
                    }`}
                    key={day.date}
                  >

                    <div className="forecast-day">
                      {dayLabel}
                    </div>

                    <div className="forecast-icon">
                      {index === 0
                        ? weatherCondition.icon
                        : condition.icon}
                    </div>

                    <div className="forecast-condition">
                      {index === 0
                        ? weatherCondition.text
                        : condition.text}
                    </div>

                    <div className="forecast-temperature">

                      {index === 0
                        ? weather.temperature !== null
                          ? `${Number(
                              weather.temperature
                            ).toFixed(1)}°C`
                          : "--°C"
                        : `${Number(
                            day.maxTemperature
                          ).toFixed(1)}° / ${Number(
                            day.minTemperature
                          ).toFixed(1)}°C`}

                    </div>

                    <div className="forecast-details">

                      <span>
                        💧{" "}
                        {index === 0
                          ? weather.humidity ?? "--"
                          : day.precipitationProbability ?? "--"}%
                      </span>

                      <span>
                        ☔{" "}
                        {index === 0
                          ? weather.rain ?? "--"
                          : Number(
                              day.precipitation ?? 0
                            ).toFixed(1)} mm
                      </span>

                    </div>

                    <div className="forecast-real">
                      {index === 0
                        ? "● Datos reales"
                        : "○ Previsión"}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

          <div className="forecast-info">

            <div className="forecast-info-item">

              <span className="forecast-info-icon">
                📡
              </span>

              <div>
                <strong>
                  Previsión actual
                </strong>

                <span>
                  Datos meteorológicos actualizados para la ubicación de la estación.
                </span>
              </div>

            </div>

            <div className="forecast-info-item">

              <span className="forecast-info-icon">
                🧠
              </span>

              <div>
                <strong>
                  Próximo modelo de IA
                </strong>

                <span>
                  MeteoInsight utilizará su histórico para generar predicciones propias.
                </span>
              </div>

            </div>

            <div className="forecast-info-item">

              <span className="forecast-info-icon">
                🎯
              </span>

              <div>
                <strong>
                  Predicción propia
                </strong>

                <span>
                  Temperatura, humedad y lluvia serán las primeras variables objetivo.
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
    UBICACIÓN DE LA ESTACIÓN
===================================================== */}

        <StationMap />

        {/* =====================================================
            ESTADÍSTICAS DE TEMPERATURA
        ===================================================== */}

        <section className="stats-section general-stats-section">

          <div className="general-stats-header">
            <div>
              <span className="section-kicker">RESUMEN DEL HISTÓRICO</span>
              <h2>Estadísticas generales</h2>
              <p>Resumen de los principales valores registrados por la estación.</p>
            </div>

            <div className="stats-status">
              <span className="stats-status-dot"></span>
              Datos disponibles
            </div>
          </div>

          <div className="general-stats-grid">

            <div className="general-stat-card temperature-stat-card">
              <div className="general-stat-top">
                <span className="general-stat-icon">🌡️</span>
                <span className="general-stat-label">Temperatura mínima</span>
              </div>
              <strong>
                {stats.minTemperature !== null && stats.minTemperature !== undefined
                  ? Number(stats.minTemperature).toFixed(1)
                  : "--"} °C
              </strong>
              <span className="general-stat-description">Valor mínimo registrado</span>
            </div>

            <div className="general-stat-card temperature-stat-card">
              <div className="general-stat-top">
                <span className="general-stat-icon">🔥</span>
                <span className="general-stat-label">Temperatura máxima</span>
              </div>
              <strong>
                {stats.maxTemperature !== null && stats.maxTemperature !== undefined
                  ? Number(stats.maxTemperature).toFixed(1)
                  : "--"} °C
              </strong>
              <span className="general-stat-description">Valor máximo registrado</span>
            </div>

            <div className="general-stat-card temperature-stat-card featured-stat">
              <div className="general-stat-top">
                <span className="general-stat-icon">📊</span>
                <span className="general-stat-label">Temperatura media</span>
              </div>
              <strong>
                {stats.averageTemperature !== null && stats.averageTemperature !== undefined
                  ? Number(stats.averageTemperature).toFixed(1)
                  : "--"} °C
              </strong>
              <span className="general-stat-description">Media de las mediciones</span>
            </div>

            <div className="general-stat-card">
              <div className="general-stat-top">
                <span className="general-stat-icon">💨</span>
                <span className="general-stat-label">Viento medio</span>
              </div>
              <strong>
                {stats.averageWindSpeed !== null && stats.averageWindSpeed !== undefined
                  ? Number(stats.averageWindSpeed).toFixed(1)
                  : "--"} km/h
              </strong>
              <span className="general-stat-description">Velocidad media registrada</span>
            </div>

            <div className="general-stat-card">
              <div className="general-stat-top">
                <span className="general-stat-icon">🌬️</span>
                <span className="general-stat-label">Racha máxima</span>
              </div>
              <strong>
                {stats.maxWindGust !== null && stats.maxWindGust !== undefined
                  ? Number(stats.maxWindGust).toFixed(1)
                  : "--"} km/h
              </strong>
              <span className="general-stat-description">Mayor racha registrada</span>
            </div>

            <div className="general-stat-card current-stat-card">
              <div className="general-stat-top">
                <span className="general-stat-icon">💧</span>
                <span className="general-stat-label">Humedad actual</span>
              </div>
              <strong>
                {weather.humidity !== null && weather.humidity !== undefined
                  ? Number(weather.humidity).toFixed(0)
                  : "--"} %
              </strong>
              <span className="general-stat-description">Última medición disponible</span>
            </div>

          </div>

          <div className="general-stats-footer">
            <span>ℹ️</span>
            <p>Las estadísticas de temperatura y viento se calculan a partir del histórico almacenado en MeteoInsight.</p>
          </div>

        </section>

        {/* =====================================================
            GRÁFICA DE TEMPERATURA RECIENTE
        ===================================================== */}

        <section className="chart-section">

          <h2>
            Temperatura reciente
          </h2>

          <div className="period-selector">

            <button
              className={
                period === 1
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod(1)
              }
            >
              24 horas
            </button>

            <button
              className={
                period === 7
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod(7)
              }
            >
              7 días
            </button>

            <button
              className={
                period === 30
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod(30)
              }
            >
              30 días
            </button>

          </div>

          <div className="temperature-chart">

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={recentObservations}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="observationTime"
                  tickFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  }
                />

                <YAxis
                  domain={[
                    "auto",
                    "auto",
                  ]}
                  unit=" °C"
                />

                <Tooltip
                  labelFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleString(
                      "es-ES"
                    )
                  }
                  formatter={(value) => [
                    `${Number(
                      value
                    ).toFixed(1)} °C`,
                    "Temperatura",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div className="chart-summary">

            <div>
              <span>
                Actual
              </span>

              <strong>
                {weather.temperature !== null
                  ? Number(
                      weather.temperature
                    ).toFixed(1)
                  : "--"} °C
              </strong>
            </div>

            <div>
              <span>
                Mínima
              </span>

              <strong>
                {getMin(
                  recentObservations,
                  "temperature"
                ) !== null
                  ? getMin(
                      recentObservations,
                      "temperature"
                    ).toFixed(1)
                  : "--"} °C
              </strong>
            </div>

            <div>
              <span>
                Máxima
              </span>

              <strong>
                {getMax(
                  recentObservations,
                  "temperature"
                ) !== null
                  ? getMax(
                      recentObservations,
                      "temperature"
                    ).toFixed(1)
                  : "--"} °C
              </strong>
            </div>

            <div>
              <span>
                Media
              </span>

              <strong>
                {getAverage(
                  recentObservations,
                  "temperature"
                ) !== null
                  ? getAverage(
                      recentObservations,
                      "temperature"
                    ).toFixed(1)
                  : "--"} °C
              </strong>
            </div>

          </div>

        </section>

        {/* =====================================================
            GRÁFICA DE HUMEDAD
        ===================================================== */}

        <section className="chart-section">

          <h2>
            Humedad reciente
          </h2>

          <div className="temperature-chart">

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={recentObservations}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="observationTime"
                  tickFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  }
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  unit=" %"
                />

                <Tooltip
                  labelFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleString(
                      "es-ES"
                    )
                  }
                  formatter={(value) => [
                    `${Number(
                      value
                    ).toFixed(1)} %`,
                    "Humedad",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div className="chart-summary">

            <div>

              <span>
                Mínima
              </span>

              <strong>
                {getMin(
                  recentObservations,
                  "humidity"
                ) !== null
                  ? getMin(
                      recentObservations,
                      "humidity"
                    ).toFixed(1)
                  : "--"} %

              </strong>

            </div>

            <div>

              <span>
                Máxima
              </span>

              <strong>
                {getMax(
                  recentObservations,
                  "humidity"
                ) !== null
                  ? getMax(
                      recentObservations,
                      "humidity"
                    ).toFixed(1)
                  : "--"} %

              </strong>

            </div>

            <div>

              <span>
                Media
              </span>

              <strong>
                {getAverage(
                  recentObservations,
                  "humidity"
                ) !== null
                  ? getAverage(
                      recentObservations,
                      "humidity"
                    ).toFixed(1)
                  : "--"} %

              </strong>

            </div>

          </div>

        </section>

        {/* =====================================================
            GRÁFICA DE PRESIÓN
        ===================================================== */}

        <section className="chart-section">

          <h2>
            Presión atmosférica
          </h2>

          <div className="temperature-chart">

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={recentObservations}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="observationTime"
                  tickFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  }
                />

                <YAxis
                  domain={[
                    "auto",
                    "auto",
                  ]}
                  unit=" hPa"
                />

                <Tooltip
                  labelFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleString(
                      "es-ES"
                    )
                  }
                  formatter={(value) => [
                    `${Number(
                      value
                    ).toFixed(1)} hPa`,
                    "Presión",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div className="chart-summary">

            <div>

              <span>
                Mínima
              </span>

              <strong>
                {getMin(
                  recentObservations,
                  "pressure"
                ) !== null
                  ? getMin(
                      recentObservations,
                      "pressure"
                    ).toFixed(1)
                  : "--"} hPa

              </strong>

            </div>

            <div>

              <span>
                Máxima
              </span>

              <strong>
                {getMax(
                  recentObservations,
                  "pressure"
                ) !== null
                  ? getMax(
                      recentObservations,
                      "pressure"
                    ).toFixed(1)
                  : "--"} hPa

              </strong>

            </div>

            <div>

              <span>
                Media
              </span>

              <strong>
                {getAverage(
                  recentObservations,
                  "pressure"
                ) !== null
                  ? getAverage(
                      recentObservations,
                      "pressure"
                    ).toFixed(1)
                  : "--"} hPa

              </strong>

            </div>

          </div>

        </section>

                {/* =====================================================
            CONSULTA HISTÓRICA
        ===================================================== */}

        <section className="historical-section">

          <div className="historical-header">

            <div>
              <span className="section-label">
                HISTÓRICO METEOROLÓGICO
              </span>

              <h2>
                Explora el histórico
              </h2>

              <p className="historical-description">
                Busca una fecha y hora para consultar las condiciones
                registradas por la estación.
              </p>
            </div>

            <div className="historical-header-icon">
              🔎
            </div>

          </div>

          <div className="historical-search-panel">

            <div className="historical-search-title">
              <div className="historical-search-title-icon">
                📅
              </div>

              <div>
                <strong>Selecciona el momento</strong>
                <span>
                  La consulta mostrará la medición registrada más cercana.
                </span>
              </div>
            </div>

            <div className="historical-search">

              <div className="historical-field">
                <label htmlFor="historical-date">
                  Fecha
                </label>

                <input
                  id="historical-date"
                  type="date"
                  value={historicalDate}
                  onChange={(e) => {
                    setHistoricalDate(e.target.value);
                    setHistoricalError(null);
                    setHistoricalObservation(null);
                  }}
                />
              </div>

              <div className="historical-field">
                <label htmlFor="historical-time">
                  Hora
                </label>

                <input
                  id="historical-time"
                  type="time"
                  value={historicalTime}
                  onChange={(e) => {
                    setHistoricalTime(e.target.value);
                    setHistoricalError(null);
                    setHistoricalObservation(null);
                  }}
                />
              </div>

              <button
                className="historical-search-button"
                onClick={searchHistoricalObservation}
                disabled={historicalLoading}
              >
                <span>
                  {historicalLoading ? "⏳" : "🔍"}
                </span>
                <span>
                  {historicalLoading ? "Buscando..." : "Buscar medición"}
                </span>
              </button>

            </div>

            <div className="historical-presets">
              <span>Acceso rápido:</span>

              <button type="button" onClick={() => setHistoricalPreset(0)}>
                Hoy · 12:00
              </button>

              <button type="button" onClick={() => setHistoricalPreset(1)}>
                Ayer · 12:00
              </button>

              <button type="button" onClick={() => setHistoricalPreset(7)}>
                Hace 7 días · 12:00
              </button>
            </div>

          </div>

          {historicalError && (
            <div className="historical-error">
              <span>⚠️</span>
              <span>{historicalError}</span>
            </div>
          )}

          {historicalObservation && (
            <div className="historical-result">

              <div className="historical-result-header">
                <div>
                  <span className="detail-label">
                    MEDICIÓN ENCONTRADA
                  </span>

                  <strong>
                    {new Date(
                      historicalObservation.observationTime
                    ).toLocaleString(
                      "es-ES",
                      {
                        dateStyle: "full",
                        timeStyle: "short",
                      }
                    )}
                  </strong>
                </div>

                <div className="historical-result-status">
                  <span className="historical-result-icon">
                    ✓
                  </span>
                  <span>
                    Registro disponible
                  </span>
                </div>
              </div>

              <div className="historical-metrics">

                <div className="historical-metric">
                  <div className="historical-metric-icon">🌡️</div>
                  <div>
                    <span>Temperatura</span>
                    <strong>
                      {historicalObservation.temperature !== null
                        ? Number(historicalObservation.temperature).toFixed(1)
                        : "--"} °C
                    </strong>
                  </div>
                </div>

                <div className="historical-metric">
                  <div className="historical-metric-icon">💧</div>
                  <div>
                    <span>Humedad</span>
                    <strong>
                      {historicalObservation.humidity !== null
                        ? Number(historicalObservation.humidity).toFixed(1)
                        : "--"} %
                    </strong>
                  </div>
                </div>

                <div className="historical-metric">
                  <div className="historical-metric-icon">◉</div>
                  <div>
                    <span>Presión</span>
                    <strong>
                      {historicalObservation.pressure !== null
                        ? Number(historicalObservation.pressure).toFixed(1)
                        : "--"} hPa
                    </strong>
                  </div>
                </div>

                <div className="historical-metric">
                  <div className="historical-metric-icon">💨</div>
                  <div>
                    <span>Viento</span>
                    <strong>
                      {historicalObservation.averageWindSpeed !== null &&
                      historicalObservation.averageWindSpeed !== undefined
                        ? Number(historicalObservation.averageWindSpeed).toFixed(1)
                        : "--"} km/h
                    </strong>
                  </div>
                </div>

                <div className="historical-metric">
                  <div className="historical-metric-icon">🧭</div>
                  <div>
                    <span>Dirección</span>
                    <strong>
                      {historicalObservation.averageWindDirection !== null &&
                      historicalObservation.averageWindDirection !== undefined
                        ? `${Number(historicalObservation.averageWindDirection).toFixed(0)}°`
                        : "--"}
                    </strong>
                  </div>
                </div>

                <div className="historical-metric">
                  <div className="historical-metric-icon">☔</div>
                  <div>
                    <span>Lluvia</span>
                    <strong>
                      {historicalObservation.rain !== null &&
                      historicalObservation.rain !== undefined
                        ? Number(historicalObservation.rain).toFixed(1)
                        : "--"} mm
                    </strong>
                  </div>
                </div>

              </div>

              <div className="historical-result-footer">
                <span>ℹ️</span>
                <span>
                  La estación puede no tener un registro exactamente a la hora
                  seleccionada; en ese caso se devuelve la medición más cercana.
                </span>
              </div>

            </div>
          )}

        </section>

                        {/* =====================================================
            VIENTO
        ===================================================== */}

        <section className="chart-section wind-section">

          <div className="wind-header">

            <div className="wind-title">

              <div className="wind-title-icon">
                💨
              </div>

              <div>
                <span className="section-label">
                  VIENTO
                </span>

                <h2>
                  Análisis del viento
                </h2>

                <p className="wind-subtitle">
                  Resumen de la velocidad, las rachas y la dirección predominante registrada.
                </p>
              </div>

            </div>

          </div>

          <div className="wind-metrics-grid">

            <div className="wind-metric-card wind-current-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">💨</span>
                <span>Velocidad actual</span>
              </div>

              <strong>
                {stats.currentWindSpeed !== null &&
                stats.currentWindSpeed !== undefined
                  ? Number(stats.currentWindSpeed).toFixed(1)
                  : "--"}{" "}
                km/h
              </strong>

              <small>
                Última medición disponible
              </small>
            </div>

            <div className="wind-metric-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">📊</span>
                <span>Velocidad media</span>
              </div>

              <strong>
                {stats.averageWindSpeed !== null &&
                stats.averageWindSpeed !== undefined
                  ? Number(stats.averageWindSpeed).toFixed(1)
                  : "--"}{" "}
                km/h
              </strong>

              <small>
                Media del histórico registrado
              </small>
            </div>

            <div className="wind-metric-card wind-gust-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">🌬️</span>
                <span>Racha máxima</span>
              </div>

              <strong>
                {stats.maxWindGust !== null &&
                stats.maxWindGust !== undefined
                  ? Number(stats.maxWindGust).toFixed(1)
                  : "--"}{" "}
                km/h
              </strong>

              <small>
                Mayor racha registrada
              </small>
            </div>

            <div className="wind-metric-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">🧭</span>
                <span>Dirección predominante</span>
              </div>

              <strong className="wind-direction-highlight">
                {predominantWindDirection
                  ? predominantWindDirection.direction
                  : "--"}
              </strong>

              <small>
                {predominantWindDirection
                  ? `${predominantWindDirection.percentage.toFixed(1)}% de las mediciones`
                  : "Sin datos disponibles"}
              </small>
            </div>

            <div className="wind-metric-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">🧭</span>
                <span>Direcciones registradas</span>
              </div>

              <strong>
                {activeWindDirections}
              </strong>

              <small>
                Sectores con presencia de viento
              </small>
            </div>

            <div className="wind-metric-card">
              <div className="wind-metric-top">
                <span className="wind-metric-icon">📈</span>
                <span>Intensidad máxima</span>
              </div>

              <strong>
                {stats.maxWindGust !== null &&
                stats.maxWindGust !== undefined &&
                stats.averageWindSpeed !== null &&
                stats.averageWindSpeed !== undefined &&
                Number(stats.averageWindSpeed) > 0
                  ? (
                      Number(stats.maxWindGust) /
                      Number(stats.averageWindSpeed)
                    ).toFixed(1)
                  : "--"}{" "}
                ×
              </strong>

              <small>
                Relación entre racha y velocidad media
              </small>
            </div>

          </div>

          <div className="wind-rose-card">

            <div className="wind-rose-header">

              <div>
                <span className="detail-label">
                  DIRECCIÓN DEL VIENTO
                </span>

                <strong>
                  Rosa de los vientos
                </strong>
              </div>

              {predominantWindDirection && (
                <div className="wind-predominant-badge">
                  <span>Predominante</span>
                  <strong>
                    {predominantWindDirection.direction}
                  </strong>
                </div>
              )}

            </div>

            <div className="wind-rose-content">

              <div className="wind-rose">

                {windDirections.length === 0 && (
                  <div className="wind-rose-no-data">
                    <span>🧭</span>
                    <small>
                      Sin datos
                    </small>
                  </div>
                )}

                <div className="wind-rose-circle">

                  <span className="wind-rose-label wind-rose-n">
                    N
                  </span>

                  <span className="wind-rose-label wind-rose-ne">
                    NE
                  </span>

                  <span className="wind-rose-label wind-rose-e">
                    E
                  </span>

                  <span className="wind-rose-label wind-rose-se">
                    SE
                  </span>

                  <span className="wind-rose-label wind-rose-s">
                    S
                  </span>

                  <span className="wind-rose-label wind-rose-so">
                    SO
                  </span>

                  <span className="wind-rose-label wind-rose-o">
                    O
                  </span>

                  <span className="wind-rose-label wind-rose-no">
                    NO
                  </span>

                  {windDirections.map((item) => {

                    const angle = Number(item.degrees);
                    const percentage = Number(item.percentage || 0);

                    const length = Math.max(
                      18,
                      Math.min(62, percentage * 1.2)
                    );

                    return (
                      <div
                        key={item.direction}
                        className="wind-rose-ray"
                        style={{
                          transform: `translateX(-50%) rotate(${angle}deg)`,
                          height: `${length}px`,
                        }}
                      />
                    );

                  })}

                  <div className="wind-rose-center">
                    💨
                  </div>

                </div>

              </div>

              <div className="wind-rose-legend">

                {windDirections.map((item) => (

                  <div
                    className="wind-rose-item"
                    key={item.direction}
                  >

                    <span>
                      {item.direction}
                    </span>

                    <strong>
                      {Number(item.percentage || 0).toFixed(1)}%
                    </strong>

                  </div>

                ))}

              </div>

            </div>

            <div className="wind-analysis-footer">
              <span>ℹ️</span>
              <p>
                La dirección predominante corresponde al sector con mayor porcentaje de registros de viento.
              </p>
            </div>

          </div>

        </section>
        {/* =====================================================
            ANÁLISIS DE PRECIPITACIÓN
        ===================================================== */}

        <section className="chart-section rain-section">

          <div className="rain-header">

            <div className="rain-title">

              <div className="rain-title-icon">
                🌧️
              </div>

              <div>
                <span className="section-label">
                  PRECIPITACIÓN
                </span>

                <h2>
                  Análisis de precipitación ·{" "}
                  {new Date(
                    rainYear,
                    rainMonth - 1,
                    1
                  ).toLocaleDateString(
                    "es-ES",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h2>

                <p className="rain-subtitle">
                  Evolución de la lluvia registrada durante el mes seleccionado.
                </p>
              </div>

            </div>

            <div className="rain-selector">

              <select
                value={rainMonth}
                onChange={(e) =>
                  setRainMonth(Number(e.target.value))
                }
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>

              <select
                value={rainYear}
                onChange={(e) =>
                  setRainYear(Number(e.target.value))
                }
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>

            </div>

          </div>

          {(() => {
            const validRainDays = rainDaily
              .map((day) => ({
                ...day,
                rain: Number(day.rain || 0),
              }))
              .filter((day) => Number.isFinite(day.rain));

            const rainyDayValues = validRainDays
              .filter((day) => day.rain > 0)
              .map((day) => day.rain);

            const rainiestDay =
              validRainDays.length > 0
                ? validRainDays.reduce((max, day) =>
                    day.rain > max.rain ? day : max
                  )
                : null;

            const averageRainOnRainyDays =
              rainyDayValues.length > 0
                ? rainyDayValues.reduce((sum, value) => sum + value, 0) /
                  rainyDayValues.length
                : 0;

            const formatRainDate = (dateValue) => {
              if (!dateValue) {
                return "Sin datos";
              }

              return new Date(`${dateValue}T00:00:00`).toLocaleDateString(
                "es-ES",
                {
                  day: "numeric",
                  month: "long",
                }
              );
            };

            return (
              <>
                <div className="rain-metrics-grid">

                  <div className="rain-metric-card rain-total-card">
                    <div className="rain-metric-top">
                      <span className="rain-metric-icon">💧</span>
                      <span>Total mensual</span>
                    </div>

                    <strong>
                      {totalMonthlyRain.toFixed(1)} mm
                    </strong>

                    <small>
                      Precipitación acumulada
                    </small>
                  </div>

                  <div className="rain-metric-card">
                    <div className="rain-metric-top">
                      <span className="rain-metric-icon">🌦️</span>
                      <span>Días con lluvia</span>
                    </div>

                    <strong>
                      {rainyDays}
                    </strong>

                    <small>
                      De {validRainDays.length} días disponibles
                    </small>
                  </div>

                  <div className="rain-metric-card">
                    <div className="rain-metric-top">
                      <span className="rain-metric-icon">⛈️</span>
                      <span>Máximo diario</span>
                    </div>

                    <strong>
                      {maximumDailyRain.toFixed(1)} mm
                    </strong>

                    <small>
                      {rainiestDay
                        ? formatRainDate(rainiestDay.date)
                        : "Sin datos"}
                    </small>
                  </div>

                  <div className="rain-metric-card">
                    <div className="rain-metric-top">
                      <span className="rain-metric-icon">📊</span>
                      <span>Media en días de lluvia</span>
                    </div>

                    <strong>
                      {averageRainOnRainyDays.toFixed(1)} mm
                    </strong>

                    <small>
                      Promedio por día con precipitación
                    </small>
                  </div>

                </div>

                <div className="rain-chart-heading">
                  <div>
                    <h3>Precipitación diaria</h3>
                    <p>
                      Cantidad acumulada registrada cada día del mes.
                    </p>
                  </div>

                  {rainiestDay && rainiestDay.rain > 0 && (
                    <div className="rain-highlight">
                      <span>🌧️ Día más lluvioso</span>
                      <strong>
                        {formatRainDate(rainiestDay.date)} ·{" "}
                        {rainiestDay.rain.toFixed(1)} mm
                      </strong>
                    </div>
                  )}
                </div>

                <div className="temperature-chart rain-chart">

                  {validRainDays.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height={350}
                    >
                      <BarChart
                        data={validRainDays}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 10,
                          bottom: 10,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) =>
                            new Date(
                              `${value}T00:00:00`
                            ).toLocaleDateString(
                              "es-ES",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )
                          }
                        />

                        <YAxis
                          unit=" mm"
                        />

                        <Tooltip
                          labelFormatter={(value) =>
                            new Date(
                              `${value}T00:00:00`
                            ).toLocaleDateString(
                              "es-ES",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          }
                          formatter={(value) => [
                            `${Number(value).toFixed(1)} mm`,
                            "Precipitación",
                          ]}
                        />

                        <Bar
                          dataKey="rain"
                          name="Precipitación"
                          radius={[
                            5,
                            5,
                            0,
                            0,
                          ]}
                        />

                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="rain-empty-state">
                      <span>🌤️</span>
                      <strong>No hay datos de precipitación</strong>
                      <p>
                        No se han encontrado registros para el periodo seleccionado.
                      </p>
                    </div>
                  )}

                </div>

                <div className="rain-footer">

                  <span className="rain-footer-icon">
                    💧
                  </span>

                  <span>
                    Los datos representan la precipitación acumulada registrada
                    durante cada día. Los días sin lluvia aparecen con 0 mm.
                  </span>

                </div>
              </>
            );
          })()}

        </section>

        {/* =====================================================
            RESUMEN DE COMPORTAMIENTO RECIENTE
        ===================================================== */}

        {(() => {
          const validRecent = recentObservations
            .filter((observation) => observation.observationTime)
            .sort(
              (a, b) =>
                new Date(a.observationTime) -
                new Date(b.observationTime)
            );

          const recentTemperature = getNumericValues(
            validRecent,
            "temperature"
          );
          const recentHumidity = getNumericValues(
            validRecent,
            "humidity"
          );

          const recentMinTemperature =
            recentTemperature.length > 0
              ? Math.min(...recentTemperature)
              : null;

          const recentMaxTemperature =
            recentTemperature.length > 0
              ? Math.max(...recentTemperature)
              : null;

          const recentAverageTemperature = getAverage(
            validRecent,
            "temperature"
          );

          const recentAverageHumidity = getAverage(
            validRecent,
            "humidity"
          );

          const firstTemperature =
            recentTemperature.length > 0
              ? recentTemperature[0]
              : null;

          const lastTemperature =
            recentTemperature.length > 0
              ? recentTemperature[recentTemperature.length - 1]
              : null;

          const temperatureChange =
            firstTemperature !== null && lastTemperature !== null
              ? lastTemperature - firstTemperature
              : null;

          let recentRain = 0;
          let previousRain = null;

          validRecent.forEach((observation) => {
            const rain = Number(observation.rain);

            if (!Number.isFinite(rain)) {
              return;
            }

            if (previousRain !== null) {
              if (rain >= previousRain) {
                recentRain += rain - previousRain;
              } else {
                // Weathercloud almacena la lluvia como acumulado diario
                // y vuelve a cero al comenzar un nuevo día.
                recentRain += rain;
              }
            }

            previousRain = rain;
          });

          const formatRecentValue = (value, decimals = 1) =>
            value === null || value === undefined || !Number.isFinite(Number(value))
              ? "--"
              : Number(value).toFixed(decimals);

          const formatChange = (value) => {
            if (value === null || !Number.isFinite(Number(value))) {
              return "Sin comparación";
            }

            if (Math.abs(Number(value)) < 0.05) {
              return "Sin cambios apreciables";
            }

            return `${value > 0 ? "+" : ""}${Number(value).toFixed(1)} °C`;
          };

          return (
            <section className="recent-summary-section">

              <div className="recent-summary-header">
                <div>
                  <span className="section-kicker">
                    COMPORTAMIENTO RECIENTE
                  </span>

                  <h2>Resumen de las últimas 24 horas</h2>

                  <p>
                    Una visión rápida de cómo ha evolucionado el tiempo
                    durante el periodo más reciente disponible.
                  </p>
                </div>

                <div className="recent-summary-status">
                  <span className="recent-summary-status-dot"></span>
                  {validRecent.length > 0
                    ? `${validRecent.length} mediciones`
                    : "Sin datos"}
                </div>
              </div>

              <div className="recent-summary-grid">

                <div className="recent-summary-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">📊</span>
                    <span>Temperatura media</span>
                  </div>
                  <strong>
                    {formatRecentValue(recentAverageTemperature)} °C
                  </strong>
                  <small>Media del periodo</small>
                </div>

                <div className="recent-summary-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">🔥</span>
                    <span>Máxima</span>
                  </div>
                  <strong>
                    {formatRecentValue(recentMaxTemperature)} °C
                  </strong>
                  <small>Máximo registrado</small>
                </div>

                <div className="recent-summary-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">❄️</span>
                    <span>Mínima</span>
                  </div>
                  <strong>
                    {formatRecentValue(recentMinTemperature)} °C
                  </strong>
                  <small>Mínimo registrado</small>
                </div>

                <div className="recent-summary-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">💧</span>
                    <span>Humedad media</span>
                  </div>
                  <strong>
                    {formatRecentValue(recentAverageHumidity, 0)} %
                  </strong>
                  <small>Media del periodo</small>
                </div>

                <div className="recent-summary-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">🌧️</span>
                    <span>Precipitación</span>
                  </div>
                  <strong>
                    {recentRain.toFixed(1)} mm
                  </strong>
                  <small>Precipitación estimada del periodo</small>
                </div>

                <div className="recent-summary-card recent-summary-trend-card">
                  <div className="recent-summary-card-top">
                    <span className="recent-summary-icon">
                      {temperatureChange === null
                        ? "↔️"
                        : temperatureChange > 0.05
                          ? "↗️"
                          : temperatureChange < -0.05
                            ? "↘️"
                            : "→"}
                    </span>
                    <span>Tendencia térmica</span>
                  </div>
                  <strong>
                    {formatChange(temperatureChange)}
                  </strong>
                  <small>Desde el inicio del periodo</small>
                </div>

              </div>

              <div className="recent-summary-footer">
                <span>ℹ️</span>
                <p>
                  Los valores se calculan directamente a partir de las
                  mediciones almacenadas en MeteoInsight.
                </p>
              </div>

            </section>
          );
        })()}

        {/* =====================================================
            TENDENCIAS METEOROLÓGICAS
        ===================================================== */}

        <section className="trends-section">

          <div className="trends-header">
            <div className="trends-title">
              <div className="trends-title-icon">📈</div>
              <div>
                <span className="section-label">TENDENCIAS METEOROLÓGICAS</span>
                <h2>Cómo está evolucionando el tiempo</h2>
                <p>
                  Comparación automática de las condiciones registradas durante el periodo seleccionado.
                </p>
              </div>
            </div>

            <div className="trends-period-badge">
              <span className="trends-status-dot"></span>
              {trendPeriodLabel}
            </div>
          </div>

          <div className="trends-grid">
            {trendResults.map((item) => (
              <div
                className={`trend-card trend-${item.trend.direction}`}
                key={item.key}
              >
                <div className="trend-card-top">
                  <div className="trend-card-icon">
                    {item.icon}
                  </div>
                  <div className="trend-card-name">
                    {item.name}
                  </div>
                </div>

                <div className="trend-main">
                  <span className="trend-main-icon">
                    {item.trend.icon}
                  </span>
                  <strong>{item.trend.label}</strong>
                </div>

                <div className="trend-change">
                  <span>Cambio estimado</span>
                  <strong>{formatTrendChange(item.trend)}</strong>
                </div>

                <small>{item.description}</small>
              </div>
            ))}
          </div>

          <div className="trends-summary">
            <div className="trends-summary-icon">🧠</div>
            <div>
              <strong>Lectura automática</strong>
              <p>{trendSummary}</p>
            </div>
          </div>

          <div className="trends-footer">
            <span>ℹ️</span>
            <p>
              La tendencia compara la media del inicio del periodo con la media del tramo final para evitar que una medición aislada determine el resultado. No es todavía una predicción meteorológica.
            </p>
          </div>

        </section>

        {/* =====================================================
            TEMPERATURA DEL MES
        ===================================================== */}

        <section className="chart-section monthly-temperature-section">

          <div className="temperature-monthly-header">

            <div className="temperature-monthly-title">
              <div className="temperature-monthly-icon">🌡️</div>

              <div>
                <span className="section-label">TEMPERATURA</span>
                <h2>
                  Temperatura de {" "}
                  {new Date(temperatureYear, temperatureMonth - 1, 1).toLocaleDateString(
                    "es-ES",
                    { month: "long", year: "numeric" }
                  )}
                </h2>
                <p className="temperature-monthly-description">
                  Evolución de las temperaturas máximas y mínimas registradas cada día.
                </p>
              </div>
            </div>

            <div className="temperature-monthly-selector">
              <select
                value={temperatureMonth}
                onChange={(e) => setTemperatureMonth(Number(e.target.value))}
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>

              <select
                value={temperatureYear}
                onChange={(e) => setTemperatureYear(Number(e.target.value))}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

          </div>

          <div className="temperature-monthly-summary">

            <div className="temperature-summary-card">
              <span>🌡️ Media mensual</span>
              <strong>
                {monthlyTemperatureAverage !== null
                  ? `${monthlyTemperatureAverage.toFixed(1)} °C`
                  : "--"}
              </strong>
              <small>Temperatura media de los días disponibles</small>
            </div>

            <div className="temperature-summary-card cold">
              <span>❄️ Mínima registrada</span>
              <strong>
                {monthlyTemperatureMinimum !== null
                  ? `${monthlyTemperatureMinimum.toFixed(1)} °C`
                  : "--"}
              </strong>
              <small>Valor mínimo del mes</small>
            </div>

            <div className="temperature-summary-card hot">
              <span>🔥 Máxima registrada</span>
              <strong>
                {monthlyTemperatureMaximum !== null
                  ? `${monthlyTemperatureMaximum.toFixed(1)} °C`
                  : "--"}
              </strong>
              <small>Valor máximo del mes</small>
            </div>

            <div className="temperature-summary-card range">
              <span>↕️ Amplitud térmica</span>
              <strong>
                {monthlyTemperatureAmplitude !== null
                  ? `${monthlyTemperatureAmplitude.toFixed(1)} °C`
                  : "--"}
              </strong>
              <small>Diferencia entre máxima y mínima</small>
            </div>

            <div className="temperature-summary-card">
              <span>☀️ Días ≥ 30 °C</span>
              <strong>{hotDays}</strong>
              <small>Días con máxima igual o superior a 30 °C</small>
            </div>

            <div className="temperature-summary-card">
              <span>📅 Días disponibles</span>
              <strong>{temperatureDaily.length}</strong>
              <small>Días con registros en el periodo seleccionado</small>
            </div>

          </div>

          <div className="temperature-extremes">
            <div>
              <span>🥶 Día más frío</span>
              <strong>
                {coldestDay
                  ? `${new Date(`${coldestDay.date}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "long" })} · ${Number(coldestDay.minTemperature).toFixed(1)} °C`
                  : "--"}
              </strong>
            </div>

            <div>
              <span>🥵 Día más cálido</span>
              <strong>
                {hottestDay
                  ? `${new Date(`${hottestDay.date}T00:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "long" })} · ${Number(hottestDay.maxTemperature).toFixed(1)} °C`
                  : "--"}
              </strong>
            </div>
          </div>

          <div className="temperature-chart monthly-temperature-chart">
            {temperatureDaily.length === 0 ? (
              <div className="temperature-no-data">
                <div className="temperature-no-data-icon">🌡️</div>
                <strong>No hay registros de temperatura para este mes.</strong>
                <span>Prueba a seleccionar otro mes o año.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={temperatureDaily}
                  margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(
                        "es-ES",
                        { day: "numeric", month: "numeric" }
                      )
                    }
                  />

                  <YAxis unit=" °C" domain={["auto", "auto"]} />

                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(
                        "es-ES",
                        { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                      )
                    }
                    formatter={(value, name, props) => {
                      if (name === "Rango de temperatura") {
                        const min = props.payload.minTemperature;
                        const max = props.payload.maxTemperature;

                        return [
                          min !== null && max !== null
                            ? `${Number(min).toFixed(1)} °C → ${Number(max).toFixed(1)} °C`
                            : "--",
                          "Temperatura",
                        ];
                      }

                      return [`${Number(value).toFixed(1)} °C`, name];
                    }}
                  />

                  <Bar
                    dataKey="minTemperature"
                    stackId="temperatureRange"
                    fill="transparent"
                    stroke="none"
                    isAnimationActive={false}
                  />

                  <Bar
                    dataKey="temperatureRange"
                    name="Rango de temperatura"
                    stackId="temperatureRange"
                    radius={[5, 5, 0, 0]}
                    isAnimationActive={false}
                    shape={(props) => {
                      const { x, y, width, height, payload } = props;

                      if (
                        payload.minTemperature === null ||
                        payload.maxTemperature === null ||
                        height <= 0
                      ) {
                        return null;
                      }

                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx={5}
                          ry={5}
                          fill={getTemperatureColor(payload.maxTemperature)}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="temperature-scale">
            <span><i className="temperature-scale-color very-hot"></i> &gt; 40 °C</span>
            <span><i className="temperature-scale-color hot"></i> 30–40 °C</span>
            <span><i className="temperature-scale-color warm"></i> 20–30 °C</span>
            <span><i className="temperature-scale-color mild"></i> 15–20 °C</span>
            <span><i className="temperature-scale-color cool"></i> 10–15 °C</span>
            <span><i className="temperature-scale-color cold"></i> 0–10 °C</span>
            <span><i className="temperature-scale-color freezing"></i> &lt; 0 °C</span>
          </div>

          <div className="temperature-monthly-footer">
            <span>🌡️</span>
            <span>Cada barra representa el rango de temperatura registrado durante ese día, desde la mínima hasta la máxima.</span>
          </div>

        </section>

        {/* =====================================================
            ÚLTIMA ACTUALIZACIÓN
        ===================================================== */}

        <p className="last-update">

          Última medición:{" "}

          {new Date(
            weather.observationTime
          ).toLocaleString(
            "es-ES"
          )}

        </p>

      </main>

    </div>
  );
}

export default App;