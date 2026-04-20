/**
 * index.js — React Entry Point
 *
 * This is the very first file React runs.
 * It mounts the <App /> component into the <div id="root"> in index.html.
 */

import React    from "react";
import ReactDOM from "react-dom/client";
import App      from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);