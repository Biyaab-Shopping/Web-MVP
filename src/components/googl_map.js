import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["marker"];
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const googleMapsMapId =
  process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

function MapContainer(props) {
  const {
    _mapConfig,
    mapRef,
    markers,
    setMarkers,
  } = props;

  const [mapData, setMapData] = useState(null);
  const markerRefs = useRef([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "biyaab-google-map",
    googleMapsApiKey,
    version: "weekly",
    libraries,
  });

  const containerStyle = {
    width:
      window.screen.width > 567 ? "400px" : `${window.screen.width - 50}px`,
    height: "400px",
    maxWidth: "100%",
  };

  const mapOptions = useMemo(
    () => ({
      mapId: googleMapsMapId,
      keyboardShortcuts: false,
      zoomControl: false,
      scaleControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    }),
    []
  );

  const mapClicked = useCallback(
    (clickEvent) => {
      setMarkers([
        {
          lat: clickEvent.latLng.lat(),
          lng: clickEvent.latLng.lng(),
        },
      ]);
    },
    [setMarkers]
  );

  const mapLoaded = useCallback(
    (map) => {
      setMapData(map);
      if (mapRef) {
        mapRef.current = { map };
      }
      if (window.google) {
        window.google.maps.event.trigger(map, "resize");
      }
    },
    [mapRef]
  );

  useEffect(() => {
    if (!mapData || !window.google?.maps?.marker) return;

    markerRefs.current.forEach((marker) => {
      marker.map = null;
    });
    markerRefs.current = [];

    markers.forEach((marker) => {
      const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapData,
        position: {
          lat: Number(marker.lat),
          lng: Number(marker.lng),
        },
      });
      markerRefs.current.push(advancedMarker);
    });

    return () => {
      markerRefs.current.forEach((marker) => {
        marker.map = null;
      });
      markerRefs.current = [];
    };
  }, [mapData, markers]);

  if (!googleMapsApiKey) {
    return (
      <div className="p-3 border rounded text-danger">
        Missing <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>.
        Restart the dev server after updating environment variables.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-3 border rounded text-danger">
        Failed to load Google Maps. Check your API key, billing, and enabled APIs
        in Google Cloud Console.
      </div>
    );
  }

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <GoogleMap
      id="mapDom"
      mapContainerStyle={containerStyle}
      center={_mapConfig.center}
      zoom={_mapConfig.zoom}
      options={mapOptions}
      onLoad={mapLoaded}
      onClick={mapClicked}
    />
  );
}

export default MapContainer;
