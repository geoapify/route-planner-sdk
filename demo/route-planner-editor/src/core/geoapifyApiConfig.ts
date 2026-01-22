export const geoapifyApiKey = "2637972f7da045ca8089265acdbbc1d0";

export const mapStyleUrl =
  "https://maps.geoapify.com/v1/styles/osm-bright/style.json";

export const getAPIKey = () => geoapifyApiKey;

export const getMapStyle = () => `${mapStyleUrl}?apiKey=${getAPIKey()}`;

export const getMarkerIconUrl = (
  text: string,
  color: string,
  size = 26,
  contentSize = 16
) => {
  const colorEncoded = encodeURIComponent(color);
  const textEncoded = encodeURIComponent(text);
  return `https://api.geoapify.com/v2/icon/?type=circle&color=${colorEncoded}&size=${size}&contentSize=${contentSize}&text=${textEncoded}&scaleFactor=2&apiKey=${getAPIKey()}`;
};

export const getAlertIconUrl = (color = "#d93025") =>
  getMarkerIconUrl("!", color, 26, 16);
