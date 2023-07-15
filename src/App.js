import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Shell from "./Shell";
import Quizzes from "./Quizzes";
import France from "./France";
import Review from "./Review";
import RentABackpacker from "./RentABackpacker";


const App = () => (
  <Router>
    <Shell>
      <Routes>
        <Route exact path="/" element={<Quizzes />} />
        <Route exact path="/quizzes" element={<Quizzes />} />
        <Route exact path="/france" element={<France />} />
        <Route exact path="/review" element={<Review />} />
        <Route exact path="/rent-a-backpacker" element={<RentABackpacker/>} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
