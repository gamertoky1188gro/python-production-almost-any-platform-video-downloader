const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "renderer", "renderer.js"),
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, "assets", "app_icon.ico"), // Set custom icon
    });

    mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
});

// Handle directory selection
ipcMain.handle("choose-directory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
    });
    return result.filePaths[0] || null;
});

// Handle download request
ipcMain.on("download-request", (event, args) => {
    const { url, type, format, directory } = args;

    // Python script path
    const pythonScript = path.join(__dirname, "app", "app.py");

    // Spawn Python process
    const pythonProcess = spawn("python", [
        pythonScript,
        "--url", url,
        "--type", type,
        "--format", format,
        "--directory", directory,
    ]);

    let progress = 0;
    let downloadedFile = "";

    pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(output);

        // Handle progress updates
        const progressMatches = output.match(/Progress: (\d+\.?\d*)%/g);
        if (progressMatches) {
            const lastProgress = progressMatches[progressMatches.length - 1];
            progress = parseFloat(lastProgress.match(/(\d+\.?\d*)/)[0]); // Extract the number
            mainWindow.webContents.send("download-progress", progress);
        }

        // Capture downloaded file path
        const fileMatch = output.match(/Downloaded file: (.+)/);
        if (fileMatch) {
            downloadedFile = fileMatch[1].trim();
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        const errorMessage = data.toString();
        console.error(`Error: ${errorMessage}`);
        mainWindow.webContents.send("download-error", errorMessage); // Notify the renderer process of the error
    });

    pythonProcess.on("close", (code) => {
        if (code === 0 && downloadedFile) {
            const videoFile = downloadedFile.endsWith(".mp4")
                ? downloadedFile
                : downloadedFile.replace(/\.f\d+\.\w+$/, ".mp4");

            mainWindow.webContents.send("download-completed", videoFile);

            // Open new window to display downloaded video
            const fileWindow = new BrowserWindow({
                width: 600,
                height: 400,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                },
            });

            fileWindow.loadURL(`file://${path.join(__dirname, "renderer", "file_viewer.html")}`);
            fileWindow.webContents.once("did-finish-load", () => {
                fileWindow.webContents.send("display-file", videoFile);
            });
        } else if (code !== 0) {
            const error = `Download failed with exit code ${code}`;
            console.error(error);
            mainWindow.webContents.send("download-error", error); // Notify renderer process of failure
        }
    });
});

