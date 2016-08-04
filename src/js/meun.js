const electron = require('electron')
const { remote } = electron
const { menu } = remote

const menuTmpl = [
	{
		label: '文件',
		submenu: [{
			label: '打开项目',
			accelerator: 'CmdOrCtrl+O',
			click: openProject
		}]
	}, {
		label: '帮助',
		role: 'help',
		submenu: [
			{
				label: '打开/关闭控制台',
				click: () => {
					remote.getCurrentWebContents().toggleDevTools()
				}
			}
		]
	}
]

const menuContent = menu.bindFromTemplate(menuTmpl)

menu.setApplicationMenu(menuContent)
