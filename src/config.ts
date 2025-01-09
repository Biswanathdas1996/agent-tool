export const BASE_URL = "http://127.0.0.1:5000";

export const USE_MOCK = false;

export const QUERY = USE_MOCK ? `${BASE_URL}/query-mock` : `${BASE_URL}/query`;
export const EXICUTE_QUERY = `${BASE_URL}/exicute-raw-query`;
export const SAVE_QUERY = `${BASE_URL}/save-query`;
export const CALL_GPT = `${BASE_URL}/call-gpt`;
// export const UPLOAD_DOC = `${BASE_URL}/upload-collection-doc`;
// export const SEARCH = `${BASE_URL}/search`;
export const SEARCH = `${BASE_URL}/get-context-mongo`;
export const UPLOAD_DOC = `${BASE_URL}/upload-collection-doc-mongo`;
export const INDEXING = `${BASE_URL}/indexing-mongo`;
export const DELETE_COLLECTION = `${BASE_URL}/delete-collection`;
export const LIST_ALL_COLLECTION = `${BASE_URL}/list-index-mongo`;

export const COLLECTIONS = `${BASE_URL}/collection`;
export const EXTRACT_IMAGE_TO_TEXT = `${BASE_URL}/extract-img`;
export const QUERY_LIST = `${BASE_URL}/query-list`;
export const GENERATE_ERD_FROM_DB = `${BASE_URL}/generate-erd-from-db`;
export const GET_ERD_IMG = `${BASE_URL}/get-erd-image`;

// ---------------agentic ---------------------------

export const AGENTIC_API = `${BASE_URL}/validate-code`;
export const DEPLOY_CODE = `${BASE_URL}/deploy`;

// ---------------cpde review ---------------------------

export const SUBMIT_REPO = `${BASE_URL}/submit-repo`;
export const PROCESS_CODE = `${BASE_URL}/process-code`;
export const GENERATE_DOC_FOR_CODE = `${BASE_URL}/generate-doc`;
export const DOWNLOAD_REPORT = `${BASE_URL}/download-repo`;

// ---------Mongo ---------------------------
export const INSERT_DATA_TO_MONGO = `${BASE_URL}/insert-data`;
export const UPDATE_DATA_TO_MONGO_BY_ID = `${BASE_URL}/update-data-by-id`;
export const GET_ALL_DATA = `${BASE_URL}/get-all-data`;
export const GET_DATA_BY_ID = `${BASE_URL}/get-data-by-id`;

// mongo ----------------------------------

export const ANALITICS = USE_MOCK
  ? `${BASE_URL}/analitics-mock`
  : `${BASE_URL}/analitics`;

export const colors = [
  // "#d04a02cf",

  "rgb(75, 192, 192)",
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(153, 102, 255)",
  "rgb(255, 205, 86)",
  "rgb(153, 102, 255)",
];
