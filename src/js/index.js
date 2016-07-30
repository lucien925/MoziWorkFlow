;(function() {
	'use strict'
	const electron = require('electron')
	const path = require('path')
	const fs = require('fs')
	const remote = electron.remote
	const { ipcRenderer } = electron
	const { dialog } = remote

	// element query
	const JAddFolder  = $('#J-add-folder'),
		  JMoziList   = $('#J-mozi-list'),
		  actions     = $$('.mozi-actions-item > a')

	// html template
	let projectTmpl   = $('#project-tmpl')

	//global variables
	let workspace = null,
		context = ''

	// init 
	;(() => {
		workspace = localStorage.getItem('workspace')
		if(!workspace) { 
			workspace = []
		} else {
			workspace = JSON.parse(workspace)
			context = workspace[0].path
			generateProjectItem(workspace)
		}
	})()

	// transform html string to html dom structure
	function generateProjectItem(value) {
		if(typeof value === 'object') {
			let len = value.length,
				i = -1
			while(++i < len) {
				let tmpl = projectTmpl.innerHTML,
					html = ''
				html = tmpl.replace(/\{projectName\}/g, value[i].name)
						   .replace(/\{projectPath\}/g, value[i].path)
				const parser = new DOMParser(),
					  content = parser.parseFromString(html, 'text/html'),
					  targetEle = $('.mozi-list-item', content)
				JMoziList.insertBefore(targetEle, JMoziList.firstChild)
			}
		}
	}

	// add project to container
	JAddFolder.onclick = () => {
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, (opts) => {
			if(!opts) return
			context = opts[0]
			let len = workspace.length,
				index = -1
			while(++index < len) {
				if(context === workspace[index].path) {

					// show dialog to user for the project already exists
					dialog.showErrorBox('Error:', '当前工作区已经存在该目录!')
					return; 
				}
			}
			let _context = context,
				_a = _context.split(path.sep),
			    _o = {
					  name: _a[_a.length - 1],
					  path: _context
				}
			
			workspace.push(_o)
			localStorage.setItem('workspace', JSON.stringify(workspace))
			generateProjectItem([_o])
		})
	}
	JMoziList.onclick = (e) => {
		e.preventDefault()
		e.stopPropagation()
		let _this = this,
			_target = e.target,
			_action = _target.dataset.action,
			_targetParent = walker(_target),
			_path = ''
		if(!_targetParent) return
		_path = _targetParent.dataset.targetProject
		if(_action) {
			switch(_action) {
				case 'remove':
				case 'del':
					let __workspaceStringify = null
					// if(_action === 'del') {
					// 	let buttons = ['Yes', 'No'],
					// 		currentWin = remote.getCurrentWindow(),
					// 		buttonIndex = dialog.showMessageBox(currentWin, {
					// 						type: 'warning',
					// 						title: 'Warning:',
					// 						buttons: buttons,
					// 						message: '您确定要删除当前项目吗？删除之后无法撤销哦，请三思啊.'
					// 					})
					// 	if(buttonIndex === 1) 
					// 		return
					// 	else {
					// 		fs.unlink(_path, (err) => {
					// 			if(err) {
					// 				// show delete error infomation
					// 				console.log(err)
					// 			}
					// 		})
					// 	}
					// }

					workspace.every((item, index) => {
						if(item.path === _path) {
							workspace.splice(index, 1)
							return false;
						}
					})
					JMoziList.removeChild(_targetParent)
					if(workspace.length > 0) {
						__workspaceStringify = JSON.stringify(workspace)
						localStorage.setItem('workspace', __workspaceStringify)
					} else {
						localStorage.removeItem('workspace')
					}
		
				case 'info':
				default:
					break;
			}
			return
		} else {
			$$('.mozi-list-item', this).forEach((item, index) => {
				item.classList.remove('current')
			})

			_targetParent.classList.add('current')
			context = _path
		}
	}

	actions.forEach((action, index) => {
		action.onclick = function() {

			let _this = this,
				_context = context,
				_action = this.dataset.action
			if(_action === 'init') {
				let __path = path.join(_context, 'app', ''),
					__isExists = fs.existsSync(path.join(_context, 'app', 'moz.config.js'))
				dialog.showErrorBox('Error:', '当前目录已经被初始化了')
				return false
			}
			// judge the action can be deal with
			ipcRenderer.send('action', _action, _context)
		}
	})


	ipcRenderer.on('end', (event) => {
		$('.mask').style.display = 'block'
		$('.mask > .success').style.display = 'block'
	})

	ipcRenderer.on('error', () => {
		$('.mask').style.display = 'block'
		$('.mask > .error').style.display = 'block'
	})
	// util functions
	function $(selector , ctx) {
		if(!ctx) ctx = document
		return ctx.querySelector(selector)
	}

	function $$(selector, ctx) {
		if(!ctx) ctx = document
		return slice(ctx.querySelectorAll(selector))
	}
	function walker(ele) {
		if(!ele.classList) {
			return false
		}
		if(ele.classList.contains('mozi-list-item')) {
			return ele
		}

		let parent = ele.parentNode
		return walker(parent)
	}

	function slice(eles) {
		return Array.prototype.slice.call(eles);
	}

	function deleteFolder(path) {
		if(fs.existsSync(path)) {
			fs.readdirSync(path).forEach((file) => {
				let _path = `path${fs.sep}file`
				if(fs.statSync(_path).isDirectory()) {
					deleteFolder(_path)
				} else {
					fs.unlinkSync(_path)
				}

			})
		}
	}

})();