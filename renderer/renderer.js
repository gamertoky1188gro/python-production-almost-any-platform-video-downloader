const { ipcRenderer } = require("electron");

document.getElementById("choose-directory").addEventListener("click", async () => {
    const directory = await ipcRenderer.invoke("choose-directory");
    if (directory) {
        document.getElementById("directory").value = directory;
    }
});

document.getElementById("download-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const url = document.getElementById("url").value;
    const type = document.getElementById("type").value;
    const format = document.getElementById("format").value;
    const directory = document.getElementById("directory").value;

    if (!directory) {
        alert("Please choose a directory.");
        return;
    }

    ipcRenderer.send("download-request", { url, type, format, directory });

    const progressBar = document.getElementById("progress-bar");
    progressBar.value = 0;
    progressBar.style.display = "block";
});

// Update progress bar
ipcRenderer.on("download-progress", (event, progress) => {
    const progressBar = document.getElementById("progress-bar");
    progressBar.value = progress; // Progress is already a number
});


// Handle download completion
ipcRenderer.on("download-completed", (event, filePath) => {
    alert(`Download completed: ${filePath}`);
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.display = "none";
});

// Handle errors
ipcRenderer.on("download-error", (event, message) => {
    alert(`Error: ${message}`);
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.display = "none";
});
