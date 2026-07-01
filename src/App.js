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

import mapIcon from "./assests/map.png";

const backend = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [rateData, setRateData] = useState({});
  const [locationInfos, setLocationInfos] = useState([
    //   {
    //   locationName: "",
    //   currencyInfo: {
    //     rate: "",
    //     name: "",
    //     symbol: "",
    //   },
    // }
  ]);

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
    if (!backend) {
      console.error(
        "Missing REACT_APP_BACKEND_URL in .env. Restart the dev server after updating .env."
      );
      return;
    }
    try {
      const currencyInfoResponse = await axios.get(`${backend}/rates`);
      setRateData(currencyInfoResponse.data);
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    }
  };
  useEffect(() => {
    fetchRateData();
  }, []);

  document.title = "Biyaab.com";
  return (
    <div className="App">
      <Container>
        <Head modalOpen={modalOpenToggle}></Head>
        <Shopping
          rateData={rateData}
          locationInfos={locationInfos}
          setLocationInfos={setLocationInfos}
        ></Shopping>
      </Container>
      <Modal
        className="p-0"
        show={modalOpen}
        onHide={modalOpenToggle}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Header closeButton>
          <img src={mapIcon} width={50} alt="map"></img>
        </Modal.Header>
        <Modal.Body>
          {modalOpen && (
            <SetLocationComponent
              mapConfig={mapConfig}
              setMapConfig={setMapConfig}
              markers={markers}
              setMarkers={setMarkers}
              rateData={rateData}
              locationInfos={locationInfos}
              setLocationInfos={setLocationInfos}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default App;
