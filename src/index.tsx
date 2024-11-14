import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "./Supabaseclient";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <SessionContextProvider supabaseClient={supabase}>
    <App />
  </SessionContextProvider>
);
