// Entry point of web/balls.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import BallsPage from "./pages/BallsPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(BallsPage).mount("#app");
