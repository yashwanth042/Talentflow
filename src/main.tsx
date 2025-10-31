import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { makeServer } from "./server";
import "./index.css";

if (import.meta.env.DEV) {
  makeServer({ environment: "development" });
} else {
  makeServer({ environment: "production" });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

