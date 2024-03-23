import { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";

import { Row, Col, Pagination, Dropdown, Form, Button } from "react-bootstrap";
import ReactStars from "react-rating-stars-component";
import { FileUploader } from "react-drag-drop-files";
import SearchInput from "./search_input";
import ImageCropper from "./imageCropper";

import image1 from "../assests/BiYaab Search Globally With No Restrictions.png";
import map from "../assests/map.png";
import lensIcon from "../assests/lens.png";
import textIcon from "../assests/text_icon.png";

import { fetchData, fetchImageRelatedData } from "../actions/shopping";

// import Carousel from "@moxy/react-carousel";

// import "@moxy/react-carousel/dist/styles.css";
import "react-image-crop/dist/ReactCrop.css";

let imgMemo = null;
const cropImage = (image) => {
  if (image) {
    imgMemo = image;
  } else {
    return imgMemo;
  }
};

function ShoppingComponent(props) {
  const sorterBys = ["price", "rating", "reviews", "source"];
  const fileTypes = ["JPG", "PNG"];
  const pageSizes = [20, 40, 60, 80];
  const { locationInfos, setLocationInfos } = props;
  const [mode, setMode] = useState("text");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchResult, setSearchResult] = useState({});
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizes[0]);
  const [pageCount, setPageCount] = useState(0);
  const [sorterBy, setSorterBy] = useState(sorterBys[0]);
  const [sorter, setSorter] = useState(true);
  const [selectImage, setSelectImage] = useState(null);

  function loadingReset() {
    setDisplayData([]);
    setSearchResult({ shopping_results: [], image_related_results: [] });
    setPage(1);
  }

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
    if (mode === "text" && searchResult.shopping_results) {
      let data = [...searchResult.shopping_results];
      data = data.slice((page - 1) * pageSize, page * pageSize);
      setDisplayData([...data]);
    }
    if (mode === "image" && searchResult.image_related_results) {
      let data = [...searchResult.image_related_results];
      data = data.slice((page - 1) * pageSize, page * pageSize);
      setDisplayData([...data]);
    }
    // eslint-disable-next-line
  }, [page, pageSize, searchResult]);

  useEffect(() => {
    if (mode === "text") {
      if (searchResult.shopping_results) {
        setPageCount(
          Math.ceil(searchResult.shopping_results.length / pageSize)
        );
        setPage(1);
      }
    } else {
      if (searchResult.image_related_results) {
        setPageCount(
          Math.ceil(searchResult.image_related_results.length / pageSize)
        );
        setPage(1);
      }
    }
    // eslint-disable-next-line
  }, [searchResult, pageSize]);

  const sorterByFunc = (
    data1 = mode === "text"
      ? searchResult.shopping_results
      : searchResult.image_related_results
  ) => {
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
      if (mode === "text") {
        setSearchResult({ shopping_results: data, image_related_results: [] });
      } else {
        setSearchResult({ shopping_results: [], image_related_results: data });
      }
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

  const handleChangeMode = () => {
    loadingReset();
    setLoading(false);
    setSearchProduct("");
    cropImage(null);
    setSelectImage(null);
    setMode(mode === "text" ? "image" : "text");
  };

  useEffect(() => {
    mode === "text"
      ? fetchData(
          loadingReset,
          setLoading,
          searchProduct,
          setSearchResult,
          sorterByFunc,
          locationInfos
        )
      : fetchImageRelatedData(
          loadingReset,
          setLoading,
          setSearchResult,
          sorterByFunc,
          locationInfos,
          cropImage()
        );
    // eslint-disable-next-line
  }, [locationInfos]);

  const changeSearchProduct = (value) => {
    setSearchProduct(value);
    if (locationInfos.length > 0) {
      fetchData(
        loadingReset,
        setLoading,
        value,
        setSearchResult,
        sorterByFunc,
        locationInfos
      );
    } else {
      alert("Please Choose Minimum One Location From the Filter Icon");
    }
  };

  const handleUploadImage = (file) => {
    setSelectImage(file);
  };

  const onChangeCropImage = (file) => {
    cropImage(file);
    console.log("crop image:", cropImage());
  };

  useEffect(() => {
    console.log(selectImage);
  }, [selectImage]);

  const onSearchRelatedProducts = () => {
    if (locationInfos.length > 0) {
      fetchImageRelatedData(
        loadingReset,
        setLoading,
        setSearchResult,
        sorterByFunc,
        locationInfos,
        cropImage()
      );
    } else {
      alert("Please Choose Minimum One Location From the Filter Icon");
    }
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
                      {mode === "text" ? (
                        <a href={ele.product_link}>
                          <img
                            src={ele.thumbnail}
                            alt={ele.title}
                            style={{ maxWidth: "100%", maxHeight: "100px" }}
                          ></img>
                        </a>
                      ) : (
                        <img
                          src={ele.thumbnail}
                          alt={ele.title}
                          style={{ maxWidth: "100%", maxHeight: "100px" }}
                        ></img>
                      )}
                    </div>
                    <div className="product_title">{ele.title}</div>
                    {ele.reviews > 0 && (
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
                    {ele.usd_price !== 0 && (
                      <div
                        className="font-weight-bold"
                        style={{ fontWeight: "bold" }}
                      >
                        {`price: ${ele.real_price} -> ${ele.usd_price} USD`}
                      </div>
                    )}
                  </div>
                  <div className="my-1 px-2" style={{ height: "100%" }}>
                    <a
                      href={ele.link}
                      style={{ textDecoration: "none" }}
                      className="d-flex align-items-center"
                    >
                      {mode !== "text" && ele.source_icon && (
                        <img
                          src={ele.source_icon}
                          alt="source icon"
                          style={{
                            maxWidth: "20px",
                            maxHeight: "20px",
                            marginRight: "5px",
                          }}
                        ></img>
                      )}
                      {ele.source}
                    </a>
                    {mode === "text" && (
                      <>
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
                            />
                            <span
                              className="mt-2"
                              style={{ marginLeft: "10px" }}
                            >
                              {ele.store_reviews}
                            </span>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                  {mode === "text" && ele.number_of_comparisons ? (
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
    <div className="pb-3">
      <Row className="align-items-center">
        <Col
          xl={3}
          className="mb-3 order-xl-1 order-2"
          style={{ maxHeight: "250px", overflowY: "auto" }}
        >
          {locationPart}
        </Col>
        <Col
          xl={6}
          className="d-flex justify-content-center mb-3 order-1 order-xl-2"
        >
          <img
            src={image1}
            alt="image1"
            style={{ height: searchProduct !== "" ? "100px" : "100px" }}
          ></img>
        </Col>
        <Col
          xl={3}
          className="order-3 d-flex justify-content-end align-items-center"
        >
          {mode === "text" && searchProduct !== "" ? (
            <>
              <SearchInput
                searchValue={searchProduct}
                setSearchValue={changeSearchProduct}
              ></SearchInput>
              <div
                style={{ cursor: "pointer", marginLeft: "10px" }}
                onClick={handleChangeMode}
              >
                <img src={lensIcon} alt="icon" height={30}></img>
              </div>
            </>
          ) : null}
          {mode === "image" && selectImage && (
            <div
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={handleChangeMode}
            >
              <img src={textIcon} alt="icon" height={30}></img>
            </div>
          )}
        </Col>
      </Row>

      {mode === "text" ? (
        searchProduct === "" ? (
          <Row className="justify-content-center py-3">
            <Col
              xl={4}
              className="d-flex justify-content-center align-items-center"
            >
              <div style={{ width: "100%" }}>
                <SearchInput
                  searchValue={searchProduct}
                  setSearchValue={changeSearchProduct}
                ></SearchInput>
              </div>
              <div
                style={{ cursor: "pointer", marginLeft: "10px" }}
                onClick={handleChangeMode}
              >
                <img src={lensIcon} alt="icon" height={30}></img>
              </div>
            </Col>
          </Row>
        ) : null
      ) : selectImage === null ? (
        <Row className="justify-content-center py-3">
          <Col xl={4}>
            <div className="image-drop-part p-3">
              <div className="d-flex justify-content-center position-relative">
                <div>Search any image with Google Lens</div>
                <div className="position-absolute top-0 end-0">
                  <div className="close-button" onClick={handleChangeMode}>
                    X
                  </div>
                </div>
              </div>
              <div
                className="mt-2 w-full p-3"
                style={{ border: "dotted 2px #817b7b", borderRadius: "10px" }}
              >
                <div className="d-flex justify-content-center align-items-center">
                  <FileUploader
                    handleChange={handleUploadImage}
                    name="object"
                    types={fileTypes}
                    label="Drap and drop"
                  >
                    <div
                      className="w-full d-flex justify-content-center align-items-center p-4 border"
                      style={{ height: "200px", borderRadius: "10px" }}
                    >
                      <div className="w-full d-flex justify-content-center">
                        Drag an image here or upload a file
                      </div>
                    </div>
                  </FileUploader>
                </div>

                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ width: "100%" }}
                >
                  <div
                    className="border"
                    style={{ height: 0, width: "100%" }}
                  ></div>
                  <div>&nbsp;OR&nbsp;</div>
                  <div
                    className="border"
                    style={{ height: 0, width: "100%" }}
                  ></div>
                </div>
                <Row className="">
                  <Col sm={9}>
                    <Form.Control placeholder="Paste image link" />
                  </Col>
                  <Col sm={3} className="mt-md-0 mt-2">
                    <Button className="w-full" style={{ width: "100%" }}>
                      Search
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      ) : null}

      {mode === "text" ? (
        searchProduct === "" ? (
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
        )
      ) : selectImage === null ? null : (
        <Row>
          <Col md={4} className="crop-image-parent">
            <ImageCropper
              src={URL.createObjectURL(selectImage)}
              onChangeCropImage={onChangeCropImage}
            />
          </Col>
          <Col md={8} className="mt-md-0 mt-2">
            <div className="d-flex justify-content-end">
              <Button onClick={onSearchRelatedProducts}>Search</Button>
            </div>
            {loading ? (
              <div className="d-flex justify-content-center">
                <span className="h2">loading...</span>
              </div>
            ) : (
              productsPart
            )}
          </Col>
        </Row>
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
