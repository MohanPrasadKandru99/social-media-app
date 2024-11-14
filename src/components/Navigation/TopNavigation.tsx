import React from "react";
import { useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { supabase } from "../../Supabaseclient";
import { useUser } from "@supabase/auth-helpers-react";

const TopNavigation: React.FC = () => {
  const user = useUser();
  const navigate = useNavigate();

  const profile = { avatar_url: "", name: "" };
  if (user) {
    profile.avatar_url = user.user_metadata.avatar_url;
    profile.name = user.user_metadata.name;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/"); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="w-full bg-white shadow-lg fixed top-0 left-0 z-20 p-3 flex justify-between items-center">
      {/* Left: Profile Section */}
      <div className="flex items-center space-x-3">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={`${profile.name}'s profile`}
            className="w-10 h-10 rounded-full border-2 border-blue-500"
          />
        )}
        <div className="hidden sm:flex flex-col">
          <span className="text-gray-700 font-medium">Hi, {profile.name}</span>
          <span className="text-xs text-gray-500">Welcome back!</span>
        </div>
      </div>

      {/* Right: Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center text-gray-600 hover:text-red-500 transition-all duration-200 px-3 py-2 rounded hover:bg-red-50"
      >
        <span className="hidden sm:inline-block mr-2 font-medium">Logout</span>
        <BiLogOut size={24} />
      </button>
    </nav>
  );
};

export default TopNavigation;
