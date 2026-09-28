const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startTest: () => ipcRenderer.send('start-test'),
    onTestEvent: (callback) => ipcRenderer.on('test-event', (event, data) => callback(data)),
    quitApp: () => ipcRenderer.send('quit-app'),
    hideApp: () => ipcRenderer.send('hide-app'),
    togglePin: () => ipcRenderer.send('toggle-pin'),
    pingServer: (host) => ipcRenderer.invoke('ping-server', host),
    getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
    repairNetwork: () => ipcRenderer.invoke('repair-network'),
    copyText: (text) => ipcRenderer.send('copy-text', text),
    startContinuousPing: (host) => ipcRenderer.send('start-continuous-ping', host),
    stopContinuousPing: () => ipcRenderer.send('stop-continuous-ping'),
    onContinuousPingUpdate: (callback) => {
        ipcRenderer.removeAllListeners('continuous-ping-update');
        ipcRenderer.on('continuous-ping-update', (event, data) => callback(data));
    }
});



