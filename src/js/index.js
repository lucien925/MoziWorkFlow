
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
		  actions     = $$('.mozi-actions-item > button'),
		  mask        = $('.mask')

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
					  path: _context,
					  actions: {
					  	init: false,
					  	serve: false,
					  	build: false,
					  	deploy: false,
					  	package: false
					  }
				}
			workspace.push(_o)
			localStorage.setItem('workspace', JSON.stringify(workspace))
			generateProjectItem([_o])
		})
	}
	JMoziList.onclick = (e) => {
		e.preventDefault()
		e.stopPropagation()
		let _this = JMoziList,
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
					let __workspaceStringify = null,
						__len = workspace.length,
						__index = -1
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
					while(++__index < __len) {
						if(workspace[__index]['path'] === _path) {
							workspace.splice(__index, 1)
							break
						}
					}
					
					JMoziList.removeChild(_targetParent)
					if(workspace.length > 0) {
						__workspaceStringify = JSON.stringify(workspace)
						localStorage.setItem('workspace', __workspaceStringify)
					} else {
						localStorage.removeItem('workspace')
						context = ''
					}
		
				case 'info':
				default:
					break;
			}
			return
		} else {
			$$('.mozi-list-item', _this).forEach((item, index) => {
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
				_action = this.dataset.action,
				_contextInWorkspace = contextInWorkspace(_context)
			if(!_contextInWorkspace) return
			// judge the action can be deal with
			let _configFilePath = path.join(_context, 'moz.config.js'),
				_isExistsConfigFile = fs.existsSync(_configFilePath)
			if(_action === 'init') {
				if(_isExistsConfigFile) {
					dialog.showErrorBox('Error:', '当前目录已经被初始化了')
					return false
				}
			} else {
				// if the `moz.config.js` file is not exists,
				// show the error message
				if(!_isExistsConfigFile) {
					dialog.showErrorBox('Error:', '请先初始化当前目录')
					return false
				}
				// if one of actions are processing，
				// show the error message
				let _actions = _contextInWorkspace.actions,
					_key = ''

				for(_key in _actions) {
					if(_key === _action)
						break
					if(_actions[_key]) {
						dialog.showErrorBox('Error:', '当前项目的已有正在进行中的任务')
						return false
					}
				}
				
			}
			let _target = findItemByPath(_context)
			if(_action === 'init') {
				mask.classList.add('show')
				$('[data-target="confirm"]').onclick = () => {
					let __projectName = $('.prompt-input').value
					if(__projectName.trim()) {
						mask.classList.remove('show')
						$('.prompt-input').value = ''
						$('.mozi-list-progress', _target).classList.add('progress')
						ipcRenderer.send('action', _action, _context , __projectName)
					} else {
						dialog.showErrorBox('Error:', '项目名不能为空')
					}
				}
				$('[data-target="cancel"]').onclick = () => {
					mask.classList.remove('show')
					$('.prompt-input').value = ''
				}
			} else {
				$('.mozi-list-progress', _target).classList.add('progress')
				_contextInWorkspace.actions[_action] = true
				ipcRenderer.send('action', _action, _context /*, _projectName*/)
			}
		}
	})


	ipcRenderer.on('end', (event, action, context) => {
		let _contextInWorkspace = contextInWorkspace(context),
			_actions = _contextInWorkspace.actions,
			_target = findItemByPath(context)
		$('.mozi-list-progress', _target).classList.remove('progress')
		_actions[action] = false
	})

	ipcRenderer.on('error', () => {
		
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

	function contextInWorkspace(ctx) {
		if(!ctx) return false
		let _len = workspace.length,
			_index = -1
		while(++_index < _len) {
			if(workspace[_index]['path'] === ctx) {
				return workspace[_index]
			}
		}
	}

	function findItemByPath(path) {
		let _lists = $$('.mozi-list-item'),
			_len = _lists.length,
			_index = -1
		while(++_index < _len) {
			let __path = _lists[_index].dataset.targetProject
			if(__path === path) {
				return _lists[_index]
			}
		}
	}
