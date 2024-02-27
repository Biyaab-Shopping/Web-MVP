import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Map, Marker, GoogleApiWrapper } from "google-maps-react";
import * as setting from "../config";

function MapContainer(props) {
  const {
    _mapStyle,
    setMapLoading,
    setGoogleService,
    setGoogle,
    _mapConfig,
    mapRef,
    clickable,
    markers,
    setMarkers,
  } = props;

  const [mapData, setMapData] = useState(null);
  const [containerStyle, setContainerStyle] = useState({
    width: "400px",
    height: "400px",
  });
  // const [mapCenter, setMapCenter] = useState(_mapConfig.center);

  const mapClicked = useCallback(
    (mapProps, map, clickEvent) => {
      setMarkers([
        {
          lat: clickEvent.latLng.lat(),
          lng: clickEvent.latLng.lng(),
        },
      ]);
    },
    [clickable, setMarkers]
  );

  // const onClickMarker = useCallback(
  //   (props, marker, e) => {
  //     const index = markers.findIndex((marker) => marker.name === props.name);
  //     let newMarkers = markers;
  //     newMarkers.splice(index, 1);
  //     setMarkers([...newMarkers]);
  //   },
  //   [markers, setMarkers]
  // );

  useEffect(() => {
    if (mapData !== null) {
      mapData.setOptions({
        styles: _mapStyle,
      });
    }
  }, [mapData, _mapStyle]);

  // useEffect(() => {
  //   setMapCenter({
  //     lat: _mapConfig.center.lat,
  //     lng: _mapConfig.center.lng,
  //   })
  // }, [_mapConfig.center])

  // useEffect(() => {
  //   setMapLoading(true);
  // }, [size, _mapStyle, setMapLoading]);

  // useEffect(() => {
  //   setContainerStyle({
  //     width: size.wid + "px",
  //     height: size.hei + "px",
  //   });
  // }, [size]);

  const mapLoaded = useCallback(
    (mapProps, map) => {
      const { google } = mapProps;
      setGoogle(google);
      const service = new google.maps.places.PlacesService(map);
      setGoogleService(service);
      setMapData(map);
      // _mapCenterChanged(mapProps, map);
      console.log(map.center.lat());
    },
    [
      setGoogleService,
      setGoogle,
      // _mapCenterChanged
    ]
  );

  const Markers = useMemo(() => {
    return markers.map((marker, index) => {
      return <Marker key={index} name={"position"} position={marker}></Marker>;
    });
  }, [markers]);

  return (
    <>
      <Map
        ref={mapRef}
        id="mapDom"
        keyboardShortcuts={false}
        google={props.google}
        zoomControl={false}
        scaleControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
        zoom={props._mapConfig.zoom}
        // style={MapContainer.mapStyle}
        containerStyle={containerStyle}
        initialCenter={props._mapConfig.center}
        onReady={mapLoaded}
        onZoomChanged={props._mapZoomChanged}
        // onCenterChanged={props._mapCenterChanged}
        // onTilesloaded={setMapLoading(false)}
        onClick={mapClicked}
        // centerAroundCurrentLocation={true}
      >
        {Markers}
      </Map>
    </>
  );
  // return mapRender;
}

// MapContainer.defaultProps = googleMapStyles;

MapContainer.defautlProps = {
  clickable: true,
};

const LoadingContainer = (props) => <div>Fancy loading container!</div>;

export default GoogleApiWrapper((props) => {
  return {
    apiKey: setting.apiKey,
    LoadingContainer: LoadingContainer,
    // language: props.language,
    version: "3.56",
  };
})(MapContainer);
