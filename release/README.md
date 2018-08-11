# iHint-Pages

release 0.1

with support of BSXml, BSFetch

## get your own github.io with iHint-Pages

You can easily build your own blog with **iHint-Pages**, just follow the steps below:

1. get latest release of iHint-Pages from [here](https://github.com/BlueSky-07/bluesky-07.github.io/releases)

2. create a new repository named `your-username.github.io` [here](https://github.com/new)

3. git clone `https://github.com/your-username/your-username.github.io`

4. put all files from `iHint-Pages-latest-release.zip` into the 
directory just cloned

5. change the details of `articles/index.json`, but do not rename it:
```text
{
  "md_link": "index",                                                     // location of index.md, modify it if necessary
  "title": "Index",                                                       // title of the page
  "author": "BlueSky",                                                    // your name
  "release_date": "2018/8/8",                                             // date of publishing index.md
  "update_date": "2018/8/8",                                              // date of last updating index.md
  "version": "8",                                                         // times of modifying index.md
  "banner_link": "https://i.loli.net/2018/08/09/5b6c0db91bba5.jpg",               // url of picture in banner
  "banner_from": "JOHN TOWNER, https://unsplash.com/photos/p-rN-n6Miag",  // information of picture, like origin url, photographer, location etc.
  "keywords": [                                                           // keep [] if do not have keywords
    "ihint.me", "github.com/BlueSky-07"                                   // keywords, format of array
  ] 
}
```
*Note: you have to delete all comments after the comma*

6. use Markdown to write the page of index in `articles/index.json`

## publish a new article

1. copy your `article.md` into `articles/`

2. create a new file named `your-article-filename.json` in `articles/`

3. change the details of `articles/your-article-filename.json`:
```text
{
  "md_link": "your-article-filename",                                     // drop .md extension
  "title": "title",                                                       // title of the article
  "author": "BlueSky",                                                    // your name
  "release_date": "2018/8/8",                                             // date of publishing this article
  "update_date": "2018/8/8",                                              // date of last updating this article
  "version": "8",                                                         // times of modifying this article
  "banner_link": "https://i.loli.net/2018/08/09/5b6c0db91bba5.jpg",               // url of picture in banner
  "banner_from": "JOHN TOWNER, https://unsplash.com/photos/p-rN-n6Miag",  // information of picture, like origin url, photographer, location etc.
  "keywords": [                                                           // keep [] if do not have keywords
    "ihint.me", "github.com/BlueSky-07"                                   // keywords, format of array
  ]
}
```
*Note: you have to delete all comments after the comma*

4. do not forget add a link in `articles/index.md` for readers to access your article