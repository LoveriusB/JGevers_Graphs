import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Amplify } from "aws-amplify";
import App from "./App";
import { theme } from "./theme";

// The frontend can run before an Amplify sandbox has been provisioned.
const configs = import.meta.glob<Parameters<typeof Amplify.configure>[0]>(
  "../amplify_outputs.json",
  { eager: true, import: "default" },
);
const outputs = configs["../amplify_outputs.json"];
if (outputs) {
  Amplify.configure(outputs);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
