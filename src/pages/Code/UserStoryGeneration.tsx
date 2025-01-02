import React, { useEffect } from "react";
import WelcomeChatComp from "../../components/WelcomeChatComp";

import Loader from "../../components/Loader";

import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useAlert } from "../../hook/useAlert";
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
} from "../../config";
// Import a theme and language
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/worker-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CreateUserStory from "./components/CreateUserStory";
import CreateTestCases from "./components/CreateTestCases";
import CreateTestData from "./components/CreateTestData";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import AutoCompleteInput from "../../components/SelectCollection";

import ContextData from "./components/ContextData";
import ContextFromMongo from "./components/ContextFromMongo";
import BoldText from "./components/BoldText";
import ViewStory from "../../layout/ViewStory";
import { useFetch } from "../../hook/useFetch";
import CodeTables from "./components/CodeTables";

import SandBox from "../../components/Sandbox";

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

  const getInstructions = (instructionForUserStories: string) => {
    const config = JSON.parse(localStorage.getItem("config") || "{}");
    const instructions = config[instructionForUserStories] || [];
    const concatenatedInstructions = instructions.map(
      (instruction: any, index: number) =>
        `\n ${index + 1}: ${instruction.value}`
    );
    return concatenatedInstructions.join("");
  };

  const getContext = async (query: string) => {
    setFinsContextLoadding(true);
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

    return fetchData(SEARCH, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        setFinsContextLoadding(false);

        return result;
      })
      .catch((error) => {
        setFinsContextLoadding(false);
      });
  };

  const saveDataToLocalStorage = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    window.pageLoader(true);
    if (taskId) {
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
      await fetchData(UPDATE_DATA_TO_MONGO_BY_ID, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          triggerAlert("Ticket updated Successfully !", "success");
          window.pageLoader(false);
          return data;
        })
        .catch((error) => {
          window.pageLoader(false);
          console.error("Error:", error);

          triggerAlert(JSON.stringify(error), "error");
          return error;
        });
    } else {
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
        }),
        redirect: "follow",
      };
      await fetchData(INSERT_DATA_TO_MONGO, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          window.pageLoader(false);
          triggerAlert(
            "Ticket created Successfully & pushed to backlog!",
            "success"
          );
          return data;
        })
        .catch((error) => {
          console.error("Error:", error);
          window.pageLoader(false);
          triggerAlert(JSON.stringify(error), "error");
          return error;
        });
      window.location.href = "#/backlog";
    }

    // -------------------------------------------------------------------------------------------
  };

  const handleChange = (event: SelectChangeEvent) => {
    setCodeLang(event.target.value as string);
  };

  const callGpt = async (query: string): Promise<string | null> => {
    setLoading(true);
    const response = await fetchData(CALL_GPT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: query,
      }),
    })
      .then((response) => response.text())
      .then((data) => {
        setLoading(false);
        return data;
      })
      .catch((error) => {
        triggerAlert(JSON.stringify(error), "error");
        setLoading(false);
        return error;
      });
    return response;
  };

  const handleUpload = (e: any) => {
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

    console.log("model", model);
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

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetchData(EXTRACT_IMAGE_TO_TEXT, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        generateUserStory(result?.details);
        setImageUploadLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setImageUploadLoading(false);
      });
  };

  const onsubmitHandler = async (e: any) => {
    e.preventDefault();

    const query = e.target.query.value;

    generateUserStory(query);
  };

  const generateUserStory = async (query: string) => {
    if (query.length === 0) return;
    setUserQuery(query);

    const contextData = await getContext(query);
    setUserStoryLoading(true);

    localStorage.setItem("userQuery", query as string);
    localStorage.setItem("contextData", JSON.stringify(contextData));
    setContextDataForStory(contextData);
    const effectiveContext = contextData?.results
      .map((item: Result) => item.text)
      .join(" ");
    // const effectiveContext = JSON.stringify(contextData?.results?.documents);
    // const effectiveContext = contextData?.results?.gpt_results;
    // const effectiveContext = contextData?.results?.fine_results;
    const instructionForUserStories = getInstructions(
      "instructionForUserStories"
    );
    const userStorydata = await callGpt(`
        Write an elaborate agile user story in Gherkin format for ${query}
        Include Acceptance Criteria, Assumptions, and Dependencies
        ${instructionForUserStories}
       
        
        Context of the story should be: ${effectiveContext}

        Do not add any point that is not related to the context
        `);
    setUserStory(userStorydata);
    userStorydata && localStorage.setItem("userStory", userStorydata);
    setUserStoryLoading(false);
    return userStorydata;
  };

  const generateTestCases = async () => {
    // if (!userStory) return;
    setTestCaseLoading(true);
    const instructionForTestCases = getInstructions("instructionForTestCases");

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
    testcaseData && localStorage.setItem("testcase", testcaseData);
    setTestCaseLoading(false);
    return testcaseData;
  };

  const generateTestData = async () => {
    setTestDataLoading(true);
    // if (!testCase) return;
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
    testcaseData && localStorage.setItem("testdata", testcaseData);
    setTestDataLoading(false);
    return testcaseData;
  };

  const generateTestScript = async () => {
    // if (!testCase) return;
    setTestScriptLoading(true);
    const instructionForTestScript = getInstructions(
      "instructionForTestScript"
    );

    const testScriptData = await callGpt(`
      Generate sample Test script code example in ${testScriptLang} for the  user story of :  ${userStory} \n that supports the bellow test cases\n ${testCase}
      Use ${testData} as test data

      Follow the instructions: 
      ${instructionForTestScript}
      `);
    setTestScript(testScriptData);
    testScriptData && localStorage.setItem("testScript", testScriptData);
    setTestScriptLoading(false);
    return testScriptData;
  };

  const generateCode = async (codeSuggestion?: string): Promise<any> => {
    // if (!testData) return;
    setCodeLoading(true);
    const instructionForCode = getInstructions("instructionForCode");
    let prompt = "";
    if (codeSuggestion) {
      prompt = `
      Refactor the code bellow as per the suggestions \n 
      
      Code: \n 
      ${code}
      \n 
      that supports the bellow test cases\n ${testCase}  \n 

      Gennerate the full code that can be directly run on codesandbox \n 
      
      Suggestions: \n 
      ${codeSuggestion} \n 
      `;
    } else {
      prompt = `
      Generate sample codes example in ${codeLang} for the  user story of :  ${userStory} \n that supports the bellow test cases\n ${testCase}

      Gennerate the full code that can be directly run on codesandbox
      
      Follow the instructions: 
      ${instructionForCode}
      `;
    }
    const testCode = await callGpt(prompt);
    setCode(testCode);

    testCode && localStorage.setItem("code", testCode);
    setCodeLoading(false);

    return testCode;
  };

  interface GenerateRevisedCodeResponse {
    validation_result: string;
  }

  const generateRevisedCode = async (code: string): Promise<void> => {
    setCodeSuggestionLoading(true);

    const formdata = new FormData();
    formdata.append("code", JSON.stringify(code));

    const requestOptions: RequestInit = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetchData(AGENTIC_API, requestOptions)
      .then((response) => response.json())
      .then((result: GenerateRevisedCodeResponse) => {
        setCodeSuggestion(result?.validation_result);
        generateCode(result?.validation_result);
        setCodeSuggestionLoading(false);
      })
      .catch((error: any) => {
        console.log("error", error);
        setCodeSuggestionLoading(false);
      });
  };

  const deploy_Code = async () => {
    if (!code) return;
    if (codeLang !== "HTML") {
      triggerAlert("We only support HTML deploy for now", "error");
    }

    window.pageLoader(true);
    var formdata = new FormData();
    formdata.append("code", code);

    var requestOptions: RequestInit = {
      method: "POST",
      body: formdata,
      redirect: "follow" as RequestRedirect,
    };

    fetch(DEPLOY_CODE, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        setDeployedUrl(result.url);
        triggerAlert("Code deployed successfully !", "success");
        window.pageLoader(false);
      })
      .catch((error) => {
        console.log("error", error);
        triggerAlert(error, "error");
        window.pageLoader(false);
      });
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
    if (taskId) {
      window.pageLoader(true);
      const raw = JSON.stringify({
        id: taskId,
      });

      const requestOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: raw,
        redirect: "follow" as RequestRedirect,
      };

      fetchData(GET_DATA_BY_ID, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          const task = result?.data;
          if (task) {
            localStorage.setItem("userStory", task.userStory);
            localStorage.setItem("testcase", task.testCase);
            localStorage.setItem("testScript", task.testScript);
            localStorage.setItem("testdata", task.testData);
            localStorage.setItem("userQuery", task.userQuery);
            localStorage.setItem("code", task.code);
            if (task?.contextData)
              localStorage.setItem(
                "contextData",
                JSON.stringify(task?.contextData)
              );

            setUserStory(task.userStory);
            setTestCase(task.testCase);
            setTestData(task.testData);
            setTestScript(task.testScript);
            setCode(task.code);
            setUserQuery(task.userQuery);
            setContextDataForStory(task.contextData);
          }
          window.pageLoader(false);
        })
        .catch((error) => {
          console.error(error);
          window.pageLoader(false);
          triggerAlert(JSON.stringify(error), "error");
        });
    }
  }, []);

  const startNewProcess = () => {
    localStorage.removeItem("userStory");
    localStorage.removeItem("testcase");
    localStorage.removeItem("testScript");
    localStorage.removeItem("testdata");
    localStorage.removeItem("code");
    localStorage.removeItem("contextData");
    localStorage.removeItem("userQuery");
    setUserStory(null);
    setTestCase(null);
    setTestScript(null);
    setTestData(null);
    setCode(null);
    setContextDataForStory(null);
    setUserQuery(null);
    window.location.href = "#/story";
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
                                label="Age"
                                onChange={(event: SelectChangeEvent<string>) =>
                                  setTestScriptLang(event.target.value)
                                }
                                size="small"
                                style={{ width: "300px" }}
                              >
                                <MenuItem value={"Java Selenium"}>
                                  Java Selenium
                                </MenuItem>
                                <MenuItem value={"Python Selenium"}>
                                  Python Selenium
                                </MenuItem>
                                <MenuItem value={"Robot Framework"}>
                                  Robot Framework
                                </MenuItem>
                                <MenuItem value={"Cypress"}>Cypress</MenuItem>
                                <MenuItem value={"WebDriver IO"}>
                                  WebDriver IO
                                </MenuItem>
                                <MenuItem value={"Playwright"}>
                                  Playwright
                                </MenuItem>
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
                          //   height="400px"
                          width="100%"
                          style={{ padding: 10, borderRadius: 15 }}
                        />
                      )}
                    </>
                  )}
                  {testScriptLoading && (
                    <Loader text="Generating test script" />
                  )}
                </>
              )}
              codeData={() => (
                <>
                  {testScript && (
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
                              label="Age"
                              onChange={handleChange}
                              size="small"
                              style={{ width: "300px" }}
                            >
                              <MenuItem value={"React JS"}>React JS</MenuItem>
                              <MenuItem value={"Python"}>Python</MenuItem>
                              <MenuItem value={"HTML"}>HTML</MenuItem>
                              <MenuItem value={"Kotlin"}>Kotlin</MenuItem>
                              <MenuItem value={"Apex"}>
                                Apex (Salesforce)
                              </MenuItem>
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
                            codeSuggestion
                              ? "Fixing and refactoring code"
                              : "Generating code"
                          }
                        />
                      )}
                      {codeSuggestionLoading && (
                        <Loader text="Testing & analyse the code" />
                      )}
                    </>
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
