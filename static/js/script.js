import BSXml from "https://static.ihint.me/BSXml.js"
import BSFetch from "https://static.ihint.me/BSFetch.js"

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

BSXml.start(['loading', 'footer'])

const json = location.search.slice(1)
const article_url = `articles/${json}.json`
BSFetch.get(article_url)
	.then(
		article => {
			BSXml.start(['article'], {
				dataset: {
					article
				},
				next() {
					$('#loading').remove()
					const md = $('#content').getAttribute('url')
					const md_link = `articles/${md}.md`
					BSFetch.get(md_link, {
						restype: 'text'
					}).then(
						md => {
							$('#content').innerHTML = marked(md)
							new Array().forEach.call(
								$$('img'),
								image => {
									image.addEventListener(
										'click', () => {
											window.open(image.getAttribute('src'))
										}
									)
								}
							)
							new Array().forEach.call(
								$$('pre code'),
								code => {
									hljs.highlightBlock(code)
								}
							)
							const title = $('#title').innerHTML
							document.title = `${title} | iHint`
						}).catch(
						e => {
							throw e
						}
					)
					const banner_link = $('#header').getAttribute('url')
					if (banner_link) {
						BSFetch.get(banner_link, {
							restype: 'blob'
						}).then(
							img => {
								const reader = new FileReader();
								reader.onload = e => {
									$('#header').style.backgroundImage = `url('${e.target.result}')`
								}
								reader.readAsDataURL(img);
							}).catch(
							e => {
								throw e
							}
						)
					}
				}
			})
		})
	.catch(
		e => {
			$('#loading').innerText = 'fail to load article, open console for debugging'
			throw e
		})