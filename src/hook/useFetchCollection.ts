import { useState, useEffect } from "react";
import { LIST_ALL_COLLECTION } from "../config";
import { useFetch } from "./useFetch";
export const useFetchCollection = () => {
  const [collections, setCollections] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useFetch();

  useEffect(() => {
    const fetchDataFromAPI = async () => {
      window.pageLoader(true);
      try {
        const response = await fetchData(LIST_ALL_COLLECTION, {
          method: "GET",
          redirect: "follow" as RequestRedirect,
        });
        const result = await response.json();
        setCollections(result);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      } finally {
        setLoading(false);
        window.pageLoader(false);
      }
    };

    fetchDataFromAPI();
  }, []);

  return { collections, loading, error };
};
