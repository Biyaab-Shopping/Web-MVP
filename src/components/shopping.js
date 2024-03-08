import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import _ from "lodash";

import { Row, Col, Pagination, Dropdown } from "react-bootstrap";
import ReactStars from "react-rating-stars-component";
import SearchInput from "./search_input";

import image1 from "../assests/BiYaab Search Globally With No Restrictions.png";
import map from "../assests/map.png";

import * as setting from "../config";
import countryData from "../google-countries.json";
// import Carousel from "@moxy/react-carousel";

// import "@moxy/react-carousel/dist/styles.css";

function ShoppingComponent(props) {
  const sorterBys = ["price", "rating", "reviews", "source"];
  const pageSizes = [20, 40, 60, 80];
  const { locationInfos, setLocationInfos } = props;
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResult, setSearchResult] = useState({});
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);
  const [pageCount, setPageCount] = useState(0);
  const [sorterBy, setSorterBy] = useState(sorterBys[0]);
  const [sorter, setSorter] = useState(true);

  function loadingReset() {
    setDisplayData([]);
    setSearchResult({ shopping_results: [] });
    setPage(1);
  }
  async function fetchData(searchName, page = 1, num = 80, tbs = null) {
    let data = [];
    if (searchName !== "") {
      try {
        loadingReset();
        setLoading(true);
        for (let i = 0; i < locationInfos.length; i++) {
          const countryCode = countryData.find((el) =>
            el.country_name.includes(locationInfos[i].country)
          ).country_code;
          let response;
          try {
            response = await axios.get(
              `${setting.backend}/shopping/${countryCode}/${
                locationInfos[i].locationName
              }/${encodeURIComponent(searchName)}?start=${
                (page - 1) * num
              }&num=${num}${tbs !== null ? `&tbs=${tbs}` : ""}`
            );
            if (response.data.error) throw response.data.error;
            let shopping_results = response.data.shopping_results.map((el) => {
              return {
                ...el,
                rating: el.rating ? el.rating : 0,
                reviews: el.reviews ? el.reviews : 0,
                usd_price: el.extracted_price
                  ? Number(
                      (
                        el.extracted_price / locationInfos[i].currencyInfo.rate
                      ).toFixed(2)
                    )
                  : "",
                real_price: el.extracted_price
                  ? el.extracted_price.toString() +
                    " " +
                    locationInfos[i].currencyInfo.name
                  : "",
                locationInfo: i + 1,
              };
            });
            data = [...data, ...shopping_results];
          } catch (error) {
            const errorMessage = error.response
              ? error.response.data.error
              : `Google doesn't support "${locationInfos[i].locationName}".`;
            console.log(errorMessage);
            alert(errorMessage);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setSearchResult({ shopping_results: data });
        setTimeout(() => {
          sorterByFunc(data);
          setLoading(false);
        }, 150);
      }
    }
  }

  useEffect(() => {
    fetchData(searchProduct);
    // eslint-disable-next-line
  }, [locationInfos]);

  const changeSearchProduct = (value) => {
    setSearchProduct(value);
    if (locationInfos.length > 0) {
      fetchData(value);
    } else {
      alert("Please Choose Minimum One Location From the Filter Icon");
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

  const locationPart = locationInfos.map((el, index) =>
    el.locationName !== "" ? (
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
    ) : (
      "Please choose the location!"
    )
  );

  useEffect(() => {
    if (searchResult.shopping_results) {
      let data = [...searchResult.shopping_results];
      data = data.slice((page - 1) * pageSize, page * pageSize);
      setDisplayData([...data]);
    }
  }, [page, pageSize, searchResult]);

  useEffect(() => {
    if (searchResult.shopping_results) {
      setPageCount(Math.ceil(searchResult.shopping_results.length / pageSize));
      setPage(1);
    }
  }, [searchResult, pageSize]);

  const sorterByFunc = (data1 = searchResult.shopping_results) => {
    if (data1) {
      let data = [...data1];
      if (sorterBy === "price") {
        data = data.sort((a, b) =>
          sorter ? a.usd_price - b.usd_price : b.usd_price - a.usd_price
        );
        // data = _.sortBy(data, "usd_price");
      } else {
        // data = data.sort((a, b) =>
        //   sorter ? a[sorterBy] - b[sorterBy] : b[sorterBy] - a[sorterBy]
        // );
        data = sorter
          ? _.sortBy(data, sorterBy)
          : _.reverse(_.sortBy(data, sorterBy));
      }
      setSearchResult({ shopping_results: data });
    }
  };

  useEffect(() => {
    sorterByFunc();
    // eslint-disable-next-line
  }, [sorterBy, sorter]);

  const onChangePage = (val) => {
    setPage(val);
  };
  const onChangePageSize = (eventKey) => {
    setPageSize(Number(eventKey));
  };

  const onChangeSorterBy = (val) => {
    setSorterBy(val);
  };

  const onChangeSorter = () => {
    const val = !sorter;
    setSorter(val);
  };

  const paginationPart = () => {
    let array = [];
    for (
      let i =
        pageCount > 5 ? Math.max(1, Math.min(page - 2, pageCount - 4)) : 1;
      i <=
      (pageCount > 5 ? Math.min(pageCount, Math.max(page + 2, 5)) : pageCount);
      i++
    ) {
      array.push(i);
    }
    let pageItems = array.map((el, index) => (
      <Pagination.Item
        disabled={page === el}
        onClick={() => onChangePage(el)}
        key={el}
      >
        {el}
      </Pagination.Item>
    ));
    return (
      <div className="d-md-flex justify-content-between mt-2">
        <div className="d-md-flex mt-md-0 mt-2">
          <Pagination className="">
            <Pagination.First
              disabled={page === 1}
              onClick={() => onChangePage(1)}
            ></Pagination.First>
            <Pagination.Prev
              disabled={page === 1}
              onClick={() => onChangePage(page - 1)}
            ></Pagination.Prev>
            {page > 3 && pageCount > 5 ? (
              <Pagination.Item>...</Pagination.Item>
            ) : null}
            {pageItems}
            {page < pageCount - 2 && pageCount > 5 ? (
              <Pagination.Item>...</Pagination.Item>
            ) : null}
            <Pagination.Next
              disabled={page === pageCount}
              onClick={() => onChangePage(page + 1)}
            ></Pagination.Next>
            <Pagination.Last
              disabled={page === pageCount}
              onClick={() => onChangePage(pageCount)}
            ></Pagination.Last>
          </Pagination>
          <Dropdown onSelect={onChangePageSize} className="mx-md-2">
            <Dropdown.Toggle
              variant="success"
              id="dropdown-basic"
              className="d-flex align-items-center"
              split={true}
            >
              <div style={{ width: "130px" }}>{pageSize}</div>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {pageSizes.map((el) => (
                <Dropdown.Item key={el} eventKey={el}>
                  {el}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="mt-2 mt-md-0 d-flex align-items-center">
          <div
            className="border p-2 px-3 rounded"
            onClick={onChangeSorter}
            style={{
              marginRight: "10px",
              cursor: "pointer",
              boxShadow: "3px 3px 3px -3px",
            }}
          >
            {sorter ? "ASC" : "DESC"}
          </div>
          <Dropdown onSelect={onChangeSorterBy}>
            <Dropdown.Toggle
              className="d-flex align-items-center"
              variant="success"
              id="dropdown-basic"
            >
              <div style={{ width: "120px" }}>Sort by "{sorterBy}"</div>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {sorterBys.map((el) => (
                <Dropdown.Item key={el} eventKey={el}>
                  {el}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    );
  };
  // eslint-disable-next-line
  // }, [
  //   pageCount,
  //   page,
  //   pageSize,
  //   sorter,
  //   sorterBy,
  //   // onChangeSorterBy,
  //   // onChangeSorter,
  //   sorterBys,
  //   pageSizes,
  // ]);

  const productsPart = useMemo(() => {
    return (
      <Row>
        {/* <Col md={3}></Col> */}
        <Col md={12}>
          {pageCount > 0 ? paginationPart() : null}
          <Row className="justify-content-between">
            {displayData.map((ele, index) => (
              <Col md={3} sm={6} key={index} className="mb-2 pr-2">
                <div
                  className="border d-flex flex-column justify-content-between"
                  style={{ height: "100%" }}
                >
                  <div className="border-bottom p-2">
                    location: {ele.locationInfo}
                  </div>
                  <div className="border-bottom p-2" style={{ height: "100%" }}>
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
                    {ele.reviews && ele.reviews > 0 && (
                      <div className="d-flex align-items-center">
                        <span className="mt-1" style={{ marginRight: "10px" }}>
                          {ele.rating}
                        </span>
                        {ele.rating && (
                          <ReactStars
                            edit={false}
                            value={Math.round(ele.rating)}
                            count={5}
                            // onChange={ratingChanged}
                            size={24}
                            activeColor="#ffd700"
                          />
                        )}
                        <span className="mt-1" style={{ marginLeft: "10px" }}>
                          {ele.reviews}
                        </span>
                      </div>
                    )}
                    {ele.usd_price !== "" && (
                      <div
                        className="font-weight-bold"
                        style={{ fontWeight: "bold" }}
                      >
                        {`price:${ele.real_price} -> ${ele.usd_price} USD`}
                      </div>
                    )}
                  </div>
                  <div className="my-1 px-2" style={{ height: "100%" }}>
                    <a href={ele.link} style={{ textDecoration: "none" }}>
                      {ele.source}
                    </a>
                    <br />
                    <p>{ele.delivery}</p>
                    {ele.store_rating ? (
                      <div className="d-flex">
                        <span className="mt-2" style={{ marginRight: "10px" }}>
                          {ele.store_rating}/5
                        </span>
                        <ReactStars
                          value={1}
                          count={1}
                          size={24}
                          activeColor="#ffd700"
                        />
                        <span className="mt-2" style={{ marginLeft: "10px" }}>
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
            ))}
          </Row>
          {pageCount > 0 ? paginationPart() : null}
        </Col>
      </Row>
    );
    // eslint-disable-next-line
  }, [displayData]);
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

/* {searchResult.categories?.map((category) => (
            <div className="mt-2">
              <div className="h5">{category.title}</div>
              <div className="mt-2">
                <Carousel
                  swapOnDragMoveEnd={true}
                  arrows={category.filters.length >= 6}
                  renderArrows={({ previous, next }) => (
                    <>
                      <button
                        className="rc-arrow -left arrow"
                        onClick={previous}
                      >
                        <svg
                          focusable="false"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                        </svg>
                      </button>
                      <button className="rc-arrow -right arrow" onClick={next}>
                        <svg
                          focusable="false"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                        </svg>
                      </button>
                    </>
                  )}
                  autoplayDirection
                  carouselClassName="overflow-x-hidden"
                >
                  {category.filters?.map((el) => (
                    <div
                      className="mr-2"
                      style={{ height: "100%", marginRight: "10px" }}
                    >
                      <a
                        href={el.link}
                        style={{ textDecoration: "none", fontColor: "#202124" }}
                      >
                        <div
                          className="border border-rounded d-flex flex-column justify-content-between"
                          style={{ height: "100%" }}
                        >
                          <div
                            className="p-2"
                            style={{ background: "#e1e1e1", height: "100%" }}
                          >
                            <img
                              src={el.thumbnail}
                              alt={el.title}
                              style={{ maxWidth: "100%" }}
                            ></img>
                          </div>
                          <div className="d-flex justify-content-center p-2">
                            <span style={{ textDecoration: "none" }}>
                              {el.title}
                            </span>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </Carousel>
              </div>
            </div>
          ))} */
