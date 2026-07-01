import countryData from "../google-countries.json";

const SERP_GL_ALIASES = {
  um: "us",
};

const countryByName = new Map(
  countryData.map((entry) => [entry.country_name, entry.country_code])
);

export function normalizeGlCode(code) {
  if (!code) return code;
  const normalized = code.toLowerCase();
  return SERP_GL_ALIASES[normalized] || normalized;
}

export function resolveCountryCode(locationInfo) {
  const code =
    locationInfo.countryCode ||
    countryByName.get(locationInfo.country);
  return normalizeGlCode(code);
}
