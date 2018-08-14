/**
 * iHint-Pages Javascipt
 * @BlueSky
 * Version Alpha, 0.3
 * https://github.com/BlueSky-07/bluesky-07.github.io
 */

import BSXml from "./BSXml-2.2.js"
import BSFetch from "./BSFetch-1.1.js"
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

if (location.pathname.endsWith('index.html')) {
	location.href = `${location.pathname.slice(0, 0 - ('index.html').length)}${location.search}`
	throw new Error('redirecting ...')
} else if (!location.search) {
	location.href = `?index`
	throw new Error('redirecting to index page')
}

BSXml.start(['loading', 'footer'])

const json = location.search.slice(1)
BSFetch.get(`articles/${json}.json?${new Date().getTime()}`)
	.then(
		article => {
			BSXml.start(['article'], {
				dataset: {
					article
				},
				next() {
					$('#loading').remove()
					BSFetch.get(`articles/${$('#content').getAttribute('url')}.md?${new Date().getTime()}`, {
						restype: 'text'
					}).then(
						md => {
							Page.load(md)
						}
					).catch(e => {
						$('#content').innerHTML = '<center><h2>Oops! Try refresh</h2></center>'
						throw e
					})
					const banner_link = $('#header').getAttribute('url')
					if (banner_link) {
						BSFetch.get(banner_link, {
							restype: 'blob'
						}).then(
							img => {
								// hide image loading process
								Page.set_banner(img)
							}
						).catch(e => {
							throw e
						})
					}
					Animate.init()
				}
			})
		})
	.catch(
		e => {
			$('#loading').innerHTML = 'Page Not Found'
			throw e
		}
	)

class Page {
	static load(md) {
		// set title
		const title = $('#title').innerHTML
		document.title = `${title} | iHint`

		// write md
		$('#content').innerHTML = marked(md)

		// additional actions on the image
		new Array().forEach.call(
			$$('img'),
			image => {
				// add event of click to preview
				image.addEventListener(
					'click', () => {
						window.open(image.getAttribute('src'))
					}
				)

				// modify size
				// support setting the size of a image by the format of:
				//
				//    ![alt ={width}x{height}](url)
				//
				// Example:  ![alt =100x100](url)
				// Note:
				// 1. width and height must be an integer
				// 2. size setting must at the end of [...]
				const size = (image.alt.match(/ =[\d]+x[\d]+$/) || [])[0]
				if (size) {
					image.alt = image.alt.replace(/ =[\d]+x[\d]+$/, '')
					const [width, height] = size.slice(2).split('x')
					image.width = width
					image.height = height
				}
			}
		)

		// highlight code blocks
		new Array().forEach.call(
			$$('pre code'),
			code => {
				hljs.highlightBlock(code)
			}
		)

		// jump to the specified chapter through #?
		if (location.hash) {
			setTimeout(
				() => {
					location.href = location.href
				},
				1000
			);
		}
	}

	static set_banner(blob) {
		const reader = new FileReader();
		reader.onload = e => {
			// hide image loading process
			$('#header').style.backgroundImage = `url('${e.target.result}')`
		}
		reader.readAsDataURL(blob);
	}
}

class Animate {
	static init() {
		Animate.header = $('.header-container')
		Animate.position = window.scrollY === 0 ? 'top' : 'content'
		Animate.positionY = [0, 0]
		Animate.scroll()
		Animate.wheel()
	}

	// when desktop broswer try to get up but already at the top
	// show header
	static wheel() {
		window.addEventListener('wheel', e => {
			if (window.scrollY === 0 && e.deltaY < 0 && Animate.position === 'top') {
				if (header.classList.length === 1) {
					return
				}
				header.classList.remove('header-out')
				header.classList.add('header-in')
				Animate.position = 'top'
			}
		})
	}

	// https://developer.mozilla.org/zh-CN/docs/Web/Events/scroll
	static scroll() {
		Animate.ticking = false
		window.addEventListener('scroll', e => {
			Animate.positionY = [Animate.positionY[1], window.scrollY]
			if (!Animate.ticking) {
				// optimize for page re-rendering
				// https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame
				window.requestAnimationFrame(() => {
					const [from, to] = Animate.positionY
					if (from === 0 && to > from && Animate.position === 'top') {
						// when all platforms scroll down
						// hide header
						header.classList.remove('header-in')
						header.classList.add('header-out')
						Animate.position = 'content'
					} else if (to === 0 && Animate.position === 'content') {
						// when desktop broswer back to the top
						// do nothing
						Animate.position = 'top'
					} else if (to > 0 && from > 0) {
						// when desktop broswer not at the top
						// do nothing
						Animate.position = 'content'
					} else if (from < 0 && to < 0 && Animate.position === 'top') {
						// when mobile safari bounce back from above of the top
						// show header
						header.classList.remove('header-out')
						header.classList.add('header-in')
						Animate.position = 'content'
					}
					Animate.ticking = false
				})
			}
			Animate.ticking = true
		})
	}
}