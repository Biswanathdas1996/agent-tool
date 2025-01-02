import React from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { GET_ALL_DATA } from "../../config";
import { useFetch } from "../../hook/useFetch";
import { useAlert } from "../../hook/useAlert";

const Backlog: React.FC = () => {
  interface BacklogItem {
    sprint: string;
    userStory: string;
    _id: number;
  }
  // const { triggerAlert } = useAlert();
  const fetchData = useFetch();
  const [backlogItems, setBacklogItems] = React.useState<BacklogItem[]>([]);

  React.useEffect(() => {
    window.pageLoader(true);

    const requestOptions: RequestInit = {
      method: "GET",
      redirect: "follow" as RequestRedirect,
    };

    fetchData(GET_ALL_DATA, requestOptions)
      .then((response) => {
        if (response.status === 500) {
          // triggerAlert("An error occurred while fetching data", "error");
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        setBacklogItems(result?.data);
        window.pageLoader(false);
      })
      .catch((error) => {
        console.error(error);
        // triggerAlert(JSON.stringify(error), "error");
      });
  }, []);

  const addNewStory = () => {
    localStorage.removeItem("userStory");
    localStorage.removeItem("testcase");
    localStorage.removeItem("testdata");
    localStorage.removeItem("code");
    localStorage.removeItem("contextData");
    localStorage.removeItem("userQuery");

    window.location.href = "#/story";
  };

  const viewTicket = (id: number) => {
    localStorage.removeItem("userStory");
    localStorage.removeItem("testcase");
    localStorage.removeItem("testdata");
    localStorage.removeItem("code");
    localStorage.removeItem("contextData");
    localStorage.removeItem("userQuery");
    window.location.href = `#/backlog/story?task=${id}`;
  };

  const deleteTicket = (id: number) => {
    const updatedBacklogItems = backlogItems.filter((item) => item._id !== id);
    setBacklogItems(updatedBacklogItems);
    localStorage.setItem("backlogData", JSON.stringify(updatedBacklogItems));
  };

  console.log(backlogItems);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Backlog</h2>
        <button
          className="newConversationButton"
          onClick={() => {
            addNewStory();
          }}
          style={{ width: "150px", height: 25 }}
        >
          + Add User Story
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAAAAXNSR0IArs4c6QAAAqBJREFUWAm1WLuRAjEMpQRKuAYogIyIAiiAuRgSIghhhgIoAGaOkOwIyKEDLoQcYlk0sHdvx1qMd621ObgZj9a29PQsyR+u0Uj4I6ImEY2Y+csYc2RmYubMNsKYMeabiD6J6CMBOk6ViDrGmL3jVJyr0pLqxHlRtLCqZwj4hC2h5yJkU+CGXl2977yiT8BU1l2e+gOZVgD9l4jYT8seK0beTCKOjE2HKKvyfD5n4/H4oV2vV9XGjXIwTShMbzuqoIfDIWu1Wlm3283a7Xb+jTHXWc03aqZcwKjsGsMHJ0IE0v1OwbjdbvuH6sA5kQIAXde5+52KA98FGSLaagCn0ynz2263K9IhRDabTUkPdhp2ERVbG0FlAKEWQg0khEhIp44Mro4G7gWNsRDBDsGK/YZ57BZ/HH3YgFwEkRGI1KYFYADWCFfNwSaGCC7RBjPjFg06kYhMJpPKVVdFQsZgE0nkCCLqfSJEAPhsizjoCESC0ZA52SHL5TIvTClQTUIXxGNTGkVEQCNWVixKIglbWZAma1MD4/l8nh/jAoQIDYfDkoPBYJBhTvRw9MNW+orMU6MWK4z7/X7eBGixWOR3jPRF+qmAXa/XiyFyxPZdC1BI+iuLJeJHMoTPzFsQwWM4yBp1gZXCOfKOBge4daUvEnqr1aoYhw3GMK/5wKEKIk1Nqe74hqO6BgzNR/EcwMUTUkREUIBySD0jL5eLRmTr3r7Jz4AQ8dTxh2cAGGlRSQVP0L9HQ8JinwPqcZ/gQEuFzFU/FUGobge9mIj+G4eZZy92KBFw5Uwyoco3k4kjIQxtml5ZM8DS0yHOfWkLWH3BxaTRGHMoDi3fSUrf/txIJmQJ3H8upDjVdLEq+9jeGmN+vNcd/lGDsTXSmr/MNTBv7hffBPEsHKEseQAAAABJRU5ErkJggg=="
            alt="Clear Chat"
          />
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          margin: "1rem",
        }}
      >
        {backlogItems?.map((item) => (
          <div className="card-container">
            <div
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <Chip label={item?.sprint} />
              <div>
                <DeleteForeverIcon
                  style={{ fontSize: 15, cursor: "pointer" }}
                  color="error"
                  onClick={() => deleteTicket(item._id)}
                />
                <ArrowForwardIosIcon
                  style={{ fontSize: 15, cursor: "pointer" }}
                  color="success"
                  onClick={() => viewTicket(item._id)}
                />
              </div>
            </div>
            <p className="card-description">{item.userStory.split("\n")[0]}</p>
            <div
              className="card-footer"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <div className="assignee">
                <img
                  src="data:image/png;base64,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"
                  alt="assignee-avatar"
                  className="assignee-avatar"
                />

                <span style={{ fontSize: 12 }}>Unassigned</span>
              </div>
              <div>
                <img
                  src="data:image/png;base64,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"
                  alt="assignee-avatar"
                  className="assignee-avatar"
                  style={{ height: 15, width: 15 }}
                />
                <img
                  src="data:image/png;base64,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"
                  alt="assignee-avatar"
                  className="assignee-avatar"
                  style={{ height: 15, width: 15 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Backlog;
