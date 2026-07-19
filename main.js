const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let isQuiting = false;
let pythonProcess = null;

function createTray() {
    const iconPath = path.join(__dirname, 'build', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    tray.setToolTip('Teste WiFi Portátil');
    
    const initialMenu = Menu.buildFromTemplate([
        { label: 'Abrir Teste WiFi', click: () => { mainWindow.show(); mainWindow.focus(); } },
        { type: 'separator' },
        { label: 'Sair', click: () => { isQuiting = true; app.quit(); } }
    ]);
    tray.setContextMenu(initialMenu);
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 550,
        show: false, // Don't show immediately to prevent flickering
        frame: false,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        skipTaskbar: true, // Hide from taskbar
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('ui/index.html');

    // Prevent the window from being destroyed when closed
    mainWindow.on('close', function (event) {
        if (!isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    
    // Show window shortly after to ensure transparency kicks in correctly
    setTimeout(() => {
        mainWindow.show();
        mainWindow.center();
        mainWindow.setAlwaysOnTop(true);
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
    }, 500);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    if (pythonProcess) {
        try { pythonProcess.kill(); } catch(e) {}
    }
});

ipcMain.on('quit-app', () => {
    isQuiting = true;
    app.quit();
});

ipcMain.on('start-test', (event) => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
    
    let scriptPath = path.join(__dirname, 'backend.py');
    if (app.isPackaged) {
        scriptPath = path.join(process.resourcesPath, 'app', 'backend.py');
    }
    
    pythonProcess = spawn('python', [scriptPath]);
    
    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString().split('\n');
        for (let line of output) {
            if (line.trim() === '') continue;
            try {
                const json = JSON.parse(line);
                event.reply('test-event', json);
            } catch (e) {
                console.error("Parse error:", line);
            }
        }
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        pythonProcess = null;
    });
});
