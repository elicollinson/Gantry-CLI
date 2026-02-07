#!/usr/bin/env node
import { render } from "ink";
import { App } from "./app.tsx";

// Enter alternate screen buffer (clean canvas, restored on exit)
process.stdout.write("\x1b[?1049h");

const instance = render(<App />);

instance.waitUntilExit().then(() => {
  // Leave alternate screen buffer
  process.stdout.write("\x1b[?1049l");
});
