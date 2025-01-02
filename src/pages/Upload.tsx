import React, { useState, useEffect } from "react";
import { UPLOAD_DOC, INDEXING } from "../config";
import { Button, TextField } from "@mui/material";
import AutoCompleteInput from "../components/SelectCollection";
import ListView from "../components/ListView";
import { useFetchCollection } from "../hook/useFetchCollection";
import { useFetch } from "../hook/useFetch";
import { useAlert } from "../hook/useAlert";
import Loader from "../components/Loader";

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [value, setValue] = React.useState<any>(null);
  const { triggerAlert } = useAlert();
  const [loadingUpload, setLoadingUpload] = React.useState<any>(null);
  const [loadingIndex, setLoadingIndex] = React.useState<any>(null);

  const fetchData = useFetch();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      console.error("No file selected");
      return;
    }
    setLoadingUpload(true);
    const formdata = new FormData();
    formdata.append("files", file);
    formdata.append(
      "collection_name",
      localStorage.getItem("selected_collection") as string
    );

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetchData(UPLOAD_DOC, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        triggerAlert("File uploaded successfully!", "success");
        indexing_collection(
          localStorage.getItem("selected_collection") as string
        );

        setLoadingUpload(false);
      })
      .catch((error) => {
        console.error(error);
        setLoadingUpload(false);
        triggerAlert(JSON.stringify(error), "error");
      });
  };

  interface IndexingRequestOptions {
    method: string;
    body: FormData;
    redirect: RequestRedirect;
  }

  const indexing_collection = (collection_name: string): void => {
    setLoadingIndex(true);
    const formdata = new FormData();
    formdata.append("collection_name", collection_name);

    const requestOptions: IndexingRequestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetch(INDEXING, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        triggerAlert("File indexed successfully!", "success");
        setLoadingIndex(false);
      })
      .catch((error) => {
        setLoadingIndex(false);
        triggerAlert(JSON.stringify(error), "error");
        console.error(error);
      });
  };

  console.log(value?.title);
  return (
    <>
      <h2>Upload Documents</h2>
      <div className="bot-details-card">
        <h2>Upload Your Documents</h2>
        <p>
          Please select a file to upload. Ensure it is in the correct format.
        </p>
        <br />
        <br />
        <div className="chat-menuHldr">
          <div className="mrl">
            <div></div>
            <div>
              <div>
                <AutoCompleteInput />
                <TextField
                  type="file"
                  onChange={handleFileChange}
                  variant="outlined"
                  style={{ marginRight: "10px" }}
                />
                <br />
                <br />

                {loadingUpload && <Loader text="Uploading" showIcon={false} />}
                {loadingIndex && <Loader text="Indexing" showIcon={false} />}
                {!loadingUpload && !loadingIndex && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleUpload}
                    style={{ padding: "15px 20px", marginLeft: "10px" }}
                  >
                    Upload
                  </Button>
                )}
              </div>
              <div></div>
            </div>
            <div></div>
          </div>
          <br />
          <br />
          {/* {collections && <ListView collections={collections?.collections} />} */}
        </div>
      </div>
    </>
  );
};

export default Upload;
