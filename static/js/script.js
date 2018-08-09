import BSXml from "https://static.ihint.me/BSXml.js"
import BSFetch from "https://static.ihint.me/BSFetch.js"

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

BSXml.start(['loading'])

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
					const md = $('#content').getAttribute('url')
					const md_link = `articles/${md}.md`
					BSFetch.get(md_link, {
						restype: 'text'
					}).then(md => {
						$('#content').innerHTML = marked(md)
						new Array().forEach.call($$('pre code'), code => {
							hljs.highlightBlock(code)
						})
					})
					$('#loading').remove()
					const banner_link = $('#banner').getAttribute('url')
					BSFetch.get(banner_link, {
						restype: 'blob'
					}).then(img => {
						const reader = new FileReader();
						reader.onload = e => {
							$('#banner').style.backgroundImage = `url('${e.target.result}')`
						}
						reader.readAsDataURL(img);
					})
					const title = $('#title').innerHTML
					document.title = (title ? (title + ' | ') : '') + 'iHint-Pages'
				}
			})
		})
	.catch(
		e => {
			$('#loading').innerHTML = 'fail to load, open console for debugging'
			throw e
		})