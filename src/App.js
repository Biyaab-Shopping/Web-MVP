import axios from "axios";
import { useEffect, useState } from "react";

// import components
import { Container, Modal } from "react-bootstrap";

import Head from "./components/head";
import Shopping from "./components/shopping";
import SetLocationComponent from "./components/setLocation";

// import css files
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

import * as setting from "./config";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [rateData, setRateData] = useState({});
  const [locationInfo, setLocationInfo] = useState({
    locationName: "",
    currencyInfo: {
      rate: "",
      name: "",
      symbol: "",
    },
  });

  const [mapConfig, setMapConfig] = useState({
    // center: {},
    center: { lat: 37.7, lng: -122.4 },
    zoom: 8,
  });
  const [markers, setMarkers] = useState([
    {
      lat: 37.7,
      lng: -122.4,
    },
  ]);

  const modalOpenToggle = () => {
    setModalOpen(!modalOpen);
  };

  const fetchRateData = async () => {
    try {
      const currencyInfoResponse = await axios.get(
        `https://openexchangerates.org/api/latest.json?app_id=${setting.open_ex_AppId}`
      );

      const rates = currencyInfoResponse.data.rates;
      setRateData(rates);
      console.log(rates);
    } catch (error) {
      console.log();
    }
  };
  useEffect(() => {
    fetchRateData();
  }, []);

  return (
    <div className="App">
      <Container>
        <Head modalOpen={modalOpenToggle}></Head>
        <Shopping locationInfo={locationInfo}></Shopping>
      </Container>
      <Modal
        show={modalOpen}
        onHide={modalOpenToggle}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Body>
          <SetLocationComponent
            mapConfig={mapConfig}
            setMapConfig={setMapConfig}
            markers={markers}
            setMarkers={setMarkers}
            rateData={rateData}
            setLocationInfo={setLocationInfo}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
