// Entry point of web/mastermind.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import MastermindPage from "./pages/MastermindPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(MastermindPage).mount("#app");
