import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import Loader from "../../../components/Loader";

interface CreateCodeProps {
  codeLang: string;
  handleChange: any;
  generateCode: () => void;
  codeLoading: boolean;
  codeSuggestion: string | null;
  codeSuggestionLoading: boolean;
}

const CreateCode: React.FC<CreateCodeProps> = ({
  codeLang,
  handleChange,
  generateCode,
  codeLoading,
  codeSuggestion,
  codeSuggestionLoading,
}) => {
  return (
    <>
      <h2>Choose coding language</h2>
      <FormControl fullWidth>
        <div style={{ display: "flex" }}>
          <div style={{ marginRight: 10, padding: 7 }}>
            <InputLabel id="demo-simple-select-label">
              Select language
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={codeLang}
              label="Select language"
              onChange={handleChange}
              size="small"
              style={{ width: "300px" }}
            >
              <MenuItem value={"React JS"}>React JS</MenuItem>
              <MenuItem value={"Python"}>Python</MenuItem>
              <MenuItem value={"HTML"}>HTML</MenuItem>
              <MenuItem value={"Kotlin"}>Kotlin</MenuItem>
              <MenuItem value={"Apex"}>Apex (Salesforce)</MenuItem>
            </Select>
          </div>
          <button
            className="newConversationButton"
            style={{ width: "130px" }}
            onClick={() => generateCode()}
          >
            Generate code
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
              alt="Clear Chat"
            />
          </button>
        </div>
      </FormControl>
      <br />
      {codeLoading && (
        <Loader
          text={
            codeSuggestion ? "Fixing and refactoring code" : "Generating code"
          }
        />
      )}
      {codeSuggestionLoading && <Loader text="Testing & analyse the code" />}
    </>
  );
};

export default CreateCode;
