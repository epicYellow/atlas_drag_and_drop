import React from "react";
import ReactDOM from "react-dom/client";
import AppProvider from "@atlaskit/app-provider";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
