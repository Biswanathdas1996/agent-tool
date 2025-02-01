import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import { AccountCircle, Email, Lock, Cake, Wc } from "@mui/icons-material";
import TerminalIcon from "@mui/icons-material/Terminal";
import GitHubIcon from "@mui/icons-material/GitHub";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import Loader from "../components/Loader";

const UserRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    owner: "Biswanathdas1996",
    repo: "agent-tool",
    pr_number: "",
    user_story: ``,
  });

  const [report, setReport] = useState<any>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const [loading, setLoading] = useState(false);
  const [fetchingPR, setFetchingPR] = useState(false);
  const [prDetails, setPrDetails] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    const myHeaders = new Headers();
    myHeaders.append(
      "Cookie",
      "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzBmYzk0MmFmMjUzOGEyZWI0Zjg5NDIiLCJlbWFpbCI6IjQ0NmhpaUBnbWFpbC5jb20iLCJpc0FkbWluIjpmYWxzZSwiaWF0IjoxNzI5MDk0MTU5LCJleHAiOjE3MjkwOTc3NTl9.erRyF3fH52Islq5z5Bf0zJLWjrbszs_m5vObPomw1kw"
    );
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(formData);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        "http://localhost:5000/compare-user-story-code",
        requestOptions
      );
      const result = await response.json();
      console.log(result);
      setReport(result);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchPullRequestDetails = async () => {
    setFetchingPR(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${formData.owner}/${formData.repo}/pulls`
      );
      const prDetails = await response.json();
      console.log(prDetails);

      const prData = prDetails.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
      }));

      setPrDetails(prData);
      setFetchingPR(false);
    } catch (error) {
      console.error("Error fetching PR details:", error);
      setFetchingPR(false);
    }
  };

  React.useEffect(() => {
    fetchPullRequestDetails();
  }, []);

  React.useEffect(() => {
    fetchPullRequestDetails();
  }, [formData.owner, formData.repo]);

  return (
    <>
      <h2 style={{ marginBottom: 0 }}>Compare code </h2>
      <span style={{ marginBottom: 20, fontSize: 11 }}>
        Sample repo: <b>https://github.com/Biswanathdas1996/agent-tool/pulls</b>
      </span>
      <br />
      <br />
      <Container>
        <Typography variant="h4" gutterBottom></Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Repository Owner"
            name="owner"
            onChange={handleChange}
            value={formData.owner}
            InputProps={{
              startAdornment: <AccountCircle style={{ marginRight: 10 }} />,
            }}
          />
          <TextField
            label="Repository Name"
            name="repo"
            value={formData.repo}
            onChange={handleChange}
            InputProps={{
              startAdornment: <GitHubIcon style={{ marginRight: 10 }} />,
            }}
          />
          {fetchingPR ? (
            <Loader showIcon={false} text="Fetching PR List" />
          ) : (
            <TextField
              select
              label="Pull Request Number"
              value={formData.pr_number}
              name="pr_number"
              onChange={handleChange}
              InputProps={{
                startAdornment: <TerminalIcon style={{ marginRight: 10 }} />,
              }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select Pull Request Number</option>
              {prDetails &&
                prDetails.map((pr: any) => (
                  <option key={pr.number} value={pr.number}>
                    {pr.title}
                  </option>
                ))}
            </TextField>
          )}

          <TextField
            type="textarea"
            label="User Story"
            name="user_story"
            value={formData.user_story}
            onChange={handleChange}
            InputProps={{
              startAdornment: <AutoStoriesIcon style={{ marginRight: 10 }} />,
            }}
            multiline
            rows={10}
          />
          {loading ? (
            <Loader showIcon={false} />
          ) : (
            <Button variant="contained" color="warning" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </Box>
      </Container>
      <div style={{ margin: "2rem", background: "#f1f1f1", padding: 15 }}>
        <div dangerouslySetInnerHTML={{ __html: report?.result }} />
      </div>
    </>
  );
};

export default UserRegistrationForm;
