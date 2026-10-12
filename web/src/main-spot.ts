// Entry point of web/spot-the-difference.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import SpotPage from "./pages/SpotPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(SpotPage).mount("#app");
