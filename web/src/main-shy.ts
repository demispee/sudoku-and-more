// Entry point of web/shy-squares.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import ShyPage from "./pages/ShyPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(ShyPage).mount("#app");
