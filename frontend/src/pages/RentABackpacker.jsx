import React from "react";
import { usePageTitle } from "../usePageTitle";

const RentABackpacker = () => {
  usePageTitle("Rent a Backpacker");
  return (
    <div>
      <p className="px-2">
        Google is dumb and doesn't let me embed the page.{" "}
        <a
          className="text-indigo-400 hover:text-indigo-200"
          target="_blank"
          rel="noreferrer"
          href="https://sites.google.com/view/rent-a-backpacker/meet-our-staff"
        >
          Rent a backpacker here.
        </a>
      </p>
    </div>
  );
};

export default RentABackpacker;
