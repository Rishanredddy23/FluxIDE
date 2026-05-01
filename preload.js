const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fluxAPI", {
  configureAgent: (config) => ipcRenderer.invoke("agent:configure", config),
  generateCode: (payload) => ipcRenderer.invoke("agent:generate", payload),
  chooseFolder: () => ipcRenderer.invoke("dialog:chooseFolder"),
  newProject: (payload) => ipcRenderer.invoke("project:new", payload),
  saveFile: (payload) => ipcRenderer.invoke("project:saveFile", payload),
  exportZip: (payload) => ipcRenderer.invoke("project:exportZip", payload),
  listSerialPorts: () => ipcRenderer.invoke("serial:list"),
  uploadBoard: (payload) => ipcRenderer.invoke("board:upload", payload),
  installLib: (libName) => ipcRenderer.invoke("board:installLib", libName),
  installLibZip: () => ipcRenderer.invoke("board:installLibZip"),
  autoInstallLibs: (payload) => ipcRenderer.invoke("board:autoInstallLibs", payload),
  runTerminalCommand: (cmd) => ipcRenderer.invoke("sys:terminal", cmd),
  onAgentChunk: (callback) => {
    const listener = (_event, chunk) => callback(chunk);
    ipcRenderer.on("agent:chunk", listener);
    return () => ipcRenderer.removeListener("agent:chunk", listener);
  },
  onAgentDone: (callback) => {
    const listener = (_event, text) => callback(text);
    ipcRenderer.once("agent:done", listener);
    return () => ipcRenderer.removeListener("agent:done", listener);
  },
});
