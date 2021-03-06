# iHint-Pages

`release 0.7`

## get your own github.io with iHint-Pages

You can easily build your own blog with **iHint-Pages**, just follow the steps below:

1. get latest release of iHint-Pages from [here](https://github.com/BlueSky-07/bluesky-07.github.io/releases)

2. create a new repository named `your-username.github.io` [here](https://github.com/new)

3. git clone `https://github.com/your-username/your-username.github.io`

4. put all files from `iHint-Pages-latest-release.zip` into the directory just cloned

5. change the details of `articles/index.json`, but do not rename it:
```text
{
  "md_link": "index",                                                     // location of index.md, modify it if necessary
  "title": "Index",                                                       // title of the page
  "author": "BlueSky",                                                    // your name
  "release_date": "2018/8/8",                                             // date of first posting index.md
  "update_date": "2018/8/8",                                              // date of last updating index.md
  "version": "8",                                                         // times of modifying index.md
  "banner_link": "https://i.loli.net/2018/08/09/5b6c0db91bba5.jpg",       // url of picture in banner
  "banner_from": "JOHN TOWNER, https://unsplash.com/photos/p-rN-n6Miag",  // information of picture, like origin url, photographer, location etc.
  "keywords": [                                                           // keep [] if keywords is none
    "ihint.me", "github.com/BlueSky-07"                                   // keywords, format of array
  ] 
}
```
*Note: you have to delete all comments after the comma*

6. use Markdown to write the page of index in `articles/index.md`

7. `git add .` -> `git commit -m'index'` -> `git push`

## post a new article

1. copy your `article.md` into `articles/`

2. create a new file named `your-article-filename.json` in `articles/`

3. change the details of `articles/your-article-filename.json`:
```text
{
  "md_link": "your-article-filename",                                     // drop .md extension
  "title": "title",                                                       // title of the article
  "author": "BlueSky",                                                    // your name
  "release_date": "2018/8/8",                                             // date of first posting this article
  "update_date": "2018/8/8",                                              // date of last updating this article
  "version": "8",                                                         // times of modifying this article
  "banner_link": "https://i.loli.net/2018/08/09/5b6c0db91bba5.jpg",       // url of picture in banner
  "banner_from": "JOHN TOWNER, https://unsplash.com/photos/p-rN-n6Miag",  // information of picture, like origin url, photographer, location etc.
  "keywords": [                                                           // keep [] if keywords is none
    "ihint.me", "github.com/BlueSky-07"                                   // keywords, format of array
  ]
}
```
*Note: you have to delete all comments after the comma*

4. do not forget add a link in `articles/index.md` for readers to access your article

5. `git add .` -> `git commit -m'a new article'` -> `git push`

## ChangeLog

#### 2018/11/13 v0.7

**CHANGE**
1. remove header animation on Microsoft Edge
1. style modified for better reading experience
1. load raw md for readers with IE 9+
1. add back to top/index button at the end of article

**BUG FIX**
<del>1. Microsoft Edge will keep a empty block on the top when scroll down</del>

----
#### 2018/11/8 v0.6

**CHANGE**
1. set max-width as 1080px

----
#### 2018/10/11 v0.5

**CHANGE**
1. use packed js instead of ES6 module import for better browser compatibility

----
#### 2018/9/21 v0.4

**CHANGE**
1. remove the animation of header on mobile phone

----
#### 2018/8/14 v0.3

**CHANGE**
1. update js lib: BSFetch v1.1

----
#### 2018/8/11 v0.2

**NEW**
1. animation of header's hide/show when scroll
1. `Oops! Try refresh` will be showed when fail to load .md

**CHANGE**
1. header's width set as 90%, margin-top set as 1em when using desktop broswers

**KNOWN BUG**
1. Microsoft Edge will keep a empty block on the top when scroll down

----
#### 2018/8/11 v0.1

**NEW**
1. load config from `.json`, load page from `.md` according to url`?title`
1. responsive UI, support most modern browsers of all platforms, but not support any IE. ANY IE WILL NEVER BE CONSIDERED FOR SUPPORT.
1. support code highlight, use theme of Monokai-Sublime
1. `Page Not Found` will be showed when fail to read `.json`
1. other awesome features can be found after you installing it

**KNOWN BUG**
1. Microsoft Edge will always set the width of `pre` as full but not `max-content`
1. scroll-bar style will only be effective on Chrome and Safari