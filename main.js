'use strict'

const Electron = require('electron')
const cp = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { app, BrowserWindow, ipcMain, dialog } = Electron
let win = null,
    logIpc = null


app.on('ready', () => {
    // 初始化ipc打印控制台进程
    ipcMain.on('log-init', (event) => {
        logIpc = event
    })
    // 创建窗口
    createWindow()
    // 监听ipcRenderer发送过来的事件
    ipcMain.on('action', (event, action, context, projectName) => {
        let child = null
        if(action === 'init') {
            child = cp.exec(`${__dirname}/node_modules/moz/bin/moz ${action} -p ${projectName}`, {
                cwd: context
            })
        } else {
            child = cp.exec(`${__dirname}/node_modules/moz/bin/moz ${action}`, {
                cwd: context
            })
        }
        event.sender.send('pid', child.pid)
        child.stdout.setEncoding('UTF-8')
        child.stderr.setEncoding('UTF-8')
        child.stderr.on('data', (err) => {
            let _err = err.toString()
            // 处理错误
            event.sender.send('error', err, child.pid)
        })

        child.stdout.on('data', (log) => {
            logIpc.sender.send('log', log)
            
        })

        child.stdout.on('finish', () => {
            // show the end of the displayed message
            event.sender.send('end', action, context, child.pid)
            // kill child process
        })
    })

    ipcMain.on('stop', (event, pid) => {
        try {
            process.kill(pid)
        } catch(err) {
            
        }
    })
})

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 700
    })

    win.loadURL(`file://${__dirname}/src/html/index.html`)
    // win.webContents.openDevTools()
    win.on('close', () => {
        win = null
    })
}
// 不创建子进程的方式去执行moz的任务
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
