import React, { useState } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import AceEditor from "react-ace";
import { SelectChangeEvent } from "@mui/material/Select";

interface CreateTestScriptProps {
  testScriptLang: string;
  setTestScriptLang: (lang: string) => void;
  generateTestScript: () => void;
  testScript: string;
  setTestScript: (script: string) => void;
}

const CreateTestScript: React.FC<CreateTestScriptProps> = ({
  testScriptLang,
  setTestScriptLang,
  generateTestScript,
  testScript,
  setTestScript,
}) => {
  return (
    <>
      <div>
        <h2>Test Script</h2>
        <FormControl fullWidth>
          <div style={{ display: "flex" }}>
            <div style={{ marginRight: 10, padding: 7 }}>
              <InputLabel id="demo-simple-select-label">
                Select language for test scripts
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={testScriptLang}
                label="Language"
                onChange={(event: SelectChangeEvent<string>) =>
                  setTestScriptLang(event.target.value)
                }
                size="small"
                style={{ width: "300px" }}
              >
                <MenuItem value={"Java Selenium"}>Java Selenium</MenuItem>
                <MenuItem value={"Python Selenium"}>Python Selenium</MenuItem>
                <MenuItem value={"Robot Framework"}>Robot Framework</MenuItem>
                <MenuItem value={"Cypress"}>Cypress</MenuItem>
                <MenuItem value={"WebDriver IO"}>WebDriver IO</MenuItem>
                <MenuItem value={"Playwright"}>Playwright</MenuItem>
              </Select>
            </div>
            <button
              className="newConversationButton"
              style={{ width: "130px" }}
              onClick={() => generateTestScript()}
            >
              Generate test script
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                alt="Clear Chat"
              />
            </button>
          </div>
        </FormControl>
      </div>
      <br />
      <br />
      {testScript && (
        <AceEditor
          key="testScript"
          mode="javascript"
          theme="monokai"
          value={testScript}
          onChange={(newValue) => {
            setTestScript(newValue);
            localStorage.setItem("testScript", newValue);
          }}
          setOptions={{
            useWorker: false,
          }}
          editorProps={{ $blockScrolling: true }}
          width="100%"
          style={{ padding: 10, borderRadius: 15 }}
        />
      )}
    </>
  );
};

export default CreateTestScript;
