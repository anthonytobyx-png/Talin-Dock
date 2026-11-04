/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WeatherContext } from "./data/WeatherContext";
import { Store } from "./state/Store";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Store>
      <WeatherContext>
        <App />
      </WeatherContext>
    </Store>
  </React.StrictMode>,
);
