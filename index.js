const {app, BrowserWindow} = require("electron");
const path = require("path");

app.on("ready", () => {
  const win = new BrowserWindow({
    height: 500,
    width: 350,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile(path.join(__dirname, "planner", "login.html"));
});
