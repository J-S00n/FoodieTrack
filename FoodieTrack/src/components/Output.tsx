import React from "react";
import { useNavigate } from "react-router-dom"; 


const GridLayout: React.FC = () => {
  const navigate = useNavigate();
  return (
    // <div className="h-full flex items-center">
    <div className="h-screen flex items-center justify-center">

    <div className="container mx-auto grid gap-8 py-10">
        <button
        onClick={() => navigate("/MainApp")}
         className="absolute bottom-8 right-10 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        New chat
      </button>

      {/* Box 1 */}
        <div className="bg-white p-6 shadow-sm h-[900px] text-center border-2 border-green-300 rounded-2xl">
        <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
          Healthy habits, simplified
        </h2>
        <p className="mt-2 text-gray-600">
          Points® crunch complex nutritional data into one simple number. Spend them how you want,
          track them in the app, and make smarter, sustainable food choices.
        </p>
      </div>
    </div>
    </div>
  );
};

export default GridLayout;

