// ------------------------------
// BACKEND 1: AUTH / USER / MEALS (Express server)
// ------------------------------
export const getAuthServerUrl = () => {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  return isLocal
    ? "http://localhost:8080/api" // local Express backend
    : "/api"; // production: same-origin (served by Render)
};


// ------------------------------
// BACKEND 2: AI MODEL SERVER
// ------------------------------
export const getAiServerUrl = () => {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";

  return isLocal
    ? "http://localhost:5000/api" // your AI-model backend
    : "https://nutrivision-ai.onrender.com/api"; // (or your prod AI URL if you deploy someday)
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
};
