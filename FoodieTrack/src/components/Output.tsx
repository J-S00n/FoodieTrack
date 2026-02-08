import React from "react";
import "./GridLayout.css";

const GridLayout: React.FC = () => {
  return (
    <div className="container">
      <div className="box">Box 1</div>
      <div className="box">Box 2</div>
      <div className="box">Box 3</div>
      <div className="box">Box 4</div>
      <div className="box">Box 5</div>
      <div className="box">Box 6</div>
    </div>
  );
};

export default GridLayout;
