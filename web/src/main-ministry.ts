// Entry point of web/ministry.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import MinistryPage from "./pages/MinistryPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(MinistryPage).mount("#app");
