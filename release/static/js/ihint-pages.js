/**
 * iHint-Pages Javascipt
 * @BlueSky
 * Version Alpha, 0.1
 * https://github.com/BlueSky-07/bluesky-07.github.io
 */

import BSXml from "./BSXml-2.2.js"
import BSFetch from "./BSFetch-0.3.js"
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
					)
					const banner_link = $('#header').getAttribute('url')
					if (banner_link) {
						BSFetch.get(banner_link, {
							restype: 'blob'
						}).then(
							img => {
								Page.set_banner(img)
							}
						)
					}
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

		// images
		new Array().forEach.call(
			$$('img'),
			image => {
				// add click to preview event
				image.addEventListener(
					'click', () => {
						window.open(image.getAttribute('src'))
					}
				)

				// modify size
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

		// reach part
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
			$('#header').style.backgroundImage = `url('${e.target.result}')`
		}
		reader.readAsDataURL(blob);
	}
}