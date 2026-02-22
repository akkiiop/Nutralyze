// ------------------------------
// BACKEND 1: AUTH / USER / MEALS (Express server)
// ------------------------------
const getIsLocal = () => {
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.")
  );
};

export const getAuthServerUrl = () => {
  return getIsLocal()
    ? "http://localhost:8080/api"
    : "/api";
};

// ------------------------------
// BACKEND 2: AI MODEL SERVER
// ------------------------------
export const getAiServerUrl = () => {
  // Use env var if available, otherwise fallback
  const envUrl = import.meta.env?.VITE_AI_MODEL_URL;
  if (envUrl && !getIsLocal()) return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;

  return getIsLocal()
    ? "http://localhost:5000/api"
    : "https://nutrivision-oc9q.onrender.com/api";
};


// ------------------------------
// EXPORTED ENDPOINTS
// ------------------------------
export const API = {
  AUTH: `${getAuthServerUrl()}/auth`,

  // AI model endpoints
  DETECT: `${getAiServerUrl()}/detect`,
  GET_NUTRITION: `${getAiServerUrl()}/get_nutrition`,
  CLASSIFY: `${getAiServerUrl()}/classify_meal`,
  HEALTH: `${getAiServerUrl()}/health`,
  GET_HARMFUL: `${getAiServerUrl()}/harmful-ingredients`,
  OCR_INGREDIENTS: `${getAiServerUrl()}/ocr-ingredients`,
};
