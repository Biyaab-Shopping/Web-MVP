import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import MapComponent from "./googl_map";
import SearchInput from "./search_input";
import { Col, Row } from "react-bootstrap";
import * as setting from "../config";

function SetLocationComponent(props) {
  const {
    locationName,
    setLocationName,
    mapConfig,
    setMapConfig,
    markers,
    setMarkers,
    rateData,
  } = props;
  const [googleService, setGoogleService] = useState(null);
  const [google, setGoogle] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [country, setCountry] = useState("");
  const [pointLocationName, setPointLocationName] = useState("");
  const [currency, setCurrency] = useState({ name: "USD", symbol: "$" });

  const [mapLoading, setMapLoading] = useState(true);
  // const [locationName, setLocationName] = useState("");
  // const [mapConfig, setMapConfig] = useState({
  //   // center: {},
  //   center: { lat: 37.7, lng: -122.4 },
  //   zoom: 8,
  // });
  // const [markers, setMarkers] = useState([
  //   {
  //     lat: 37.7,
  //     lng: -122.4,
  //   },
  // ]);

  const mapRef = useRef(null);

  const MapZoomChanged = (mapProps, map) => {
    setMapConfig({
      ...mapConfig,
      zoom: map.zoom,
      // center: map.center,
      center: { lat: map.center.lat(), lng: map.center.lng() },
    });
  };

  const SearchLocaiton = () => {
    // console.log(locationName);
    const request = {
      // location: mapConfig.center,
      // radius: '500',
      // type: ['food']
      query: locationName,
      fields: ["name", "geometry"],
    };
    setMapLoading(true);
    googleService.findPlaceFromQuery(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // for (var i = 0; i < results.length; i++) {
        //   createMarker(results[i]);
        // }
        // console.log(results[0].geometry.location.lat());
        setMapConfig({
          ...mapConfig,
          center: {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          },
        });
        setTimeout(() => {
          setMarkers([
            // ...markers,
            {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
              // name: "Position " + randomstring.generate(7),
              // markerType: markerType
            },
          ]);
        }, 150);
        mapRef.current.map.setCenter({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        });
      } else {
        setMapLoading(false);
      }
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (locationName !== "" && mounted === true) {
      SearchLocaiton();
    }
  }, [locationName]);

  const setCountryName = async (coordinate) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.lat},${coordinate.lng}&key=${setting.apiKey}`
      );

      if (response.data.results.length > 0) {
        // Extract the country from the first result
        const countryInfo = response.data.results[0].address_components.find(
          (component) => component.types.includes("country")
        );
        const pointName = response.data.results[0].formatted_address;
        setCountry(countryInfo.long_name);
        setPointLocationName(pointName);
        currecyFunc(countryInfo.long_name);
      } else {
        setCountry("");
      }
    } catch (error) {
      console.error(
        "Error fetching data from Google Maps Geocoding API:",
        error
      );
      setCountry("");
    }
  };

  const currecyFunc = async (countryFullName) => {
    try {
      const response = await axios.get(
        `https://restcountries.com/v3.1/name/${countryFullName}`
      );
      const currencyName = JSON.stringify(
        response.data[response.data.length - 1].currencies
      )
        .split(":")[0]
        .slice(2)
        .slice(0, -1);
      setCurrency({
        name: currencyName,
        symbol:
          response.data[response.data.length - 1].currencies[currencyName]
            .symbol,
      });
    } catch (error) {}
  };

  useEffect(() => {
    setCountryName({ ...markers[0] });
  }, [markers]);

  return (
    <div>
      <Row>
        <Col className="p-3">
          <div className="mb-2">
            <span className="h4">location search:</span>
          </div>
          <SearchInput
            searchValue={locationName}
            setSearchValue={setLocationName}
            placeholder="Type location..."
          ></SearchInput>
          {/* <FormGroup className="mt-3">
                      <FormCheckLabel className="me-3">Select the point from map:</FormCheckLabel>
                      <FormCheckInput type="checkbox" checked={selectPoint} onChange={onChangeSelectPoint}></FormCheckInput>
                    </FormGroup> */}
          <div className="mt-3">
            <div>
              <span className="h5">Country:</span>
              <span className="small m-3">{country}</span>
            </div>
            <div>
              <span className="h5">Point Location Name:</span>
              <div className="small">{pointLocationName}</div>
            </div>
            <div>
              <span className="h5">Currency:</span>
              <div className="small">
                {rateData[currency.name]} {currency.symbol}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-2">
              <span className="h4">Coordinate:</span>
            </div>
            <div className="mb-2">
              <span className="h5">latitude: {markers[0].lat}</span>
            </div>
            <div className="mb-2">
              <span className="h5">longitude: {markers[0].lng}</span>
            </div>
          </div>
        </Col>
        <Col>
          <div className="mapPart py-4">
            <div style={{ width: "400px", height: "400px" }}>
              <MapComponent
                setMapLoading={setMapLoading}
                // size={size}
                // _mapStyle={mapStyle}
                _mapConfig={mapConfig}
                _mapZoomChanged={MapZoomChanged}
                // _mapCenterChanged={MapCenterChanged}
                setGoogleService={setGoogleService}
                setGoogle={setGoogle}
                mapRef={mapRef}
                // clickable={clickable}
                markers={markers}
                setMarkers={setMarkers}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default SetLocationComponent;
