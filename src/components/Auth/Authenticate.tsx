// import React, { useState } from "react";
// import { supabase } from "../../Supabaseclient";

// type userTable = {
//   id: string;
//   username: string;
//   email: string;
//   created_at: string;
//   profile_picture: string;
//   bio: string;
// };

// const Authenticate: React.FC = () => {
//   const [error, setError] = useState("");
//   let isSyncing = false;

//   const syncUserToSupabase = async (user: any) => {
//     if (isSyncing) return;
//     isSyncing = true;

//     const user_id = user.id; // Adjusted access to user id directly
//     const name = user.user_metadata?.full_name || "default_username";
//     const email = user.email || "";
//     const avatar_url = user.user_metadata?.avatar_url || "";
//     const createdAt = user.created_at || new Date().toISOString();

//     const userData: userTable = {
//       id: user_id,
//       username: name.replace(/\s+/g, "_"),
//       email: email,
//       created_at: createdAt,
//       profile_picture: avatar_url,
//       bio: "",
//     };

//     // Check if the user exists in Supabase
//     const { data, error } = await supabase
//       .from("users")
//       .select("id")
//       .eq("id", userData.id);

//     if (error) {
//       alert(`Error retrieving user from Supabase: ${error.message}`);
//       return;
//     }

//     // Only insert if the user does not exist in Supabase
//     if (!data || data.length === 0) {
//       const { error: insertError } = await supabase
//         .from("users")
//         .insert([{ ...userData }]) // Spread userData object
//         .select("*");

//       if (insertError) {
//         alert(`Error syncing with Supabase: ${insertError.message}`);
//       } else {
//         console.log("User synced to Supabase");
//       }
//     } else {
//       console.log("User already exists in Supabase");
//     }
//     isSyncing = false;
//   };

//   const handleGoogleLogin = async () => {
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//     });

//     if (error) {
//       console.error("Authentication error:", error);
//       setError(error.message);
//       return;
//     } else {
//       window.location.href = data.url;
//       const { data: sessionData } = await supabase.auth.getSession();
//       console.log(sessionData);

//       if (sessionData?.session) {
//         // User is signed in, access user information
//         const user = sessionData.session.user;
//         await syncUserToSupabase(user);
//         console.log("Authenticated user:", user);
//       } else {
//         console.log("No active session found.");
//       }
//     }
//   };

//   return (
//     <div className="authenticate-container flex justify-center items-center min-h-screen bg-dark-black relative">
//       <div className="authenticate-form bg-white p-8 rounded-lg shadow-xl z-10">
//         <h2 className="text-2xl mb-4 text-center">Sign in with Google</h2>
//         {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//         <button
//           onClick={handleGoogleLogin}
//           className="w-full bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600"
//         >
//           Sign in with Google
//         </button>
//       </div>
//       <div className="bg-circles-overlay absolute top-0 left-0 w-full h-full z-0"></div>
//     </div>
//   );
// };

// export default Authenticate;
import React, { useState, useEffect } from "react";
import { supabase } from "../../Supabaseclient";
import { FaUser } from "react-icons/fa";

type userTable = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  profile_picture: string;
  bio: string;
};

const Authenticate: React.FC = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const syncUserToSupabase = async (user: any) => {
    if (isSyncing) return;
    setIsSyncing(true);

    const userData: userTable = {
      id: user.id,
      username: user.user_metadata?.full_name?.replace(/\s+/g, "_") || "default_username",
      email: user.email || "",
      created_at: user.created_at || new Date().toISOString(),
      profile_picture: user.user_metadata?.avatar_url || "",
      bio: "",
    };

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", userData.id);

    if (error) {
      alert(`Error retrieving user from Supabase: ${error.message}`);
      setIsSyncing(false);
      return;
    }

    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([userData])
        .select("*");

      if (insertError) {
        alert(`Error syncing with Supabase: ${insertError.message}`);
      } else {
        console.log("User synced to Supabase");
      }
    } else {
      console.log("User already exists in Supabase");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncUserToSupabase(session.user);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" });

    if (error) {
      console.error("Authentication error:", error);
      setError(error.message);
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        await syncUserToSupabase(sessionData.session.user);
        window.location.href = data.url;
      } else {
        console.log("No active session found.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset any previous errors
  
    // Check if the user exists in Supabase
    const { data: existingUserData, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
  
    if (fetchError && fetchError.code !== "PGRST116") { // Handle unexpected errors
      setError(`Error checking user existence: ${fetchError.message}`);
      return;
    }
  
    // User exists in database
    if (existingUserData) {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) {
        setError(`Error sending OTP: ${otpError.message}`);
      } else {
        setError("OTP sent! Please check your email.");
      }
    } else {
      // New user, register them in Supabase users table
      const { data: newUser, error: registerError } = await supabase.auth.signInWithOtp({email:email})
      if (registerError) {
        setError(`Error registering new user: ${registerError.message}`);
        return;
      }
  
      // Sync new user data to the users table in Supabase
      if (newUser.user) {
        await syncUserToSupabase(newUser.user);
        setError("New user registered. OTP sent! Please check your email.");
      }
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              aria-label="Email address"
              placeholder="Email address"
              className={`block w-full pl-10 pr-3 py-2 border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 mb-4 text-white font-semibold rounded-lg bg-blue-500 hover:bg-blue-600"
          >
            Sign in with Magic Link
          </button>
          <p className="text-center text-sm text-gray-600">
            <button
              onClick={handleGoogleLogin}
              className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline transition-colors"
            >
              Sign in with Google
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Authenticate;
