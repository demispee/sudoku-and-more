// Entry point of web/reverse-snake.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import SnakePage from "./pages/SnakePage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(SnakePage).mount("#app");
