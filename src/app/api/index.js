const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const CONSULT_ENDPOINT = `${API_BASE_URL}/entrypoints/consult/invoke`;

export const consultApi = async (payload = {}, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(CONSULT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  return {
    status: response.status,
    data,
  };
};
