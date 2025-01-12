import React, { useEffect } from "react";
import WelcomeChatComp from "../components/WelcomeChatComp";
import Loader from "../components/Loader";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useAlert } from "../hook/useAlert";
import AceEditor from "react-ace";
import {
  CALL_GPT,
  SEARCH,
  EXTRACT_IMAGE_TO_TEXT,
  INSERT_DATA_TO_MONGO,
  GET_DATA_BY_ID,
  UPDATE_DATA_TO_MONGO_BY_ID,
  AGENTIC_API,
  DEPLOY_CODE,
} from "../config";
// Import a theme and language
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CreateUserStory from "./Code/components/CreateUserStory";
import CreateTestCases from "./Code/components/CreateTestCases";
import CreateTestData from "./Code/components/CreateTestData";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import AutoCompleteInput from "../components/SelectCollection";
import ContextFromMongo from "./Code/components/ContextFromMongo";
import BoldText from "./Code/components/BoldText";
import ViewStory from "../layout/ViewStory";
import { useFetch } from "../hook/useFetch";
import CodeTables from "./Code/components/CodeTables";
import CreateTestScript from "./Code/components/CreateTestScript";
import CreateCode from "./Code/components/CreateCode";

interface Result {
  page_number: number;
  text: string;
}

const Chat: React.FC = () => {
  const fetchData = useFetch();

  const [loading, setLoading] = React.useState(false);
  const [finsContextLoadding, setFinsContextLoadding] = React.useState(false);
  const [imageUploadLoading, setImageUploadLoading] = React.useState(false);
  const [userStoryLoading, setUserStoryLoading] = React.useState(false);
  const [testCaseLoading, setTestCaseLoading] = React.useState(false);
  const [testDataLoading, setTestDataLoading] = React.useState(false);
  const [testScriptLoading, setTestScriptLoading] = React.useState(false);
  const [codeLoading, setCodeLoading] = React.useState(false);
  const [userQuery, setUserQuery] = React.useState<string | null>(null);
  const [userStory, setUserStory] = React.useState<string | null>(null);
  const [testCase, setTestCase] = React.useState<string | null>(null);
  const [testData, setTestData] = React.useState<string | null>(null);
  const [testScript, setTestScript] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [deployedUrl, setDeployedUrl] = React.useState<string | null>(null);
  const [uploadFile, setUploadFile] = React.useState<boolean>(false);
  const [contextDataForStory, setContextDataForStory] =
    React.useState<any>(null);
  const [code, setCode] = React.useState<string | null>(null);
  const [codeSuggestion, setCodeSuggestion] = React.useState<string | null>(
    null
  );
  const [codeSuggestionLoading, setCodeSuggestionLoading] =
    React.useState<boolean>(false);
  const { triggerAlert } = useAlert();
  const [codeLang, setCodeLang] = React.useState("");
  const [testScriptLang, setTestScriptLang] = React.useState("");
  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const taskId = urlParams.get("task");
  const [value, setValue] = React.useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const getInstructions = (instructionKey: string) => {
    try {
      const config = JSON.parse(localStorage.getItem("config") || "{}");
      const instructions = config[instructionKey] || [];
      return instructions
        .map(
          (instruction: any, index: number) =>
            `\n ${index + 1}: ${instruction.value}`
        )
        .join("");
    } catch (error) {
      console.error("Error getting instructions:", error);
      triggerAlert("Failed to get instructions", "error");
      return "";
    }
  };

  const getContext = async (query: string) => {
    setFinsContextLoadding(true);
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        query: query,
        collection_name: localStorage.getItem("selected_collection"),
        no_of_results: 10,
        fine_chunking: false,
        if_gpt_summarize: false,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow" as RequestRedirect,
      };

      const result = await fetchData(SEARCH, requestOptions).then((response) =>
        response.json()
      );
      console.log(result);
      return result;
    } catch (error) {
      console.error("Error fetching context:", error);
      triggerAlert("Failed to fetch context", "error");
      return null;
    } finally {
      setFinsContextLoadding(false);
    }
  };

  const saveDataToLocalStorage = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    window.pageLoader(true);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        data: {
          storyid: new Date().getTime(),
          sprint: "backlog",
          userQuery,
          userStory,
          testCase,
          testData,
          code,
          testScript,
          contextData: contextDataForStory,
        },
        id: taskId,
      }),
      redirect: "follow",
    };

    try {
      const url = taskId ? UPDATE_DATA_TO_MONGO_BY_ID : INSERT_DATA_TO_MONGO;
      const response = await fetchData(url, requestOptions);
      const data = await response.json();

      if (taskId) {
        triggerAlert("Ticket updated Successfully!", "success");
      } else {
        triggerAlert(
          "Ticket created Successfully & pushed to backlog!",
          "success"
        );
        window.location.href = "#/backlog";
      }

      return data;
    } catch (error) {
      console.error("Error:", error);
      triggerAlert(JSON.stringify(error), "error");
      return error;
    } finally {
      window.pageLoader(false);
    }
  };

  const handleChange = (event: SelectChangeEvent) => {
    setCodeLang(event.target.value as string);
  };

  const callGpt = async (query: string): Promise<string | null> => {
    setLoading(true);
    try {
      const response = await fetchData(CALL_GPT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: query,
        }),
      });
      const data = await response.text();
      return data;
    } catch (error) {
      triggerAlert(JSON.stringify(error), "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    if (!file) {
      console.error("No file selected");
      return;
    }

    const model = localStorage.getItem("model");

    if (!model) {
      triggerAlert("Model not selected", "error");
      return;
    }

    if (model !== "gpt-4o" && model !== "gpt-4o-mini") {
      triggerAlert(
        `Please select gpt-4o / gpt-4o-mini for image processing `,
        "error"
      );
      return;
    }

    setImageUploadLoading(true);
    const formdata = new FormData();
    formdata.append("file", file);

    const requestOptions: RequestInit = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    try {
      const response = await fetchData(EXTRACT_IMAGE_TO_TEXT, requestOptions);
      const result = await response.json();
      console.log(result);
      await generateUserStory(result?.details);
    } catch (error) {
      console.error("Error uploading file:", error);
      triggerAlert("Failed to upload file", "error");
    } finally {
      setImageUploadLoading(false);
    }
  };

  const onsubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = (e.target as any).query.value;
    generateUserStory(query);
  };

  const generateUserStory = async (query: string) => {
    if (!query) return;
    setUserQuery(query);

    try {
      const contextData = await getContext(query);
      setUserStoryLoading(true);
      setContextDataForStory(contextData);
      localStorage.setItem("userQuery", query);
      localStorage.setItem("contextData", JSON.stringify(contextData));

      const effectiveContext = contextData?.results
        .map((item: Result) => item.text)
        .join(" ");
      const instructionForUserStories = getInstructions(
        "instructionForUserStories"
      );

      const userStoryData = await callGpt(`
        Write an elaborate agile user story in Gherkin format for ${query}
        Include Acceptance Criteria, Assumptions, and Dependencies
        ${instructionForUserStories}
        Context of the story should be: ${effectiveContext}
        Do not add any point that is not related to the context
      `);

      setUserStory(userStoryData);
      if (userStoryData) {
        localStorage.setItem("userStory", userStoryData);
      }
    } catch (error) {
      console.error("Error generating user story:", error);
      triggerAlert("Failed to generate user story", "error");
    } finally {
      setUserStoryLoading(false);
    }
  };

  const generateTestCases = async () => {
    setTestCaseLoading(true);
    try {
      const instructionForTestCases = getInstructions(
        "instructionForTestCases"
      );

      const testcaseData = await callGpt(
        `
        UserStory: 
        ${userStory}

        generate test cases for the above user story

        Follow the instructions: 
        ${instructionForTestCases}
        `
      );

      setTestCase(testcaseData);
      if (testcaseData) {
        localStorage.setItem("testcase", testcaseData);
      }
      return testcaseData;
    } catch (error) {
      console.error("Error generating test cases:", error);
      triggerAlert("Failed to generate test cases", "error");
      return null;
    } finally {
      setTestCaseLoading(false);
    }
  };

  const generateTestData = async () => {
    setTestDataLoading(true);
    try {
      const instructionForTestData = getInstructions("instructionForTestData");

      const testcaseData = await callGpt(
        `
        TestCase: 
        ${testCase}

        Generate a HTML code of sample sets of test data for the above TestCase 

        Follow the instructions: 
        ${instructionForTestData}
        `
      );

      setTestData(testcaseData);
      if (testcaseData) {
        localStorage.setItem("testdata", testcaseData);
      }
      return testcaseData;
    } catch (error) {
      console.error("Error generating test data:", error);
      triggerAlert("Failed to generate test data", "error");
      return null;
    } finally {
      setTestDataLoading(false);
    }
  };

  const generateTestScript = async () => {
    setTestScriptLoading(true);
    try {
      const instructionForTestScript = getInstructions(
        "instructionForTestScript"
      );

      const testScriptData = await callGpt(`
        Generate sample Test script code example in ${testScriptLang} for the user story of: ${userStory} 
        that supports the below test cases: ${testCase}
        Use ${testData} as test data

        Follow the instructions: 
        ${instructionForTestScript}
      `);

      setTestScript(testScriptData);
      if (testScriptData) {
        localStorage.setItem("testScript", testScriptData);
      }
      return testScriptData;
    } catch (error) {
      console.error("Error generating test script:", error);
      triggerAlert("Failed to generate test script", "error");
      return null;
    } finally {
      setTestScriptLoading(false);
    }
  };

  const generateCode = async (codeSuggestion?: string): Promise<any> => {
    setCodeLoading(true);
    try {
      const instructionForCode = getInstructions("instructionForCode");
      let prompt = "";

      if (codeSuggestion) {
        prompt = `
          Refactor the code below as per the suggestions:
          
          Code: 
          ${code}
          
          that supports the below test cases: ${testCase}  
          
          Generate the full code that can be directly run on codesandbox
          
          Suggestions: 
          ${codeSuggestion}
        `;
      } else {
        prompt = `
          Generate sample code example in ${codeLang} for the user story of: ${userStory} 
          that supports the below test cases: ${testCase}

          Generate the full code that can be directly run on codesandbox
          
          Follow the instructions: 
          ${instructionForCode}
        `;
      }

      const testCode = await callGpt(prompt);
      setCode(testCode);

      if (testCode) {
        localStorage.setItem("code", testCode);
      }
      return testCode;
    } catch (error) {
      console.error("Error generating code:", error);
      triggerAlert("Failed to generate code", "error");
      return null;
    } finally {
      setCodeLoading(false);
    }
  };

  interface GenerateRevisedCodeResponse {
    validation_result: string;
  }

  const generateRevisedCode = async (code: string): Promise<void> => {
    setCodeSuggestionLoading(true);

    try {
      const formdata = new FormData();
      formdata.append("code", JSON.stringify(code));

      const requestOptions: RequestInit = {
        method: "POST",
        body: formdata,
        redirect: "follow" as RequestRedirect,
      };

      const response = await fetchData(AGENTIC_API, requestOptions);
      const result: GenerateRevisedCodeResponse = await response.json();

      setCodeSuggestion(result?.validation_result);
      await generateCode(result?.validation_result);
    } catch (error) {
      console.error("Error generating revised code:", error);
      triggerAlert("Failed to generate revised code", "error");
    } finally {
      setCodeSuggestionLoading(false);
    }
  };

  const deploy_Code = async () => {
    if (!code) return;
    if (codeLang !== "HTML") {
      triggerAlert("We only support HTML deploy for now", "error");
      return;
    }

    window.pageLoader(true);
    const formdata = new FormData();
    formdata.append("code", code);

    const requestOptions: RequestInit = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    try {
      const response = await fetch(DEPLOY_CODE, requestOptions);
      const result = await response.json();
      console.log(result);
      setDeployedUrl(result.url);
      triggerAlert("Code deployed successfully!", "success");
    } catch (error) {
      console.error("Error deploying code:", error);
      triggerAlert("Failed to deploy code", "error");
    } finally {
      window.pageLoader(false);
    }
  };

  React.useEffect(() => {
    const savedUserStory = localStorage.getItem("userStory");
    const savedTestcase = localStorage.getItem("testcase");
    const savedTestData = localStorage.getItem("testdata");
    const savedtestTestScript = localStorage.getItem("testScript");
    const userQueryData = localStorage.getItem("userQuery");
    const testCode = localStorage.getItem("code");
    const contextDataStore = localStorage.getItem("contextData");
    try {
      if (savedUserStory) {
        setUserStory(savedUserStory);
      }
      if (savedTestcase) {
        setTestCase(savedTestcase);
      }
      if (savedtestTestScript) {
        setTestScript(savedtestTestScript);
      }
      if (savedTestData) {
        setTestData(savedTestData);
      }
      if (testCode) {
        setCode(testCode);
      }
      if (contextDataStore) {
        setContextDataForStory(JSON.parse(contextDataStore));
      }
      if (userQueryData) {
        setUserQuery(userQueryData);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
      triggerAlert(JSON.stringify(error), "error");
    }
  }, []);

  React.useEffect(() => {
    if (!taskId) {
      startNewProcess();
    }
  }, [taskId]);

  React.useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) return;

      window.pageLoader(true);
      const raw = JSON.stringify({ id: taskId });

      const requestOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
        redirect: "follow" as RequestRedirect,
      };

      try {
        const response = await fetchData(GET_DATA_BY_ID, requestOptions);
        const result = await response.json();
        const task = result?.data;

        if (task) {
          const {
            userStory,
            testCase,
            testScript,
            testData,
            userQuery,
            code,
            contextData,
          } = task;

          const localStorageData = {
            userStory,
            testCase,
            testScript,
            testData,
            userQuery,
            code,
            contextData: contextData ? JSON.stringify(contextData) : null,
          };

          Object.entries(localStorageData).forEach(([key, value]) => {
            if (value !== null) {
              localStorage.setItem(key, value);
            }
          });

          setUserStory(userStory);
          setTestCase(testCase);
          setTestData(testData);
          setTestScript(testScript);
          setCode(code);
          setUserQuery(userQuery);
          setContextDataForStory(contextData);
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
        triggerAlert("Failed to fetch task data", "error");
      } finally {
        window.pageLoader(false);
      }
    };

    fetchTaskData();
  }, []);

  const startNewProcess = () => {
    try {
      const keysToRemove = [
        "userStory",
        "testcase",
        "testScript",
        "testdata",
        "code",
        "contextData",
        "userQuery",
      ];

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      setUserStory(null);
      setTestCase(null);
      setTestScript(null);
      setTestData(null);
      setCode(null);
      setContextDataForStory(null);
      setUserQuery(null);

      window.location.href = "#/story";
    } catch (error) {
      console.error("Error starting new process:", error);
      triggerAlert("Failed to start new process", "error");
    }
  };

  return (
    <>
      <div className="chat-hldr">
        <div className="chat-scrollhldr">
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "right",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              <button
                className="newConversationButton"
                style={{ width: "100px", height: 20 }}
                onClick={() => startNewProcess()}
              >
                Start new
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                  alt="Clear Chat"
                />
              </button>
              <p style={{ fontSize: 10, marginTop: 0 }}>
                * Old data will be cleared on starting new
              </p>

              {taskId && (
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <span>
                    Task id: <b>{taskId}</b>
                  </span>
                </div>
              )}
            </div>

            {!taskId && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  width: "100%",
                }}
              >
                <AutoCompleteInput />

                <p style={{ fontSize: 10 }}>
                  * generated data will be base on selected collection only
                </p>
              </div>
            )}
          </div>

          {!userStory && <WelcomeChatComp />}
          <div className="chat-msg">
            <ViewStory
              taskId={taskId}
              welcomeCompontent={() => <></>}
              userQuery={() => (
                <>
                  {userQuery && (
                    <div>
                      <h2
                        style={{
                          marginBottom: 25,
                        }}
                      >
                        User Query
                      </h2>
                      <div className="chat-msg-list msg-hldr-cb gap10px pre-div ">
                        <BoldText text={userQuery} />
                      </div>
                    </div>
                  )}
                  {imageUploadLoading && <Loader text="Uploading image" />}
                </>
              )}
              referance={() => (
                <>
                  {contextDataForStory &&
                    contextDataForStory?.results?.length > 0 && (
                      <ContextFromMongo
                        data={contextDataForStory?.results as any}
                      />
                    )}
                  {finsContextLoadding && (
                    <Loader text="Fetching relevant content" />
                  )}
                </>
              )}
              userStory={() => (
                <>
                  {userStory && (
                    <CreateUserStory
                      userStory={userStory}
                      setUserStory={setUserStory}
                      testCase={testCase}
                      generateTestCases={generateTestCases}
                    />
                  )}
                  {userStoryLoading && <Loader text="Generatting user story" />}
                </>
              )}
              testCase={() => (
                <>
                  {testCase && (
                    <CreateTestCases
                      testCase={testCase}
                      setTestCase={setTestCase}
                      generateTestCases={generateTestCases}
                      generateTestData={generateTestData}
                    />
                  )}
                  {testCaseLoading && <Loader text="Generatting test cases" />}
                </>
              )}
              testData={() => (
                <>
                  {testData && (
                    <CreateTestData
                      testData={testData}
                      setTestData={setTestData}
                      generateTestData={generateTestData}
                    />
                  )}
                  {testDataLoading && <Loader text="Generating test data" />}
                </>
              )}
              testScript={() => (
                <>
                  {testData && (
                    <CreateTestScript
                      testScriptLang={testScriptLang}
                      setTestScriptLang={setTestScriptLang}
                      generateTestScript={generateTestScript}
                      testScript={testScript || ""}
                      setTestScript={setTestScript}
                    />
                  )}
                  {testScriptLoading && (
                    <Loader text="Generating test script" />
                  )}
                </>
              )}
              codeData={() => (
                <>
                  {testScript && (
                    <CreateCode
                      codeLang={codeLang}
                      handleChange={handleChange}
                      generateCode={generateCode}
                      codeLoading={codeLoading}
                      codeSuggestion={codeSuggestion}
                      codeSuggestionLoading={codeSuggestionLoading}
                    />
                  )}
                  <br />

                  {code && (
                    <>
                      {codeSuggestion && (
                        <>
                          <h2>Code suggestion</h2>
                          <div className="chat-msg-list msg-hldr-cb gap10px pre-div ">
                            <BoldText text={codeSuggestion} />
                          </div>
                        </>
                      )}
                      <br />
                      <h2>Generated Code</h2>
                      <br />
                      <CodeTables
                        tab1={() => {
                          return (
                            <AceEditor
                              mode="javascript"
                              theme="monokai"
                              value={code}
                              onChange={(newValue) => {
                                setCode(newValue);
                                localStorage.setItem("code", newValue);
                              }}
                              setOptions={{
                                useWorker: false,
                              }}
                              editorProps={{ $blockScrolling: true }}
                              //   height="400px"
                              width="100%"
                              style={{ padding: 10, borderRadius: 15 }}
                            />
                          );
                        }}
                        code={code}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          marginTop: 10,
                        }}
                      >
                        <button
                          className="newConversationButton"
                          style={{ width: "150px" }}
                          onClick={() => generateRevisedCode(code)}
                        >
                          Test & analyse the code
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                            alt="Clear Chat"
                          />
                        </button>

                        <button
                          className="newConversationButton"
                          style={{ width: "150px" }}
                          onClick={() => deploy_Code()}
                        >
                          Deploy Code
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                            alt="Clear Chat"
                          />
                        </button>
                      </div>

                      <div>
                        {deployedUrl && (
                          <>
                            <h2>Deployed URL</h2>
                            <div
                              className="chat-msg"
                              style={{
                                background: "#f1f1f1",
                                padding: "2rem",
                                borderRadius: 12,
                                fontSize: 15,
                                fontWeight: 600,
                              }}
                            >
                              {deployedUrl}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            />
            {code && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="newConversationButton"
                  style={{ width: "130px" }}
                  onClick={() => saveDataToLocalStorage()}
                >
                  {taskId ? "Update" : "Save"}
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
                    alt="Clear Chat"
                  />
                </button>
              </div>
            )}{" "}
            {/* {loading && <Loader />} */}
          </div>
        </div>
        <br />
        <br />

        {!userStory && (
          <>
            {!uploadFile ? (
              <form
                onSubmit={(e) => onsubmitHandler(e)}
                style={{ gridColumn: "span 4", marginBottom: "20px" }}
              >
                <div className="Input-Container">
                  {!file && (
                    <input
                      className="Input-Field"
                      type="text"
                      placeholder="Enter your query here"
                      id="query"
                      name="query"
                    />
                  )}

                  <button className="Send-Button" type="submit">
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAddJREFUaAXtmOFtwjAQRhmhI+RnFO47ZYSO0BEYgREYgQ3aTdoN2g3oBozQ9ipOOqwkOPjsGClIyHYI8Xtnn+Nks1k/awTWCFxFgIieAZwB/AB4bdu2uTqh9gaA0wVeBPT7OCIm+gpvy/pFiOhgIm/hbb1ekUsOWNipep0iAN4jRsGK1SWy3W73MwVUpg6Rvu+fbiSzAo+Vy4vcMY2GZJYTmZnMQ/D22DIiidPICmi9rEjkPUHh5pRlRJyn0ZBgfhGnZB6Ct8fyiSTcEyxgbN1f5HJPiAXwOs9XRHKBmfdEdATwwcz6vOAFPHYdXxH7LCMjU1Asn4iVknpOMcnHsL9ibSexczHgsKOmaf6nnERRcomIZMs+K5eY+RRe173tATq0lRd4yTk34FygIbyAA9glgYt5ytCHUDFtF3CxlvdCMR16neMGrkPWdd3OC27qOu7gKkBEn1Mdp/6WDTz39MkKrtEH8JYa4fD/RcCNwNB70rGN1+TxouAiAOAljN497eLgJvpJ00e23Mx8kD2QXrNYmbL2LwquEbpn7a8CXAXmrP1VgYtA7PSpDlyjf2vtrxZcBcamT/XgKhC+yHoYcBXouq7/u4l9MfP3Yuu4wqzlGoE1Ajcj8AvY+lHSUC3vMgAAAABJRU5ErkJggg=="
                      alt="Send"
                      className="Send-Icon"
                    />
                  </button>
                  <button
                    className="Send-Button"
                    type="button"
                    onClick={() => {
                      setUploadFile(!uploadFile);
                      document.getElementById("query_img")?.click();
                    }}
                  >
                    <AttachFileIcon />
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => handleUpload(e)}
                style={{ gridColumn: "span 4", marginBottom: "20px" }}
              >
                <div className="Input-Container">
                  <input
                    className="Input-Field"
                    type="file"
                    placeholder="Enter your query here"
                    id="query_img"
                    name="query_img"
                    onChange={handleFileChange}
                  />

                  <button className="Send-Button" type="submit">
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAddJREFUaAXtmOFtwjAQRhmhI+RnFO47ZYSO0BEYgREYgQ3aTdoN2g3oBozQ9ipOOqwkOPjsGClIyHYI8Xtnn+Nks1k/awTWCFxFgIieAZwB/AB4bdu2uTqh9gaA0wVeBPT7OCIm+gpvy/pFiOhgIm/hbb1ekUsOWNipep0iAN4jRsGK1SWy3W73MwVUpg6Rvu+fbiSzAo+Vy4vcMY2GZJYTmZnMQ/D22DIiidPICmi9rEjkPUHh5pRlRJyn0ZBgfhGnZB6Ct8fyiSTcEyxgbN1f5HJPiAXwOs9XRHKBmfdEdATwwcz6vOAFPHYdXxH7LCMjU1Asn4iVknpOMcnHsL9ibSexczHgsKOmaf6nnERRcomIZMs+K5eY+RRe173tATq0lRd4yTk34FygIbyAA9glgYt5ytCHUDFtF3CxlvdCMR16neMGrkPWdd3OC27qOu7gKkBEn1Mdp/6WDTz39MkKrtEH8JYa4fD/RcCNwNB70rGN1+TxouAiAOAljN497eLgJvpJ00e23Mx8kD2QXrNYmbL2LwquEbpn7a8CXAXmrP1VgYtA7PSpDlyjf2vtrxZcBcamT/XgKhC+yHoYcBXouq7/u4l9MfP3Yuu4wqzlGoE1Ajcj8AvY+lHSUC3vMgAAAABJRU5ErkJggg=="
                      alt="Send"
                      className="Send-Icon"
                    />
                  </button>
                  <button
                    className="Send-Button"
                    type="button"
                    onClick={() => setUploadFile(!uploadFile)}
                  >
                    <TextFieldsIcon />
                  </button>
                </div>
              </form>
            )}
          </>
        )}
        {/* <SandBox /> */}
      </div>
    </>
  );
};

export default Chat;
