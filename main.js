'use strict'

const Electron = require('electron')
const cp = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { app, BrowserWindow, ipcMain } = Electron

let win = null

let defaultCwd = '/Users/lucienyu/Workspace/test'
process.stdout.setEncoding('UTF-8')
process.stdout.on('data', (chunk) => {
    if(!chunk) return
    dealLog(chunk)
})
function createWindow() {
    console.log('app start')
    win = new BrowserWindow({
        width: 800,
        height: 700
    })

    win.loadURL(`file://${__dirname}/src/html/index.html`)

    win.webContents.openDevTools()

    win.on('close', () => {
        win = null
    })
}

function appInit() {
    ipcMain.on('init', (event, arg) => {
        let _arg = arg
        event.sender.send('init-replay', 'input-project-name')
        ipcMain.on('init-project', (event, arg) => {
            (() => {
                // handle the peoject name `_arg`
                mozTask('init', _arg)
            })()
            ipcMain.removeListener('init-project')
        })
    })
}
function appServe() {
    ipcMain.on('serve', (event, arg) => {
        mozTask('serve', arg)
    })
}

function appBuild() {
    ipcMain.on('build', (event, arg) => {
        //mozTask('build', arg)
        let _cwd = arg
        const childForBuild = cp.exec('moz build', {
            cwd: _cwd
        })

        childForBuild.stderr.on('data', (err) => {
            let _errToString = data.toString()
            console.error(_errToString)
        })

        childForBuild.stdout.on('data', (data) => {
            console.log(data.toString())
        })
        childForBuild.stdout.on('finish', () => {
            // show the end of the displayed message
            // kill child process

        })

    })
}

function appDeploy() {
    ipcMain.on('deploy', (event, arg) => {
        mozTask('deploy', arg)
    })
}

function appPackage() {
    ipcMain.on('pack', (event, arg) => {
        //mozTask('pack', arg)
        const childForPack = cp.exec('moz pack', {
            cwd
        })
    })
}

app.on('ready', () => {
    createWindow()
    //appInit()     // app init
    //appPackage()  // app package
    //appDeploy()   // app deploy
    //appBuild()    // app build
    //appServe()    // app serve

    ipcMain.on('action', (event, action, context) => {
        if(action === 'init') {
            // input project name
        }
        console.log(action, context)
        const child = cp.exec(`moz ${action}`, {
            cwd: context
        })


        child.stderr.on('data', (err) => {
            let _err = err.toString()
            // handle the error
            event.sender.send('error', err)
            console.log(_err)
        })

        child.stdout.on('data', (data) => {
            console.log(data.toString())
        })

        child.stdout.on('finish', () => {
            // show the end of the displayed message
            event.sender.send('end', action, context)
            // kill child process
            process.kill(child.pid) 
        })
    })

    ipcMain.on('stop', (event, pid) => {

    })
})

function mozTask(task, cwd) {
    if(cwd) {
        try {   
            process.chdir(cwd)
        } catch(err) {
            console.log(err)
            return
        }
    }
    process.argv.push(task)
    require('moz/bin/moz')
}

function dealLog(s) {

}
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
