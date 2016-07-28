;(function() {
	'use strict'
	const electron = require('electron')
	const remote = electron.remote
	const { ipcRenderer } = electron
	const { dialog } = remote

	// element query
	let addFolder = $('.slider-header-plus'),
		init     = $('.init'),
		serve     = $('.serve'),
		build     = $('.build'),
		deploy    = $('.deploy'),
		pack   = $('.pack')

	let workspace = ''

	addFolder.onclick = () => {
		dialog.showOpenDialog({
			properties: ['openDirectory', 'multiSelections']
		}, (opts) => {
			if(!opts) return
			workspace = opts[0]
			localStorage.setItem('workspace', workspace)
			opts.forEach(() => {
				// generate the selected folders
			})
		})
	}

	// deal tasks
	init.onclick = () => {
		ipcRenderer.send('init', workspace)
	}

	build.onclick = () => {
		ipcRenderer.send('build', workspace)
	}

	serve.onclick = () => {
		ipcRenderer.send('serve', workspace)
	}

	deploy.onlick = () => {
		ipcRenderer.send('deploy', workspace)
	}

	pack.onclick = () => {
		ipcRenderer.send('pack', workspace)
	}


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