import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaPlus, FaHome, FaUsers } from "react-icons/fa";

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 px-4 py-2 flex justify-around items-center shadow-t-lg z-10 bg-white">
      {/* Feed Link */}
      <Link
        to="/feed"
        className={`flex flex-col items-center transition-transform duration-200 ${
          location.pathname === "/feed"
            ? "text-blue-500 scale-110 drop-shadow-md"
            : "text-gray-500 hover:text-blue-400 hover:scale-105"
        }`}
      >
        <FaHome className="text-2xl" />
        <span className="text-xs mt-1">Feed</span>
      </Link>

      {/* Floating Add Post Button */}
      <Link
        to="/addpost"
        className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg transition-transform transform hover:scale-105"
        style={{
          marginTop: "-20px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <FaPlus className="text-2xl" />
      </Link>

      {/* Network Link */}
      <Link
        to="/network"
        className={`flex flex-col items-center transition-transform duration-200 ${
          location.pathname === "/network"
            ? "text-blue-500 scale-110 drop-shadow-md"
            : "text-gray-500 hover:text-blue-400 hover:scale-105"
        }`}
      >
        <FaUsers className="text-2xl" />
        <span className="text-xs mt-1">Network</span>
      </Link>
    </nav>
  );
};

export default BottomNavigation;
