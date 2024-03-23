import axios from "axios";

import * as setting from "../config";
import countryData from "../google-countries.json";

export async function fetchData(
  loadingReset,
  setLoading,
  searchName,
  setSearchResult,
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

export async function fetchImageRelatedData(
  loadingResetImage,
  setLoading,
  setSearchResult,
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
        const countryCode = countryData.find((el) =>
          el.country_name.includes(locationInfos[i].country)
        ).country_code;
        let response;
        try {
          let formdata = new FormData();
          formdata.append("object", image);
          response = await axios.post(
            `${setting.backend}/shopping/${countryCode}/${locationInfos[i].locationName}`,
            formdata
          );
          if (response.data.error) throw response.data.error;
          let visual_matches = response.data.visual_matches.map((el) => {
            return {
              ...el,
              rating: el.rating ? el.rating : 0,
              reviews: el.reviews ? el.reviews : 0,
              usd_price: el.price.extracted_price
                ? Number(
                    (
                      el.price.extracted_price /
                      locationInfos[i].currencyInfo.rate
                    ).toFixed(2)
                  )
                : "",
              real_price: el.price.extracted_price
                ? el.price.extracted_price.toString() +
                  " " +
                  locationInfos[i].currencyInfo.name
                : "",
              locationInfo: i + 1,
            };
          });
          data = [...data, ...visual_matches];
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
      setSearchResult({ image_related_results: data });
      setTimeout(() => {
        sorterByFunc(data);
        setLoading(false);
      }, 150);
    }
  }
}
