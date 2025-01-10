import React, { useState, useEffect } from "react";
import { UPLOAD_DOC, INDEXING, DELETE_COLLECTION } from "../config";
import { Button, TextField } from "@mui/material";
import AutoCompleteInput from "../components/SelectCollection";
import ListView from "../components/ListView";
import { useFetchCollection } from "../hook/useFetchCollection";
import { useFetch } from "../hook/useFetch";
import { useAlert } from "../hook/useAlert";
import Loader from "../components/Loader";

import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [value, setValue] = React.useState<any>(null);
  const { triggerAlert } = useAlert();
  const [loadingUpload, setLoadingUpload] = React.useState<any>(null);
  const [loadingIndex, setLoadingIndex] = React.useState<any>(null);
  const [showUpload, setShowUpload] = React.useState<boolean>(false);

  const { collections } = useFetchCollection();

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
    formdata.append("collection_name", value as string);

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetchData(UPLOAD_DOC, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          triggerAlert(result.error, "error");
        } else {
          triggerAlert("File uploaded successfully!", "success");
        }

        setLoadingUpload(false);
        indexing_collection(value as string);
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
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.error) {
          triggerAlert(`${result.error}  Deleting the collection...`, "error");
          delete_collection(collection_name);
        } else {
          triggerAlert(JSON.stringify(result), "success");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }

        setLoadingIndex(false);
      })
      .catch((error) => {
        setLoadingIndex(false);
        triggerAlert(error.message, "error");
        console.error(error);
      });
  };

  const delete_collection = (collection_name: string): void => {
    setLoadingIndex(true);
    const formdata = new FormData();
    formdata.append("collection_name", collection_name);

    const requestOptions: IndexingRequestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetch(DELETE_COLLECTION, requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.error) {
          triggerAlert(result.error, "error");
        } else {
          triggerAlert(JSON.stringify(result), "success");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }

        setLoadingIndex(false);
      })
      .catch((error) => {
        setLoadingIndex(false);
        triggerAlert(error.message, "error");
        console.error(error);
      });
  };

  return (
    <>
      <h2>Knowledge Base</h2>
      <div>
        <Button
          variant="contained"
          color="warning"
          size="small"
          onClick={() => setShowUpload(true)}
          // style={{ padding: "15px 20px", marginLeft: "10px" }}
        >
          + Add new collection
        </Button>
      </div>
      {showUpload && (
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
                  <TextField
                    type="text"
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    variant="outlined"
                    placeholder="Collection Name"
                    style={{ marginRight: "10px" }}
                  />

                  <TextField
                    type="file"
                    onChange={handleFileChange}
                    variant="outlined"
                    style={{ marginRight: "10px" }}
                  />
                  <br />
                  <br />

                  {loadingUpload && (
                    <Loader text="Uploading" showIcon={false} />
                  )}
                  {loadingIndex && <Loader text="Indexing" showIcon={false} />}
                  {!loadingUpload && !loadingIndex && (
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={handleUpload}
                      style={{ padding: "15px 20px", marginLeft: "10px" }}
                    >
                      Upload
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => setShowUpload(false)}
                    style={{ padding: "15px 20px", marginLeft: "10px" }}
                  >
                    Cancel
                  </Button>
                </div>
                <div></div>
              </div>

              <div></div>
            </div>

            {/* {collections && <ListView collections={collections?.collections} />} */}
          </div>
          <br />
          <br />
          <br />
          <br />
        </div>
      )}
      <div
        style={{
          display: "flex",
          margin: "3rem",
          justifyContent: "space-evenly",
        }}
      >
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead style={{ height: 10 }}>
              <TableRow style={{ height: 10 }}>
                <TableCell
                  key={123}
                  style={{
                    minWidth: 170,
                    background: "rgb(51 51 51 / 86%)",
                    color: "white",
                    height: 10,
                    padding: "5px",
                    margin: 0,
                    textAlign: "left",
                    borderRight: "2px solid #ffffff",
                  }}
                >
                  Document Collection Name
                </TableCell>
                <TableCell
                  key={123}
                  style={{
                    minWidth: 170,
                    background: "rgb(51 51 51 / 86%)",
                    color: "white",
                    height: 10,
                    padding: "5px",
                    margin: 0,
                    textAlign: "left",
                    borderRight: "2px solid #ffffff",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  key={123}
                  style={{
                    minWidth: 170,
                    background: "rgb(51 51 51 / 86%)",
                    color: "white",
                    height: 10,
                    padding: "5px",
                    margin: 0,
                    textAlign: "left",
                    borderRight: "2px solid #ffffff",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collections?.collections.map(
                (collection: any, rowIndex: number) => (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={rowIndex}
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 0 ? "#a8a8a866" : "#f1f1f1",
                    }}
                  >
                    <TableCell
                      key={rowIndex}
                      align="left"
                      style={{
                        borderRight: "2px solid #ffffff",
                        padding: 5,
                      }}
                    >
                      {collection}
                    </TableCell>
                    <TableCell
                      key={rowIndex}
                      align="left"
                      style={{
                        borderRight: "2px solid #ffffff",
                        padding: 5,
                      }}
                    >
                      <span
                        style={{
                          color:
                            collection ===
                            localStorage.getItem("selected_collection")
                              ? "green"
                              : "inherit",
                        }}
                      >
                        <b>
                          {collection ===
                          localStorage.getItem("selected_collection")
                            ? "Active"
                            : "Inactive"}
                        </b>
                      </span>
                    </TableCell>
                    <TableCell
                      key={rowIndex}
                      align="left"
                      style={{
                        borderRight: "2px solid #ffffff",
                        padding: 5,
                        display: "flex",
                      }}
                    >
                      {collection !=
                        localStorage.getItem("selected_collection") && (
                        <>
                          <button
                            className="newConversationButton"
                            onClick={() => {
                              localStorage.setItem(
                                "selected_collection",
                                collection
                              );
                              window.location.reload();
                            }}
                            style={{ width: 120 }}
                          >
                            Use Collection
                            <img
                              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                              alt="Clear Chat"
                            />
                          </button>
                        </>
                      )}
                      <button
                        className="newConversationButton"
                        onClick={() => {
                          setValue(collection);
                          setShowUpload(true);
                        }}
                        style={{ width: 150 }}
                      >
                        Add more Document
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                          alt="Clear Chat"
                        />
                      </button>
                      <button
                        className="newConversationButton"
                        onClick={() => {
                          delete_collection(collection);
                        }}
                        style={{ width: 80 }}
                      >
                        Delete
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                          alt="Clear Chat"
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
};

export default Upload;
