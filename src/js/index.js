;(function() {
	'use strict'
	const electron = require('electron')
	const path = require('path')
	const remote = electron.remote
	const { ipcRenderer } = electron
	const { dialog } = remote

	// element query
	let JAddFolder  = $('#J-add-folder'),
		JSliderList = $('#J-slider-list'),
		init        = $('.init'),
		serve       = $('.serve'),
		build       = $('.build'),
		deploy      = $('.deploy'),
		pack        = $('.pack')

	// html template
	let projectTmpl = $('#project-tmpl')

	//global variables
	let workspace = null,
		current = ''
	;(() => {
		workspace = localStorage.getItem('workspace')
		if(!workspace) { 
			workspace = []
		} else {
			workspace = JSON.parse(workspace)
			current = workspace[0].path
			generateProjectItem(workspace)
		}
	})()

	function generateProjectItem(value) {
		if(typeof value === 'object') {
			let len = value.length,
				i = -1
			while(++i < len) {
				toDom(value[i])
			}
		}
		// transform html string to html dom structure
		function toDom(data) {
			let tmpl = projectTmpl.innerHTML,
				html = ''
			html = tmpl.replace(/\{projectName\}/g, data.name)
					   .replace(/\{projectPath\}/g, data.path)
			const parser = new DOMParser(),
				  context = parser.parseFromString(html, 'text/html'),
				  targetEle = $('.slider-list-item', context)

			JSliderList.insertBefore(targetEle, JSliderList.firstChild)
		}
	}

	// add project to container
	JAddFolder.onclick = () => {
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, (opts) => {
			if(!opts) return
			current = opts[0]
			let a = current.split(path.sep),
			    o = {
					  name: a[a.length - 1],
					  path: current
				  }
			workspace.unshift(o)
			localStorage.setItem('workspace', JSON.stringify(workspace))
			generateProjectItem(workspace)
		})
	}
	JSliderList.onclick = (e) => {
		e.preventDefault()
		e.stopPropagation()
		let target = e.target,
			action = target.dataset.action
		if(!action) return

		ipcRenderer.send(action, current)
	}

	// util functions
	function $(selector , ctx) {
		if(!ctx) ctx = document
		return ctx.querySelector(selector)
	}

	function $$(selector) {
		if(!ctx) ctx = document
		return slice(ctx.querySelectorAll(selector))
	}

	function slice(eles) {
		return Array.prototype.slice.call(eles);
	}

})();