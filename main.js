const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, clipboard } = require('electron');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const WindowSnapper = require('./window-snapper');



let mainWindow = null;

let isQuiting = false;
let pythonProcess = null;


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 320,
        height: 220,
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

    // Init magnetic snapping
    new WindowSnapper(mainWindow, 'teste_wifi');
}


const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}



app.whenReady().then(() => {
    try {
        const electron = require('electron');
        const Menu = electron.Menu;
        const Tray = electron.Tray;
        const nativeImage = electron.nativeImage;
        const iconPath = require('path').join(__dirname, 'build/icon.png');
        const trayIcon = nativeImage.createFromPath(iconPath);
        global.myTray = new Tray(trayIcon);
        global.myTray.setToolTip('Teste WiFi');
        const ctxMenu = Menu.buildFromTemplate([
            { label: 'Abrir', click: () => { if(typeof mainWindow !== 'undefined' && mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
            { type: 'separator' },
            { label: 'Sair', click: () => { app.quit(); process.exit(0); } }
        ]);
        global.myTray.setContextMenu(ctxMenu);
        global.myTray.on('click', () => {
            if (typeof mainWindow !== 'undefined' && mainWindow) {
                if (mainWindow.isVisible()) mainWindow.hide();
                else { mainWindow.show(); mainWindow.focus(); }
            }
        });
    } catch(e) { console.error('Tray error', e); }

    createWindow();
    
    
    // Show window shortly after to ensure transparency kicks in correctly
    setTimeout(() => {
        mainWindow.show();
        mainWindow.center();
        mainWindow.focus();
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

let currentTest = null;


const { exec } = require('child_process');
ipcMain.handle('ping-server', async (event, host) => {
    return new Promise((resolve) => {
        exec(`ping -n 1 -w 1000 ${host}`, (error, stdout) => {
            if (error) {
                resolve(-1);
                return;
            }
            const match = stdout.match(/tempo[=<](\d+)ms/i) || stdout.match(/time[=<](\d+)ms/i);
            if (match && match[1]) {
                resolve(parseInt(match[1]));
            } else {
                resolve(-1);
            }
        });
    });
});

const https = require('https');

ipcMain.on('copy-text', (event, text) => {
    if (text) clipboard.writeText(text);
});

ipcMain.handle('repair-network', async () => {
    return new Promise((resolve) => {
        exec('ipconfig /flushdns', (error) => resolve(!error));
    });
});

ipcMain.handle('get-network-info', async () => {
    const nets = os.networkInterfaces();
    let localIp = 'Desconhecido';
    let ifaceName = 'Desconhecido';
    
    for (const name of Object.keys(nets)) {
        if (name.toLowerCase().includes('virtual') || name.toLowerCase().includes('vbox') || name.toLowerCase().includes('vmware')) continue;
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                ifaceName = name;
                break;
            }
        }
        if (localIp !== 'Desconhecido') break;
    }
    
    const publicIp = await new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data).ip); } catch (e) { resolve('Erro'); }
            });
        }).on('error', () => resolve('Erro'));
    });
    
    return { localIp, publicIp, ifaceName };
});

ipcMain.on('start-test', (event) => {
    try {
        event.reply('test-event', { event: 'status', data: 'Buscando servidor (pode demorar alguns segs)...' });
        
        if (currentTest) {
            currentTest.kill();
        }
        
        let scriptPath = path.join(__dirname, 'speedtest.exe');
        if (app.isPackaged) {
            scriptPath = path.join(process.resourcesPath, 'app', 'speedtest.exe');
        }
        
        currentTest = spawn(scriptPath, ['-f', 'jsonl', '--accept-license', '--accept-gdpr']);
        
        currentTest.stdout.on('data', (data) => {
            const output = data.toString().split('\n');
            for (let line of output) {
                if (line.trim() === '') continue;
                try {
                    const progEvent = JSON.parse(line.trim());
                    
                    if (progEvent.type === 'ping' && progEvent.ping && progEvent.ping.latency) {
                        event.reply('test-event', { event: 'status', data: 'Testando Ping...' });
                        event.reply('test-event', { 
                            event: 'server_info', 
                            data: { 
                                sponsor: 'Ping', 
                                name: 'Medindo...', 
                                country: '', 
                                latency: progEvent.ping.latency 
                            } 
                        });
                    }
                    if (progEvent.type === 'download' && progEvent.download && progEvent.download.bandwidth) {
                        event.reply('test-event', { event: 'status', data: 'Testando Download...' });
                        event.reply('test-event', { event: 'progress_download', data: progEvent.download.bandwidth * 8 });
                    }
                    if (progEvent.type === 'upload' && progEvent.upload && progEvent.upload.bandwidth) {
                        event.reply('test-event', { event: 'status', data: 'Testando Upload...' });
                        event.reply('test-event', { event: 'progress_upload', data: progEvent.upload.bandwidth * 8 });
                    }
                    if (progEvent.type === 'result') {
                        event.reply('test-event', { 
                            event: 'done', 
                            data: {
                                ping: progEvent.ping.latency,
                                download: progEvent.download.bandwidth * 8,
                                upload: progEvent.upload.bandwidth * 8,
                                server: (progEvent.server.name || 'Ookla') + ' - ' + (progEvent.server.location || 'Local')
                            }
                        });
                    }
                } catch (e) {}
            }
        });
        
        currentTest.on('close', () => {
            currentTest = null;
        });
        
    } catch (e) {
        event.reply('test-event', { event: 'error', data: 'Erro: ' + e.message });
    }
});



let continuousPingProcess = null;

ipcMain.on('start-continuous-ping', (event, host) => {
    if (continuousPingProcess) continuousPingProcess.kill();
    continuousPingProcess = spawn('ping', ['-t', host || '8.8.8.8']);
    
    continuousPingProcess.stdout.on('data', (data) => {
        const output = data.toString('latin1');
        const match = output.match(/tempo[=<](\d+)ms/i) || output.match(/time[=<](\d+)ms/i);
        if (match) {
            event.sender.send('continuous-ping-update', { ms: parseInt(match[1]), status: 'success' });
        } else if (output.includes('Esgotado') || output.includes('Request timed out')) {
            event.sender.send('continuous-ping-update', { ms: 0, status: 'timeout' });
        }
    });
});

ipcMain.on('stop-continuous-ping', () => {
    if (continuousPingProcess) {
        continuousPingProcess.kill();
        continuousPingProcess = null;
    }
});


