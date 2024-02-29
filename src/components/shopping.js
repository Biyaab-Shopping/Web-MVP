import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import _ from "lodash";

import { Row, Col, Pagination } from "react-bootstrap";
import ReactStars from "react-rating-stars-component";
import SearchInput from "./search_input";

import image1 from "../assests/BiYaab Search Globally With No Restrictions.png";
import map from "../assests/map.png";

import * as setting from "../config";

function ShoppingComponent(props) {
  const { locationInfo } = props;
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResult, setSearchResult] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function fetchData(searchName, page = 1, num = 60) {
    if (searchName !== "" && locationInfo.locationName !== "") {
      try {
        setLoading(true);
        const response = await axios.get(
          `${setting.backend}/shopping/${
            locationInfo.locationName
          }/${searchName}?start=${(page - 1) * num}&num=${num}`
        );
        console.log(response.data);
        setSearchResult(response.data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    }
  }

  const changeSearchProduct = (value) => {
    setSearchProduct(value);
    fetchData(value);
  };

  const changePage = (page) => {
    fetchData(searchProduct, page);
  };

  useEffect(() => {
    console.log(searchProduct);
  }, [searchProduct]);

  const locationPart =
    locationInfo.locationName !== "" ? (
      <div>
        <div>location: {locationInfo.locationName}</div>
        <div>{`currency: 1 USD-> ${locationInfo.currencyInfo.rate} ${locationInfo.currencyInfo.name}`}</div>
        <div></div>
      </div>
    ) : (
      "Please choose the location!"
    );

  const productsPart = useMemo(() => {
    const paginationPart = (pagination) => {
      const pageCount =
        _.keys(pagination.other_pages).length + (pagination.current ? 1 : 0);
      let array = [];
      for (let i = 0; i < pageCount; i++) {
        array.push(i + 1);
      }
      let pageItems = array.map((el) => (
        <Pagination.Item
          disabled={pagination.current === el}
          onClick={() => changePage(el)}
        >
          {el}
        </Pagination.Item>
      ));
      return (
        <div>
          <Pagination>
            <Pagination.First
              disabled={pagination.current === 1}
              onClick={() => changePage(1)}
            ></Pagination.First>
            <Pagination.Prev
              disabled={pagination.prev === undefined}
              onClick={() => changePage(pagination.current - 1)}
            ></Pagination.Prev>
            {pageItems}
            <Pagination.Next
              disabled={pagination.next === undefined}
              onClick={() => changePage(pagination.current + 1)}
            ></Pagination.Next>
            <Pagination.Last
              disabled={pagination.current === pageCount}
              onClick={() => changePage(pageCount)}
            ></Pagination.Last>
          </Pagination>
        </div>
      );
    };
    return (
      <Row>
        {/* <Col md={3}></Col> */}
        <Col md={12}>
          {searchResult.pagination
            ? paginationPart(searchResult.pagination)
            : null}
          <Row className="justify-content-between">
            {searchResult.shopping_results &&
              searchResult.shopping_results.map((ele) => {
                return (
                  <Col md={3} className="mb-2 pr-2">
                    <div
                      className="border d-flex flex-column justify-content-between"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="border-bottom p-2"
                        style={{ height: "100%" }}
                      >
                        <div className="d-flex justify-content-center">
                          <a href={ele.product_link}>
                            <img
                              src={ele.thumbnail}
                              alt={ele.title}
                              style={{ maxWidth: "100%", maxHeight: "100px" }}
                            ></img>
                          </a>
                        </div>
                        <div className="product_title">{ele.title}</div>
                        <div className="d-flex align-items-center">
                          <span
                            className="mt-1"
                            style={{ marginRight: "10px" }}
                          >
                            {ele.rating}
                          </span>
                          <ReactStars
                            edit={false}
                            value={Math.round(ele.rating)}
                            count={5}
                            // onChange={ratingChanged}
                            size={24}
                            activeColor="#ffd700"
                          />
                          <span className="mt-1" style={{ marginLeft: "10px" }}>
                            {ele.reviews}
                          </span>
                        </div>
                        <div
                          className="font-weight-bold"
                          style={{ fontWeight: "bold" }}
                        >
                          {`price: ${locationInfo.currencyInfo.symbol}
                      ${ele.extracted_price} -> $
                      ${(
                        ele.extracted_price / locationInfo.currencyInfo.rate
                      ).toFixed(2)}`}
                        </div>
                      </div>
                      <div className="my-1 px-2" style={{ height: "100%" }}>
                        <a href={ele.link} style={{ textDecoration: "none" }}>
                          {ele.source}
                        </a>
                        <br />
                        <p>{ele.delivery}</p>
                        {ele.store_rating ? (
                          <div className="d-flex">
                            <span
                              className="mt-2"
                              style={{ marginRight: "10px" }}
                            >
                              {ele.store_rating}/5
                            </span>
                            <ReactStars
                              value={1}
                              count={1}
                              size={24}
                              activeColor="#ffd700"
                            ></ReactStars>
                            <span
                              className="mt-2"
                              style={{ marginLeft: "10px" }}
                            >
                              {ele.store_reviews}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {ele.number_of_comparisons ? (
                        <div className="border-top px-2">
                          <a
                            className="py-1"
                            href={ele.comparison_link}
                            style={{ textDecoration: "none" }}
                          >
                            Compares prices from {ele.number_of_comparisons}
                            stores
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </Col>
                );
              })}
          </Row>
        </Col>
      </Row>
    );
  }, [searchResult, locationInfo.currencyInfo]);
  return (
    <div>
      <Row className="align-items-center">
        <Col xl={3} className="mb-3">
          {locationPart}
        </Col>
        <Col xl={6} className="d-flex justify-content-center mb-3">
          <img
            src={image1}
            alt="image1"
            style={{ height: searchProduct !== "" ? "100px" : "100px" }}
          ></img>
        </Col>
        {searchProduct !== "" ? (
          <Col xl={3}>
            <SearchInput
              searchValue={searchProduct}
              setSearchValue={changeSearchProduct}
            ></SearchInput>
          </Col>
        ) : null}
      </Row>

      {searchProduct === "" ? (
        <Row className="justify-content-center py-3">
          <Col xl={4}>
            <SearchInput
              searchValue={searchProduct}
              setSearchValue={changeSearchProduct}
            ></SearchInput>
          </Col>
        </Row>
      ) : null}

      {searchProduct === "" ? (
        <Row className="justify-content-center mt-4">
          <Col sm={7}>
            <img src={map} alt="map" style={{ width: "100%" }}></img>
          </Col>
        </Row>
      ) : loading ? (
        <div className="d-flex justify-content-center">
          <span className="h2">loading...</span>
        </div>
      ) : (
        productsPart
      )}
    </div>
  );
}

export default ShoppingComponent;
