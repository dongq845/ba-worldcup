// ba-worldcup/client/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getWaifus = () => {
  return fetch(`${API_BASE_URL}/api/waifus`).then((response) =>
    response.json()
  );
};

export const getRankings = () => {
  return fetch(`${API_BASE_URL}/api/rankings`).then((res) => res.json());
};

export const submitResults = (payload) => {
  return fetch(`${API_BASE_URL}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};
