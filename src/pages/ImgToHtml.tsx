import React, { useState } from "react";
import { useFetch } from "../hook/useFetch";
import { IMG_TO_HTML, IMG_TO_HTML_STREAM } from "../config";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Loader from "../components/Loader";
import { Card, TextField } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  );
}

const ImgToHtml: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [htmlCode, setHtmlCode] = useState<string>(``);
  const [value, setValue] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [streaming, setStreaming] = React.useState("");

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const fetchData = useFetch();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoading(true);
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      streamResponse(file);
    }
  };

  interface ConvertImageToHtmlResponse {
    html_code: string;
  }

  const convertImageToHtml = async (file: File) => {
    if (!file) {
      return;
    }
    const formdata = new FormData();
    formdata.append("image", file);

    const requestOptions: RequestInit = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    try {
      const response = await fetchData(IMG_TO_HTML, requestOptions);
      const result: ConvertImageToHtmlResponse = await response.json();
      console.log(result?.html_code);
      setHtmlCode(result?.html_code);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const streamResponse = async (file: File) => {
    setLoading(true);
    if (!file) {
      return;
    }
    const formdata = new FormData();
    formdata.append("image", file);

    const response = await fetchData(IMG_TO_HTML_STREAM, {
      method: "POST",
      redirect: "follow" as RequestRedirect,
      body: formdata,
    });

    if (!response.body) {
      throw new Error("Response body is null");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      setStreaming(result);
      console.log("Streaming data:", result);
    }

    console.log("Final response:================>", extractFinalData(result));
    setHtmlCode(extractFinalData(result));

    setLoading(false);
  };

  function extractFinalData(input: string) {
    const match = input.match(/final_data:\s*(.*)/s);
    return match ? match[1].trim() : "";
  }

  const downloadHtml = () => {
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div style={{ padding: "0px" }}>
      <h2>Image to HTML </h2>
      <p>Upload a image of which you want code</p>
      <TextField
        type="file"
        onChange={handleImageUpload}
        variant="outlined"
        style={{ marginRight: "10px" }}
      />

      {image && (
        <div style={{ marginTop: "20px" }}>
          <h2>Selected Image:</h2>
          <Card style={{ width: "70%" }}>
            <img
              src={URL.createObjectURL(image)}
              alt="Uploaded"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </Card>
        </div>
      )}

      {htmlCode && (
        <div style={{ marginTop: "20px" }}>
          <h2>Generated HTML Code:</h2>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={downloadHtml}
              className="newConversationButton"
              style={{ width: "150px" }}
            >
              Download Code
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                alt="Download Zip"
              />
            </button>
            <button
              onClick={() => convertImageToHtml(image as File)}
              className="newConversationButton"
              style={{ width: "150px" }}
            >
              Re-generate
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                alt="Download Zip"
              />
            </button>
          </div>
          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Code" {...a11yProps(0)} />
                <Tab label="Preview" {...a11yProps(1)} />
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <AceEditor
                mode="javascript"
                theme="monokai"
                value={htmlCode}
                onChange={(newValue) => {
                  setHtmlCode(newValue);
                }}
                setOptions={{
                  useWorker: false,
                }}
                editorProps={{ $blockScrolling: true }}
                //   height="400px"
                width="100%"
                style={{ padding: 10, borderRadius: 15 }}
              />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <iframe
                srcDoc={htmlCode}
                style={{ width: "100%", height: "100vh", border: "none" }}
                title="HTML Preview"
              />
            </CustomTabPanel>
          </Box>
        </div>
      )}
      {streaming && (
        <div style={{ marginTop: "20px" }}>
          <h2>Streaming:</h2>
          <div style={{ padding: 10, border: "1px solid black" }}>
            <pre>{streaming}</pre>
          </div>
        </div>
      )}
      {loading && (
        <div style={{ marginTop: "20px", width: 300 }}>
          {" "}
          <Loader showIcon={false} text="Processing image" />
        </div>
      )}
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default ImgToHtml;
