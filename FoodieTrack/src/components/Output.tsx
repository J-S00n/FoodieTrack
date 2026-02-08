import React from "react";
import { useNavigate } from "react-router-dom"; 

const GridLayout: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center">
    <div className="container mx-auto grid gap-8 py-10">
        <button
        onClick={() => navigate("/MainApp")}
         className="absolute bottom-6 right-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        New chat
      </button>

      {/* Box 1 */}
        <div className="rounded-xl border-2 border-green-500 bg-white p-6 shadow-sm h-64 flex flex-col justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Healthy habits, simplified
        </h2>
        <p className="mt-2 text-gray-600">
          Points® crunch complex nutritional data into one simple number. Spend them how you want,
          track them in the app, and make smarter, sustainable food choices.
        </p>
      </div>

      {/* Box 2 */}
      <div className="rounded-xl border-2 border-green-500 bg-white p-6 shadow-sm h-64 flex flex-col justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Better nutrition
        </h2>
        <p className="mt-2 text-gray-600">
          Power your body and your journey with more filling, nutrient-rich foods and macronutrient
          guidance. Our program is proven to improve your diet quality.
        </p>
      </div>

      {/* Box 3 */}
      <div className="rounded-xl border-2 border-green-500 bg-white p-6 shadow-sm h-64 flex flex-col justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Flexibility for real life
        </h2>
        <p className="mt-2 text-gray-600">
          When you don’t white-knuckle weight loss, you win at it. Eat at restaurants. Do taco
          Tuesday. Still lose weight. Points show you how.
        </p>
      </div>
    </div>
    </div>
  );
};

export default GridLayout;

