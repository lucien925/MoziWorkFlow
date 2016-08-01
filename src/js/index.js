
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
		  mask        = $('.mask'),
		  actions     = $$('.mozi-actions-item > button')

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
			context = localStorage.getItem('context')
			generateProjectItem(workspace)

			let projectItems = $$('.mozi-list-item', JMoziList),
				len = projectItems.length,
				index = -1,
				current = null
			while(++index < len) {
				current = projectItems[index]
				if(current.dataset.targetProject === context) {
					current.classList.add('current')
				}
			}
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
		}, (dir) => {
			if(!dir) return
			let directory = dir[0],
				len = workspace.length,
				index = -1
			while(++index < len) {
				if(directory === workspace[index].path) {

					// show error dialog to user for project already exists
					dialog.showErrorBox('Error:', '当前工作区已经存在该目录!')
					return; 
				}
			}
			let _project = directory,
				_a = _project.split(path.sep),
			    _o = {
					  name: _a[_a.length - 1],
					  path: _project,
					  actions: {
					  	init: false,
					  	serve: false,
					  	build: false,
					  	deploy: false,
					  	pack: false
					  },
					  info: {
					  	inirPid: 0,
					  	servePid: 0,
					  	buildPid: 0,
					  	deployPid: 0,
					  	packagePid: 0
					  }
				}
			generateProjectItem([_o])
			if(workspace.length === 0) {   
				context = _o.path
				$('.mozi-list').firstChild.classList.add('current')
			}
			workspace.push(_o)
			localStorage.setItem('workspace', JSON.stringify(workspace))
		})
	}
	JMoziList.onclick = (e) => {
		e.preventDefault()
		e.stopPropagation()
		let _target = e.target,
			_action = _target.dataset.action,
			_targetParent = walker(_target),
			_path = '', _contextInWorkspace = null
		if(!_targetParent) return
		_path = _targetParent.dataset.targetProject
		_contextInWorkspace = contextInWorkspace(_path)
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
						context = ''
						localStorage.removeItem('workspace')
						localStorage.removeItem('context')
					}
				case 'open':
					// open directory with finder
				case 'info':
				default:
					break;
			}
			return
		} else {
			if(_targetParent.classList.contains('current')) return

			$$('.mozi-list-item', JMoziList).forEach((item, index) => {
				item.classList.remove('current')
			})
			_targetParent.classList.add('current')
			context = _path
			localStorage.setItem('context', context)
			// let _key = '',
			// 	_actions = _contextInWorkspace['actions'],
			// 	_actionButton = null
			// for(_key in _actions) {
			// 	_actionButton = findActionButton(_key)
			// 	if(_actions[_key]) {
			// 		if(!_actionButton.classList.contains('on')) {
			// 			_actionButton.classList.add('on')
			// 		} 
			// 	} else {
			// 		_actionButton.classList.remove('on')
			// 	}
			// }

			// function findActionButton(action) {
			// 	let len = actions.length,
			// 		index = -1
			// 	while(++index < len) {
			// 		if(actions[index].dataset.action === action) {
			// 			return actions[index]
			// 		}
			// 	}
			// }
			let	__actions = _contextInWorkspace.actions,
				__key, __button 

			for(__key in __actions) {
				__button = $('[data-action="'+ __key +'"]')
				if(__actions[__key]) {
					__button.classList.add('progress')
				} else {
					if(__button.classList.contains('progress')) {
						__button.classList.remove('progress')
					}
				}
			}

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
			
			// stop 
			if(_contextInWorkspace.actions[_action]) {
				ipcRenderer.send('stop', _contextInWorkspace.info[_action + 'Pid'])
				return
			}
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
					if(__projectName.trim()) {  // BUG 
						mask.classList.remove('show')
						$('.prompt-input').value = ''
						$('.mozi-list-progress', _target).classList.add('progress')
						ipcRenderer.send('action', _action, _context , __projectName)
						_this.classList.add('progress')
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
				ipcRenderer.send('action', _action, _context)
				ipcRenderer.once('pid', (event, pid) => {
					_contextInWorkspace.info[_action + 'Pid'] = pid
				})
				_this.classList.add('progress')

			}
		}
	})

	// moz task finished
	ipcRenderer.on('end', (event, action, context, pid) => {
		let _contextInWorkspace = contextInWorkspace(context),
			_actions = _contextInWorkspace.actions,
			_target = findItemByPath(context)
		$('.mozi-list-progress', _target).classList.remove('progress')
		_actions[action] = false
		try {
			process.kill(pid)
		} catch(err) {

		}
	})


	ipcRenderer.on('error', (event, err, pid) => {
		dialog.showErrorBox('Error:', err)
		//process.kill(pid)
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
					
	function contextInWorkspace(path) {
		if(!path) return false
		let _len = workspace.length,
			_index = -1
		while(++_index < _len) {
			if(workspace[_index]['path'] === path) {
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
