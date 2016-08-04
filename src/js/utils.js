// 工具函数
function $(selector , ctx) {
	if(!ctx) ctx = document
	return ctx.querySelector(selector)
}

function $$(selector, ctx) {
	if(!ctx) ctx = document
	return slice(ctx.querySelectorAll(selector))
}
function slice(eles) {
	return Array.prototype.slice.call(eles);
}