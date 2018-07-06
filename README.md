Notes Sametime Emojis
=====================

Since Sametime doesn't have full support for UTF-8 emojis and only ships with a very "basic" emoticon palette, I
decided to create one myself.

Currently these emoji sets are supported:

- Apple
- Google
- Twitter
- Facebook

If you miss your favourite set, feel free to submit a pull request and add the ones you like.


Installation
------------

To download the emoji palette, just head to the releases section and download the set you want to use.

Installation is pretty straight forward. Just follow these steps:

1. Extract the archive you've downloaded somewhere where you can find it again. In it, you'll find more ZIPs.
   I've split up the whole set into multiple smaller palettes grouped by category to make it more useable inside
   Notes since there are a lot of single images (one for each emoji) and Notes apperently can't handle that...
2. Open IBM Notes and head to _File → Preferences_.
3. Go to the section _Sametime → Emoticon Palette_.
4. Create a new palette for each ZIP inside the archive you've downloaded, click _Import_ and select the corresponding
   ZIP file.
5. Enjoy! 🎉


Build it yourself
-----------------

If you want to have the emojis in a specific size (currently you can download only a 16px and 32px variant) you can
build the palettes yourself. All you need is a standard Node.JS environment. Just clone the repository, edit the
`main.js` file and modify `targetConfiguration.targets` to your likings.

``` js
// Target Configuration.
const targetConfiguration = {
  folder: path.join(__dirname, 'build'),
  targets: [
    // Specify the targets to build here!
  ],
}
```

Each target object contains of the following two values. You can adjust the size however you like (keep in mind that
the original images are 32x32 in size, so choosing something bigger than that worsens the  quality of the resulting
images).

``` js
{
  set: 'apple|google|twitter|facebook',
  size: 32,
}
```

To build all targets, just run the following command:

``` bash
$ npm run-script build
```


Contribute
----------

If you haven't noticed already, the code is far from perfect and everything but optimized. Since this was just a quick
project I haven't put too much attention to that. If you'd like to help with this, feel free to submit a pull request.


------------------------------------------------------------------------------------------------------------------------

Copyright (C) Nils Weber // Licensed under MIT

