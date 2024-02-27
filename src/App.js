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
  const [searchProduct, setSearchProduct] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [rateData, setRateData] = useState({});

  const [locationName, setLocationName] = useState("");
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
        <Shopping
          searchProduct={searchProduct}
          setSearchProduct={setSearchProduct}
        ></Shopping>
      </Container>
      <Modal
        show={modalOpen}
        onHide={modalOpenToggle}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Body>
          <SetLocationComponent
            locationName={locationName}
            setLocationName={setLocationName}
            mapConfig={mapConfig}
            setMapConfig={setMapConfig}
            markers={markers}
            setMarkers={setMarkers}
            rateData={rateData}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
