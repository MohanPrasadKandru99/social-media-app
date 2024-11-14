import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import NewsFeed from "../components/Feed/Feed";
import BottomNavigation from "../components/Navigation/BottomNavigation";
import NewPost from "../components/Post/NewPost";
import Network from "../components/Network/Network";
import TopNavigation from "../components/Navigation/TopNavigation";
import { useUser } from "@supabase/auth-helpers-react";
import Authenticate from "../components/Auth/Authenticate";
import { useState, useEffect } from "react";

const RouteHandler = () => {
  const user = useUser();
  const [showTopNav, setShowTopNav] = useState(true);
  const [lastScrollPos, setLastScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      if (currentScrollPos > lastScrollPos && currentScrollPos > 50) {
        setShowTopNav(false); // Hide TopNavigation on scroll down
      } else {
        setShowTopNav(true); // Show TopNavigation on scroll up
      }

      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollPos]);

  return (
    <Router>
      {/* Main wrapper to hold everything */}
      <div className="flex flex-col min-h-screen">
        {/* Top Navigation (Logout) with scroll-based visibility */}
        {user && showTopNav && <TopNavigation />}

        <div className={`flex-grow ${user? 'mt-12 mb-12' :''}`}> {/* Main content with margin */}
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/feed" /> : <Authenticate />}
            />
            <Route
              path="/feed"
              element={user ? <NewsFeed currentUserId={user.id} /> : <Navigate to="/" />}
            />
            <Route
              path="/addpost"
              element={user ? <NewPost /> : <Navigate to="/" />}
            />
            <Route
              path="/network"
              element={user ? <Network CurrentUserId={user.id}/> : <Navigate to="/" />}
            />
          </Routes>
        </div>

        {/* Bottom Navigation (visible on all pages when logged in) */}
        {user && <BottomNavigation />}
      </div>
    </Router>
  );
};

export default RouteHandler;
