import { Row, Col } from "react-bootstrap";

import SearchInput from "./search_input";

import image1 from "../assests/BiYaab Search Globally With No Restrictions.png";
import map from "../assests/map.png";

function ShoppingComponent(props) {
  const { searchProduct, setSearchProduct } = props;
  return (
    <div>
      <Row className="justify-content-center">
        <Col sm={6} className="d-flex justify-content-center">
          <img src={image1} alt="image1" style={{ height: "100px" }}></img>
        </Col>
      </Row>
      <Row className="justify-content-center py-3">
        <Col md={4}>
          <SearchInput
            searchValue={searchProduct}
            setSearchValue={setSearchProduct}
          ></SearchInput>
        </Col>
      </Row>
      <Row className="justify-content-center mt-4">
        <Col sm={7}>
          <img src={map} alt="map" style={{ width: "100%" }}></img>
        </Col>
      </Row>
    </div>
  );
}

export default ShoppingComponent;
