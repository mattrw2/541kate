import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Shell from "./Shell";
import Quizzes from "./pages/Quizzes";
import France from "./pages/France";
import Review from "./pages/Review";
import RentABackpacker from "./pages/RentABackpacker";
import Home from "./pages/Home";

const App = () => (
  <Router>
    <Shell>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/quizzes" element={<Quizzes />} />
        <Route exact path="/france" element={<France />} />
        <Route exact path="/review" element={<Review />} />
        <Route exact path="/rent-a-backpacker" element={<RentABackpacker/>} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
