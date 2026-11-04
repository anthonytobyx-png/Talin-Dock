import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Store } from "./state/Store";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Store>
      <App />
    </Store>
  </React.StrictMode>,
);
