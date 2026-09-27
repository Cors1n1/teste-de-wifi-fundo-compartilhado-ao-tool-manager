const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startTest: () => ipcRenderer.send('start-test'),
    onTestEvent: (callback) => ipcRenderer.on('test-event', (event, data) => callback(data)),
    quitApp: () => ipcRenderer.send('quit-app'),
    pingServer: (host) => ipcRenderer.invoke('ping-server', host),
    getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
    repairNetwork: () => ipcRenderer.invoke('repair-network'),
    copyText: (text) => ipcRenderer.send('copy-text', text)
});
