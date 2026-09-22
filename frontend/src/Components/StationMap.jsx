import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const stationIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapCenter({ latitude, longitude }) {
    const map = useMap();

    useEffect(() => {
        map.setView([latitude, longitude], 13);
    }, [latitude, longitude, map]);

    return null;
}

function StationMap() {
    const [station, setStation] = useState(null);
    const [latestObservation, setLatestObservation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [mapType, setMapType] = useState("street");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener información de la estación
                const stationResponse = await fetch(
                    "http://localhost:8080/api/v1/station"
                );

                if (!stationResponse.ok) {
                    throw new Error(
                        "No se pudo obtener la información de la estación"
                    );
                }

                const stationData = await stationResponse.json();

                setStation(stationData);

                // Obtener la última observación meteorológica
                const observationResponse = await fetch(
                    "http://localhost:8080/api/v1/observations/latest"
                );

                if (!observationResponse.ok) {
                    throw new Error(
                        "No se pudo obtener la última observación"
                    );
                }

                const observationData = await observationResponse.json();

                setLatestObservation(observationData);
            } catch (err) {
                console.error("Error obteniendo datos de la estación:", err);

                setError(
                    "No se ha podido cargar la información de la estación."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Formatear fecha de la última medición
    const formatObservationDate = (dateValue) => {
        if (!dateValue) {
            return "Sin fecha disponible";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Formatear valores numéricos
    const formatValue = (value, decimals = 1) => {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return "—";
        }

        return number.toFixed(decimals);
    };

    if (loading) {
        return (
            <section className="station-map-section">
                <div className="section-header">
                    <h2>📍 Ubicación de la estación</h2>
                    <p>Cargando ubicación...</p>
                </div>

                <div className="station-map-loading">
                    Cargando mapa...
                </div>
            </section>
        );
    }

    if (error || !station) {
        return (
            <section className="station-map-section">
                <div className="section-header">
                    <h2>📍 Ubicación de la estación</h2>
                    <p>Localización de la estación meteorológica</p>
                </div>

                <div className="station-map-error">
                    {error || "No hay información disponible."}
                </div>
            </section>
        );
    }

    return (
        <section className="station-map-section">
            <div className="section-header">
                <h2>📍 Ubicación de la estación</h2>
                <p>
                    Localización de la estación meteorológica de MeteoInsight
                </p>
            </div>

            <div className="station-map-container">

                {/* Selector de tipo de mapa */}
                <div className="station-map-switcher">
                    <button
                        type="button"
                        className={
                            mapType === "street"
                                ? "station-map-switch active"
                                : "station-map-switch"
                        }
                        onClick={() => setMapType("street")}
                    >
                        🗺️ Mapa
                    </button>

                    <button
                        type="button"
                        className={
                            mapType === "satellite"
                                ? "station-map-switch active"
                                : "station-map-switch"
                        }
                        onClick={() => setMapType("satellite")}
                    >
                        🛰️ Satélite
                    </button>
                </div>

                <MapContainer
                    center={[station.latitude, station.longitude]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="station-map"
                >
                    {mapType === "street" ? (
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    ) : (
                        <TileLayer
                            attribution='&copy; Esri, Maxar, Earthstar Geographics'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    )}

                    <MapCenter
                        latitude={station.latitude}
                        longitude={station.longitude}
                    />

                    <Marker
                        position={[
                            station.latitude,
                            station.longitude
                        ]}
                        icon={stationIcon}
                    >
                        <Popup>
                            <div className="station-popup">
                                <strong>{station.name}</strong>

                                <span>📍 {station.location}</span>

                                <hr />

                                <div className="station-weather-data">
                                    <div>
                                        <span>🌡️ Temperatura</span>
                                        <strong>
                                            {formatValue(
                                                latestObservation?.temperature
                                            )}{" "}
                                            °C
                                        </strong>
                                    </div>

                                    <div>
                                        <span>💧 Humedad</span>
                                        <strong>
                                            {formatValue(
                                                latestObservation?.humidity,
                                                0
                                            )}{" "}
                                            %
                                        </strong>
                                    </div>

                                    <div>
                                        <span>⏱️ Presión</span>
                                        <strong>
                                            {formatValue(
                                                latestObservation?.pressure,
                                                1
                                            )}{" "}
                                            hPa
                                        </strong>
                                    </div>
                                </div>

                                <small>
                                    🕒 Última actualización:{" "}
                                    {formatObservationDate(
                                        latestObservation?.observationTime
                                    )}
                                </small>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </section>
    );
}

export default StationMap;