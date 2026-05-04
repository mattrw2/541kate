import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Shell from "./Shell";
import Quizzes from "./pages/Quizzes";
import France from "./pages/France";
import Review from "./pages/Review";
import RentABackpacker from "./pages/RentABackpacker";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import CreateChallenge from "./pages/CreateChallenge";
import ChallengeDashboard from "./pages/ChallengeDashboard";
import ManageChallenge from "./pages/ManageChallenge";
import Recap from "./pages/Recap";

const App = () => (
  <Router>
    <Shell>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/quizzes" element={<Quizzes />} />
        <Route exact path="/france" element={<France />} />
        <Route exact path="/review" element={<Review />} />
        <Route exact path="/rent-a-backpacker" element={<RentABackpacker/>} />
        <Route exact path="/chart" element={<Navigate to="/challenge/1" />} />
        <Route exact path="/challenges" element={<Challenges />} />
        <Route exact path="/challenge/new" element={<CreateChallenge />} />
        <Route exact path="/challenge/:id" element={<ChallengeDashboard />} />
        <Route exact path="/challenge/:id/manage" element={<ManageChallenge />} />
        <Route exact path="/challenge/:id/recap" element={<Recap />} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
