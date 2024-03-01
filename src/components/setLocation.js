import axios from "axios";
import { useEffect, useRef, useState } from "react";
import MapComponent from "./googl_map";
import SearchInput from "./search_input";
import { Button, Col, Row } from "react-bootstrap";
import * as setting from "../config";

function SetLocationComponent(props) {
  const {
    rateData,
    setLocationInfo,
    mapConfig,
    setMapConfig,
    markers,
    setMarkers,
  } = props;

  const [googleService, setGoogleService] = useState(null);
  const [google, setGoogle] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [country, setCountry] = useState("");
  const [pointLocationName, setPointLocationName] = useState("");
  const [currency, setCurrency] = useState({ name: "USD", symbol: "$" });

  // const [mapLoading, setMapLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
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

  const [markersJsonString, setMarkersJsonString] = useState(
    JSON.stringify(markers)
  );

  const mapRef = useRef(null);

  const MapZoomChanged = (mapProps, map) => {
    setMapConfig({
      ...mapConfig,
      zoom: map.zoom,
      // center: map.center,
      center: { lat: map.center.lat(), lng: map.center.lng() },
    });
  };

  const findLocaionFunc = (value) => {
    if (value !== "") {
      const request = {
        // location: mapConfig.center,
        // radius: '500',
        // type: ['food']
        query: value,
        fields: ["name", "geometry"],
      };
      // setMapLoading(true);
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
              {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              },
            ]);
          }, 150);
          mapRef.current.map.setCenter({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        } else {
        }
      });
    }
  };
  const onChangeLocationName = (value) => {
    setLocationName(value);
    findLocaionFunc(value);
  };

  useEffect(() => {
    setMounted(true);
  }, [locationName, markersJsonString]);

  useEffect(() => {
    setMarkersJsonString(JSON.stringify(markers));
  }, [markers]);

  useEffect(() => {
    async function fetchData() {
      if (mounted === true) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${markers[0].lat},${markers[0].lng}&key=${setting.apiKey}`
          );

          if (response.data.results.length > 0) {
            // Extract the country from the first result
            let country = "",
              locality = "",
              area = "",
              pointName = "";
            for (const ele of response.data.results) {
              for (const component of ele.address_components) {
                if (component.types.includes("country")) {
                  country = component.long_name;
                }
                if (component.types.includes("locality")) {
                  locality = component.long_name;
                }
                if (
                  component.types.includes("administrative_area_level_1") ||
                  component.types.includes("administrative_area_level_2") ||
                  component.types.includes("administrative_area_level_3")
                ) {
                  area = component.long_name;
                }

                if (country !== "" && locality !== "" && area !== "") break;
              }

              if (country !== "" && locality !== "" && area !== "") {
                pointName = `${area}, ${locality}, ${country}`;
                break;
              }
            }

            // const pointName = response.data.results[0].formatted_address;
            setCountry(country);
            setPointLocationName(pointName);
            await currecyFunc(country);
          } else {
            setCountry("");
          }
        } catch (error) {
          console.error(
            "Error fetching data from Google Maps Geocoding API:",
            error
          );
          setCountry("Please select the correct point!");
          setPointLocationName("");
        }
        setMounted(false);
      }
    }
    fetchData();
  }, [markers, mounted, locationName]);

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

  // useEffect(() => {
  //   setCountryName({ ...markers[0] });
  // }, [markers]);

  const setLocationCheck = () => {
    if (pointLocationName !== "") {
      setLocationInfo({
        country: country,
        locationName: pointLocationName,
        currencyInfo: {
          rate: rateData[currency.name],
          name: currency.name,
          symbol: currency.symbol,
        },
      });
    }
  };

  return (
    <div>
      <Row className="align-items-center">
        <Col className="p-3">
          <div className="mb-2">
            <span className="h5">location search:</span>
          </div>
          <SearchInput
            searchValue={locationName}
            setSearchValue={onChangeLocationName}
            placeholder="Type location..."
          ></SearchInput>
          {/* <FormGroup className="mt-3">
                <FormCheckLabel className="me-3">Select the point from map:</FormCheckLabel>
                <FormCheckInput type="checkbox" checked={selectPoint} onChange={onChangeSelectPoint}></FormCheckInput>
              </FormGroup> */}
          <div className="mt-3">
            <div>
              <span className="h5">Country:</span>
              <span className="h5 m-3 text-secondary">{country}</span>
            </div>
            <div>
              <span className="h5">Point Location Name:</span>
              <div className="h5 text-secondary">{pointLocationName}</div>
            </div>
            <div>
              <span className="h5">Currency:</span>
              <div className="h5 text-secondary">
                {rateData[currency.name]} {currency.symbol}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-2">
              <span className="h5">Coordinate:</span>
            </div>
            <div className="mb-2">
              <span className="small">
                <b>latitude: </b>
                {markers[0].lat}
              </span>
            </div>
            <div className="mb-2">
              <span className="small">
                <b>longitude: </b>
                {markers[0].lng}
              </span>
            </div>
          </div>
          <div className="mt-5 d-flex justify-content-center">
            <Button
              onClick={setLocationCheck}
              disabled={pointLocationName === ""}
            >
              Choose the location
            </Button>
          </div>
        </Col>
        <Col>
          <div className="mapPart py-4">
            <div style={{ width: "400px", height: "400px" }}>
              <MapComponent
                // setMapLoading={setMapLoading}
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
