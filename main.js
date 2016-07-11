'use strict'

const Electron = require('electron')

const {app, BrowserWindow} = Electron

let win

function createWindow() {
    console.log('app start')
    win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadURL(`file://${__dirname}/src/html/index.html`)

    win.webContents.openDevTools()

    win.on('close', () => {
        win = null
    })

}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if(win === null) {
        createWindow()
    }
})
