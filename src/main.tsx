import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GlobalFinanceProvider } from "./context/GlobalFinanceContext";

<GlobalFinanceProvider>
  <App />
</GlobalFinanceProvider>
createRoot(document.getElementById("root")!).render(<App />);
