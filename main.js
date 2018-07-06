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
  folder: path.join(__dirname, 'build'),
  targets: [
    { set: 'apple', size: 16 },
    { set: 'google', size: 16 },
    { set: 'twitter', size: 16 },
    { set: 'facebook', size: 16 },
    { set: 'apple', size: 32 },
    { set: 'google', size: 32 },
    { set: 'twitter', size: 32 },
    { set: 'facebook', size: 32 },
  ],
}

/**
 * Source Configuration.
 */
const sourceConfiguration = {
  getPathForTarget: target => path.join(__dirname, 'node_modules/emoji-datasource/img', target, 'sheets/32.png'),
  emojiSize: 32,
  emojiPadding: 1,
  spritesheetCache: { }
}



// Get all emojis with name.
const emojis = emojiData.filter(emoji => emoji.name !== null)

// Group emojis by category.
const categorizedEmojis = Array.from(new Set(emojis.map(emoji => emoji.category)))
  .map(category => ({ name: category, emojis: emojis.filter(emoji => emoji.category === category) }))

// Create build directory if it doesn't exist.
if (!fs.existsSync(targetConfiguration.folder)) fs.mkdirSync(targetConfiguration.folder)



// Process each target.
targetConfiguration.targets.forEach(target => {

  // Create target path (where the finished emojis will be saved).
  const targetPath = path.join(targetConfiguration.folder, `${target.set}_${target.size}px`)

  // Delete output directory, if it exists.
  lib.deleteDirRecursive(targetPath)

  // Create target build directory.
  fs.mkdirSync(targetPath)

  // Load spritesheet for current target (if it hasn't been loeaded before) and cache it.
  if (!sourceConfiguration.spritesheetCache[target.set])
    sourceConfiguration.spritesheetCache[target.set] = sharp(sourceConfiguration.getPathForTarget(target.set))

  // Get spritesheet for current target.
  const spritesheet = sourceConfiguration.spritesheetCache[target.set]

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
        .resize(target.size)
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
    fs.writeFile(path.join(targetPath, category.name, 'palette.xml'), xmlString, err => console.log('XML: ', err || '✓'))
  })
})

