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

function openProject() {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}, (dir) => {
		if(!dir) return
		let directory = dir[0],
			len = workspace.length,
			index = -1
		while(++index < len) {
			if(directory === workspace[index].path) {
				// 工作区已经处在这个目录
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