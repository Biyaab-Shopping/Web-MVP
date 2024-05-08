import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Col, Row } from "react-bootstrap";
import MapComponent from "./googl_map";
import SearchInput from "./search_input";

import * as setting from "../config";

function SetLocationComponent(props) {
  const {
    rateData,
    locationInfos,
    setLocationInfos,
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
          setCountry("");
          setPointLocationName("");
          setCurrency({ name: "", symbol: "" });
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
            // setCountry(country);
            setPointLocationName(pointName);
            await currecyFunc(country);
          } else {
            // setCountry("");
            // setPointLocationName("");
          }
        } catch (error) {
          console.error(
            "Error fetching data from Google Maps Geocoding API:",
            error
          );
          setCountry("Please select the correct point!");
          // setPointLocationName("");
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
      const countryInfo = response.data.find(
        (e) => e.name.common === countryFullName
      );
      const currencyName = JSON.stringify(countryInfo.currencies)
        .split(":")[0]
        .slice(2)
        .slice(0, -1);
      // setCountry(countryInfo.name.common);
      setCountry(countryFullName);
      setCurrency({
        name: currencyName,
        symbol: countryInfo.currencies[currencyName].symbol,
      });
    } catch (error) {}
  };

  // useEffect(() => {
  //   setCountryName({ ...markers[0] });
  // }, [markers]);

  const getMyLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setMapConfig({
        ...mapConfig,
        center: { ...pos },
      });
      setMarkers([
        {
          ...pos,
        },
      ]);
      mapRef.current.map.setCenter({
        ...pos,
      });
    });
  };

  const setLocationCheck = () => {
    if (pointLocationName !== "") {
      setLocationInfos([
        ...locationInfos,
        {
          country: country,
          locationName: pointLocationName,
          currencyInfo: {
            rate: rateData[currency.name],
            name: currency.name,
            symbol: currency.symbol,
          },
        },
      ]);
    }
  };

  const removeLocationInfoItem = useCallback(
    (index) => {
      let data = [...locationInfos];
      data.splice(index, 1);
      setLocationInfos(data);
    },
    [setLocationInfos, locationInfos]
  );

  const locationInfosPart = useMemo(() => {
    return locationInfos.map((el, index) => (
      <div
        className="d-flex align-items-center justify-content-around border-bottom"
        key={index}
      >
        <div style={{ width: "20px", fontWeight: "bold" }}>{index + 1}.</div>
        <div className="mb-1" style={{ width: "100%" }}>
          <p style={{ margin: 0 }}>{el.locationName}</p>
          <p
            style={{ margin: 0 }}
          >{`currency: 1 USD->${el.currencyInfo.rate} ${el.currencyInfo.name}`}</p>
        </div>
        <div className="float-right">
          <div
            className="h5"
            style={{ cursor: "pointer" }}
            onClick={() => removeLocationInfoItem(index)}
          >
            X
          </div>
        </div>
      </div>
    ));
  }, [locationInfos, removeLocationInfoItem]);

  return (
    <div>
      <Row className="align-items-center g-4">
        <Col className="order-md-1 order-2">
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
                {currency.name !== ""
                  ? `${rateData[currency.name]} ${currency.symbol}`
                  : ""}
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
        <Col className="order-md-2 order-1 align-self-center">
          <div className="mapPart">
            <div className="mb-2 d-flex justify-content-end">
              <Button
                className="d-flex justify-content-center align-items-center"
                onClick={getMyLocation}
              >
                <svg
                  width="20px"
                  height="20px"
                  viewBox="-4 0 36 36"
                  version="1.1"
                  // xmlns="http://www.w3.org/2000/svg"
                  // xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                  style={{ marginRight: "10px" }}
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  <g id="SVGRepo_iconCarrier">
                    {/* <!-- Uploaded to: SVG Repo, www.svgrepo.com, Transformed by: SVG Repo Mixer Tools -->  */}
                    <title>map-marker</title> <desc>Created with Sketch.</desc>{" "}
                    <defs> </defs>{" "}
                    <g
                      id="Vivid.JS"
                      stroke="none"
                      strokeWidth={"1"}
                      fill="none"
                      fillRule="evenodd"
                    >
                      {" "}
                      <g
                        id="Vivid-Icons"
                        transform="translate(-125.000000, -643.000000)"
                      >
                        {" "}
                        <g
                          id="Icons"
                          transform="translate(37.000000, 169.000000)"
                        >
                          {" "}
                          <g
                            id="map-marker"
                            transform="translate(78.000000, 468.000000)"
                          >
                            {" "}
                            <g transform="translate(10.000000, 6.000000)">
                              {" "}
                              <path
                                d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"
                                id="Shape"
                                fill="#7a70ff"
                              >
                                {" "}
                              </path>{" "}
                              <circle
                                id="Oval"
                                fill="#adadad"
                                fillRule="nonzero"
                                cx="14"
                                cy="14"
                                r="7"
                              >
                                {" "}
                              </circle>{" "}
                            </g>{" "}
                          </g>{" "}
                        </g>{" "}
                      </g>{" "}
                    </g>{" "}
                  </g>
                </svg>
                My locaton
              </Button>
            </div>
            <div className="d-flex justify-content-center">
              <div
                style={{ width: "400px", height: "400px", maxWidth: "100%" }}
              >
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
          </div>
        </Col>
      </Row>
      <div className="mt-2">{locationInfosPart}</div>
    </div>
  );
}

export default SetLocationComponent;
