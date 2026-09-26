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
import Recap from "./pages/Recap";
import Onboarding from "./pages/Onboarding";
import JoinTenant from "./pages/JoinTenant";
import { useCurrentUser } from "./UserContext";

// Challenge pages require a tenant key. Static personal pages stay public.
const RequireTenant = ({ children }) => {
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
        <Route exact path="/join/:key" element={<JoinTenant />} />
        <Route exact path="/challenges" element={<RequireTenant><Challenges /></RequireTenant>} />
        <Route exact path="/challenge/new" element={<RequireTenant><CreateChallenge /></RequireTenant>} />
        <Route exact path="/challenge/:id" element={<RequireTenant><ChallengeDashboard /></RequireTenant>} />
        <Route exact path="/challenge/:id/recap" element={<RequireTenant><Recap /></RequireTenant>} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
