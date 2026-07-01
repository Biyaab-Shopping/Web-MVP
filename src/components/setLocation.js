import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import countryToCurrency from "country-to-currency";

import CountryData from "../google-countries.json";
import CurrencyData from "../currency-symbols.json";

import { Button, Col, Row } from "react-bootstrap";

import MapComponent from "./googl_map";
import SearchInput from "./search_input";

import { normalizeGlCode } from "../utils/countryCode";

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

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

  const [country, setCountry] = useState("");
  const [pointLocationName, setPointLocationName] = useState("");
  const [currency, setCurrency] = useState({ name: "", symbol: "" });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [locationName, setLocationName] = useState("");

  const mapRef = useRef(null);
  const geocodeRequestId = useRef(0);
  const locationMetaRef = useRef({
    country: "",
    countryCode: "",
    pointLocationName: "",
  });

  const applyLocationDetails = useCallback(
    (countryName, resolvedCountryCode, pointName) => {
      const code =
        resolvedCountryCode ||
        (countryName === "United Kingdom"
          ? "gb"
          : CountryData.find((el) => el.country_name === countryName)
              ?.country_code);
      const currencyCode = countryToCurrency[code?.toUpperCase()];
      const currencySymbol = CurrencyData[currencyCode];

      setCountry(countryName);
      setPointLocationName(pointName);
      setCurrency({
        name: currencyCode || "",
        symbol: currencySymbol || "",
      });
      locationMetaRef.current = {
        country: countryName,
        countryCode: normalizeGlCode(resolvedCountryCode),
        pointLocationName: pointName,
      };
    },
    []
  );

  const findLocaionFunc = async (value) => {
    if (value === "") return;
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          value
        )}&key=${googleMapsApiKey}`
      );
      if (response.data.status === "OK" && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const position = { lat, lng };
        setMapConfig((prev) => ({
          ...prev,
          center: position,
        }));
        setMarkers([position]);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };
  const onChangeLocationName = (value) => {
    setLocationName(value);
    findLocaionFunc(value);
  };

  useEffect(() => {
    let cancelled = false;

    async function reverseGeocode() {
      if (markers[0]?.lat == null || markers[0]?.lng == null) return;

      setIsGeocoding(true);
      const requestId = ++geocodeRequestId.current;

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${markers[0].lat},${markers[0].lng}&key=${googleMapsApiKey}`
        );

        if (cancelled || requestId !== geocodeRequestId.current) return;

        if (response.data.results.length > 0) {
          let resolvedCountry = "",
            resolvedCountryCode = "",
            pointName = "";

          for (const ele of response.data.results) {
            for (const component of ele.address_components) {
              if (component.types.includes("country")) {
                const code = component.short_name.toLowerCase();
                resolvedCountryCode = code;
                const match = CountryData.find(
                  (el) => el.country_code === code
                );
                resolvedCountry = match ? match.country_name : "";
              }

              if (resolvedCountry !== "") {
                pointName = ele.formatted_address;
                break;
              }
            }
            if (resolvedCountry !== "") break;
          }

          if (resolvedCountry !== "") {
            applyLocationDetails(
              resolvedCountry,
              resolvedCountryCode,
              pointName
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error fetching data from Google Maps Geocoding API:",
            error
          );
          setCountry("Please select the correct point!");
        }
      } finally {
        if (!cancelled) {
          setIsGeocoding(false);
        }
      }
    }

    reverseGeocode();

    return () => {
      cancelled = true;
    };
  }, [markers, applyLocationDetails]);

  const getMyLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setMapConfig((prev) => ({
        ...prev,
        center: { ...pos },
      }));
      setMarkers([
        {
          ...pos,
        },
      ]);
    });
  };

  const formatCurrencyRate = (currencyCode, symbol) => {
    if (isGeocoding) return "Looking up location...";
    if (!currencyCode) return "Select a point on the map";
    const rate = rateData[currencyCode];
    if (rate == null) return "Loading exchange rate...";
    return `1 USD → ${rate} ${symbol}`;
  };

  const setLocationCheck = () => {
    const meta = locationMetaRef.current;
    if (meta.pointLocationName !== "") {
      const rate = rateData[currency.name];
      if (rate == null) {
        alert("Exchange rates are still loading. Please try again in a moment.");
        return;
      }
      setLocationInfos([
        ...locationInfos,
        {
          country: meta.country,
          countryCode: meta.countryCode,
          locationName: meta.pointLocationName,
          currencyInfo: {
            rate,
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
                {formatCurrencyRate(currency.name, currency.symbol)}
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
                  // _mapCenterChanged={MapCenterChanged}
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
