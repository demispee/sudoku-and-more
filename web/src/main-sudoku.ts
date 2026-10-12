// Entry point of web/sudoku.html: loads the WebAssembly, then shows the page
import { createApp } from "vue";
import SudokuPage from "./pages/SudokuPage.vue";
import "./styles/lab271.css";
import { loadWasm } from "./wasm";

await loadWasm();
createApp(SudokuPage).mount("#app");
