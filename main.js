const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const DataStore = require('./renderer/MusicDataStore');

const myStore = new DataStore({
  name: "Music Data"
});

class AppWindow extends BrowserWindow {
  constructor(config, fileLocation) {
    const basicConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    }
    const finalConfig = { ...basicConfig, ...config };
    super(finalConfig);
    this.loadFile(fileLocation);
    this.once('ready-to-show', () => {
      this.show();
    })
  }
}

app.on('ready', () => {
  const mainWindow = new AppWindow({}, './renderer/index.html');
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('page did finish load')
    mainWindow.send('getTracks', myStore.getTracks());
  })
  ipcMain.on('add-music-window', () => {
    new AppWindow({
      width: 500,
      height: 400,
      parent: mainWindow
    }, './renderer/add.html');
  })
  ipcMain.on('add-tracks', (event, tracks) => {
    const updatedTracks = myStore.addTracks(tracks).getTracks();
    mainWindow.send('getTracks', updatedTracks);
  })
  ipcMain.on('delete-track', (event, id) => {
    const updatedTracks = myStore.deleteTrack(id).getTracks();
    mainWindow.send('getTracks', updatedTracks);
  })
  ipcMain.on('open-music-file', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Music', extensions: ['mp3'] }]
    }).then(result => {
      console.log(result.canceled);
      console.log(result.filePaths);
      event.sender.send('selected-file', result.filePaths);
    }).catch(err => {
      console.log(err);
    })
  })
});