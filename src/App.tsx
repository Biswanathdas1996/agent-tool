import React from "react";
import { Route, Routes } from "react-router-dom";

// import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ChatWithUnstructure from "./pages/ChatWithUnstructure";
import CodeReview from "./pages/CodeReview";
import Queries from "./pages/Queries";
import DBConfig from "./pages/DBConfig";
import Layout from "./layout/index";
import SimpleAlert from "./components/Alert";
import PageLoader from "./components/PageLoader";
// -------------user stoty use case---------------
import UserStoryGeneration from "./pages/Code/UserStoryGeneration";
import Backlog from "./pages/Code/Backlog";
import Upload from "./pages/Upload";
import Config from "./pages/Config";

function App() {
  return (
    <>
      <SimpleAlert />
      <Layout>
        <PageLoader />

        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/" element={<></>} />
          <Route path="/sql-chat" element={<Chat />} />
          <Route path="/data-chat" element={<ChatWithUnstructure />} />
          <Route path="/code-review" element={<CodeReview />} />
          <Route path="/query" element={<Queries />} />
          <Route path="/story" element={<UserStoryGeneration />} />
          <Route path="/backlog/story" element={<UserStoryGeneration />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/config" element={<Config />} />
          <Route path="/db-config" element={<DBConfig />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
