const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const xml = require('xml')
const emojiData = require('emoji-datasource')

const lib = require('./lib')



/**
 * Target Configuration.
 */
const targetConfiguration = {
  emojiSet: 'apple',
  emojiSize: 16,
  folder: path.join(__dirname, 'build')
}

/**
 * Source Configuration.
 */
const sourceConfiguration = {
  spritesheet: path.join(__dirname, 'node_modules/emoji-datasource/img/', targetConfiguration.emojiSet, '/sheets/32.png'),
  emojiSize: 32,
  emojiPadding: 1,
}


const spritesheet = sharp(sourceConfiguration.spritesheet)
const emojis = emojiData.filter(emoji => emoji.name !== null)

const categorizedEmojis = Array.from(new Set(emojis.map(emoji => emoji.category)))
  .map(category => ({ name: category, emojis: emojis.filter(emoji => emoji.category === category) }))

const targetPath = path.join(targetConfiguration.folder, `${targetConfiguration.emojiSet}_${targetConfiguration.emojiSize}px`)

// Delete output directory, if it exists.
lib.deleteDirRecursive(targetPath)

// Create target build directory.
if (!fs.existsSync(targetConfiguration.folder)) fs.mkdirSync(targetConfiguration.folder)
fs.mkdirSync(targetPath)


// Generate individual emoji images.
categorizedEmojis.forEach(category => {

  // Create output folder if it doesn't exist.
  const basePath = path.join(targetPath, category.name)
  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath)

  category.emojis.forEach(emoji => {
    const emojiOffset = sourceConfiguration.emojiSize + (sourceConfiguration.emojiPadding * 2)

    spritesheet
      .clone()
      .extract({
        left: emoji.sheet_x * emojiOffset + sourceConfiguration.emojiPadding,
        top: emoji.sheet_y * emojiOffset + sourceConfiguration.emojiPadding,
        width: sourceConfiguration.emojiSize,
        height: sourceConfiguration.emojiSize,
      })
      .resize(targetConfiguration.emojiSize)
      .toFile(path.join(basePath, emoji.image))
      .then(() => console.log('[✓] ' + emoji.name))
      .catch((err) => console.log('[✗] ' + emoji.name, err))
  })
})


// Generate XML files for palettes.
categorizedEmojis.forEach(category => {
  const xmlObject = {}
  xmlObject.palette = category.emojis.map(emoji => ({
    item: [
      { name: { _cdata: emoji.name } },
      { imgfile: emoji.image },
      { imgWidth: targetConfiguration.emojiSize },
      { imgHeight: targetConfiguration.emojiSize },
      { alttext: { _cdata: emoji.name } },
      { keyboard: emoji.short_name ? { _cdata: `:${emoji.short_name}:` } : undefined },
    ]
  }))


  // Generate XML string and save it to disk.
  const xmlString = xml(xmlObject, { declaration: true })
  fs.writeFile(path.join(targetPath, category.name, 'palette.xml'), xmlString, err => console.log('XML:', err))
})

