import axios from "axios";

import { API_BASE } from "../api";
import lensCountryData from "../google-lens-countries.json";
import currencyData from "../currency-symbols-main.json";
import { resolveCountryCode } from "../utils/countryCode";
import _ from "lodash";

export async function fetchData(
  loadingReset,
  setLoading,
  searchName,
  rateData,
  sorterByFunc,
  locationInfos = [],
  page = 1,
  num = 80,
  tbs = null
) {
  let data = [];
  if (searchName !== "") {
    try {
      loadingReset();
      setLoading(true);
      for (let i = 0; i < locationInfos.length; i++) {
        const countryCode = resolveCountryCode(locationInfos[i]);
        if (!countryCode) {
          alert(`Could not resolve country for "${locationInfos[i].country}".`);
          continue;
        }
        let response;
        try {
          response = await axios.get(
            `${API_BASE}/shopping/${countryCode}/${
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
      // setSearchResult({ shopping_results: data });
      // setTimeout(() => {
      sorterByFunc(data);
      setLoading(false);
      // }, 150);
    }
  }
}

export async function fetchImageRelatedData(
  loadingResetImage,
  setLoading,
  rateData,
  sorterByFunc,
  locationInfos = [],
  image
) {
  let data = [];
  if (image !== null) {
    try {
      loadingResetImage();
      setLoading(true);
      for (let i = 0; i < locationInfos.length; i++) {
        const countryCode =
          resolveCountryCode(locationInfos[i]) ||
          _.findKey(lensCountryData, function (o) {
            return o === locationInfos[i].country;
          });
        if (!countryCode) {
          alert(`Could not resolve country for "${locationInfos[i].country}".`);
          continue;
        }
        let response;
        try {
          let formdata = new FormData();
          formdata.append("object", image);
          response = await axios.post(
            `${API_BASE}/shopping/${countryCode}/${locationInfos[i].locationName}`,
            formdata
          );
          if (response.data.error) throw response.data.error;
          if (!response.data.visual_matches?.length) {
            throw (
              response.data.error ||
              "Google Lens hasn't returned any results for this query."
            );
          }
          let visual_matches = response.data.visual_matches.map((el) => {
            return {
              ...el,
              rating: el.rating ? el.rating : 0,
              reviews: el.reviews ? el.reviews : 0,
              usd_price: el.price
                ? Number(
                    (
                      el.price.extracted_value /
                      rateData[
                        _.findKey(currencyData, function (o) {
                          return (
                            o.symbol === el.price.currency ||
                            o.symbol === el.price.value.split(" ")[0]
                          );
                        })
                      ]
                    ).toFixed(2)
                  )
                : Number(0),
              // real_price: el.price
              //   ? el.price.extracted_value.toString() +
              //     " " +
              //     (el.price.currency === "$"
              //       ? "USD"
              //       : locationInfos[i].currencyInfo.name)
              //   : "",
              real_price: el.price
                ? // ? el.price.currency + " " + el.price.extracted_value.toString()
                  el.price.value
                : "",
              locationInfo: i + 1,
            };
          });
          data = [...data, ...visual_matches];
        } catch (error) {
          console.log(error);
          const errorMessage =
            typeof error === "string"
              ? error
              : error.response
              ? error.response.data.error
              : `Google doesn't support "${locationInfos[i].locationName}".`;
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      // setSearchResult({ image_related_results: data });
      // setTimeout(() => {
      sorterByFunc(data);
      setLoading(false);
      // }, 150);
    }
  }
}

export function saveImage(imagelink) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        `${API_BASE}/shopping/saveimage`,
        {
          imageUrl: imagelink,
        }
      );
      resolve(response.data.imagePath);
    } catch (error) {
      alert("We can't use the link. Please insert another link");
    }
  });
}
