const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startTest: () => ipcRenderer.send('start-test'),
    onTestEvent: (callback) => ipcRenderer.on('test-event', (event, data) => callback(data)),
    quitApp: () => ipcRenderer.send('quit-app')
});
