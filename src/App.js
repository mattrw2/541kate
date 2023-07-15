import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Shell from "./Shell";
import Quizzes from "./Quizzes";
import France from "./France";
import Review from "./Review";


const App = () => (
  <Router>
    <Shell>
      <Routes>
        <Route exact path="/541kate" element={<Quizzes />} />
        <Route exact path="/541kate/quizzes" element={<Quizzes />} />
        <Route exact path="/541kate/france" element={<France />} />
        <Route exact path="/541kate/review" element={<Review />} />
      </Routes>
    </Shell>
  </Router>
);

export default App;
