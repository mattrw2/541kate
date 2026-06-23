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
import Onboarding from "./pages/Onboarding";
import JoinChallenge from "./pages/JoinChallenge";
import { useCurrentUser } from "./UserContext";

// Challenge pages require a trusted device / household. Static personal pages stay public.
const RequireHousehold = ({ children }) => {
  const { status } = useCurrentUser();
  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (status === "unauthenticated") return <Onboarding />;
  return children;
};

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
        <Route exact path="/join/:token" element={<JoinChallenge />} />
        <Route exact path="/challenges" element={<RequireHousehold><Challenges /></RequireHousehold>} />
        <Route exact path="/challenge/new" element={<RequireHousehold><CreateChallenge /></RequireHousehold>} />
        <Route exact path="/challenge/:id" element={<RequireHousehold><ChallengeDashboard /></RequireHousehold>} />
        <Route exact path="/challenge/:id/manage" element={<RequireHousehold><ManageChallenge /></RequireHousehold>} />
        <Route exact path="/challenge/:id/recap" element={<RequireHousehold><Recap /></RequireHousehold>} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
