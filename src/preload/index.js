import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  getConnectedDevices: () => ipcRenderer.invoke('get-connected-devices'),
  blockDevice: (deviceId) => ipcRenderer.invoke('block-device', deviceId),
  unblockDevice: (deviceId) => ipcRenderer.invoke('unblock-device', deviceId),

  
  loadTheme: () => ipcRenderer.invoke('theme:load'),
  saveTheme: (theme) => ipcRenderer.invoke('theme:save', theme),
  getFiles: (path) => ipcRenderer.invoke('get-files', path),
 
  fetchTemplates: () => ipcRenderer.invoke('fetch-templates'),
  downloadTemplate: (template) => ipcRenderer.invoke('download-template', template),
  getDownloadedTemplates: () => ipcRenderer.invoke('get-downloaded-templates'),
  serveTemplate: (templateName) => ipcRenderer.invoke('serve-template', templateName),
  openTemplateInBrowser: () => ipcRenderer.invoke('open-template-in-browser'),
  
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  closeSplashWindow: () => ipcRenderer.send('closeSplashWindow'),
  startServer: () => ipcRenderer.send('start-server'),
  //getIPs: () => ipcRenderer.invoke('get-ips'),
  fullscreen: () => ipcRenderer.send('full-screen'),
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  sendServerInfo: (ip, port) => ipcRenderer.invoke('send-server-info', ip, port),
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  logMessage: (message, level = 'info') => ipcRenderer.send('log-message', { message, level }),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
    return () => ipcRenderer.removeAllListeners('download-progress')
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (_, templateInfo) => callback(templateInfo))
    return () => ipcRenderer.removeAllListeners('download-complete')
  },
  onServerStatusChange: (callback) => {
    ipcRenderer.on('server-status-change', (_, status) => callback(status))
    return () => ipcRenderer.removeAllListeners('server-status-change')
  }
  ,
   scanWiFiNetworks: () => ipcRenderer.invoke('scan-wifi-networks'),
  getCurrentWiFiConnection: () => ipcRenderer.invoke('get-current-wifi-connection'),
  connectToWiFiNetwork: (ssid, password) => ipcRenderer.invoke('connect-to-wifi', ssid, password),
  disconnectFromWiFiNetwork: () => ipcRenderer.invoke('disconnect-from-wifi'),
  updateSelectedIP: (selectedIP) => ipcRenderer.invoke('update-selected-ip', selectedIP),
  onServerStatusChange: (callback) => ipcRenderer.on('server-status', (_, status) => callback(status)),
  activate: () => ipcRenderer.invoke('activate'),
  deactivate: () => ipcRenderer.invoke('deactivate'),
  isActivated: () => ipcRenderer.invoke('isActivated'),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  checkUser: () => ipcRenderer.invoke("check-user"),
  saveUser: (user) => ipcRenderer.invoke("save-user", user),
  stopProcesses: () => ipcRenderer.send("stop-processes"),
  getTimer: () => ipcRenderer.invoke("get-timer"),
  saveTimer: (time) => ipcRenderer.invoke("save-timer", time),
  getFiles: () => ipcRenderer.invoke("get-files"),
  log: (message, level = "info") => ipcRenderer.send("log-message", { message, level }),
  getLogs: () => ipcRenderer.invoke("get-logs"),
  selectIcon: () => ipcRenderer.invoke('select-icon'),
  importFiles: (files) => ipcRenderer.invoke('import-files', files),
  getAssets: () => ipcRenderer.invoke("get-assets"),
  openFile: (filePath) => ipcRenderer.send("open-file", filePath),
  copyPath: (filePath) => ipcRenderer.send("copy-path", filePath),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  onLogUpdate: (callback) => {
    ipcRenderer.removeAllListeners("update-logs"); // Ensure no duplicate listeners
    ipcRenderer.on("update-logs", (_event, newLog) => callback(newLog));
  },
  removeLogUpdate: (callback) => ipcRenderer.removeListener("update-logs", callback),
  clearLogs: () => ipcRenderer.send("clear-logs"), // New function to clear logs
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
