// Entry point of web/flying-schubert.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import FlyingPage from "./pages/FlyingPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(FlyingPage).mount("#app");
