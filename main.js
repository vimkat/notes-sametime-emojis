//
// Notes Sametime Emojis
// main.js
//
// (C) Nils Weber | nilsweb
// Code licensed under MIT
//


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const fs = require('fs')
const path = require('path')

const sharp = require('sharp')
const xml = require('xml')
const emojiData = require('emoji-datasource')
const archiver = require('archiver')

const lib = require('./lib')


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Target Configuration.
const targetConfiguration = {
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

// Source Configuration.
const sourceConfiguration = {
  getPathForTarget: target => path.join(__dirname, 'node_modules/emoji-datasource/img', target, 'sheets/32.png'),
  emojiSize: 32,
  emojiPadding: 1,
  spritesheetCache: { }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Get all emojis with name.
const emojis = emojiData.filter(emoji => emoji.name !== null && emoji.category !== 'Skin Tones')

// Group emojis by category.
const categorizedEmojis = Array.from(new Set(emojis.map(emoji => emoji.category)))
  .map(category => ({ name: category, emojis: emojis.filter(emoji => emoji.category === category) }))
  .map(category => {
    const skinVariations = category.emojis
      .filter(emoji => emoji.skin_variations)
      .map(emoji => Object.values(emoji.skin_variations).map(skinVariation => ({ ...skinVariation, category: category.name, name: emoji.name })))
      .reduce((acc, current) => acc.concat(current), [])
    category.emojis.push(...skinVariations)
    return category
  })

// Create build directory if it doesn't exist.
if (!fs.existsSync(targetConfiguration.folder)) fs.mkdirSync(targetConfiguration.folder)


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
  categorizedEmojis.forEach(async (category) => {

    // Create target archive and write stream.
    const categoryArchive = archiver('zip')
    categoryArchive.pipe(fs.createWriteStream(path.join(targetPath, `${category.name}.zip`)))

    // Process all emojis in this category.
    const emojiBufferPromises = category.emojis.map(async (emoji) => {

      // Calcualte the actual size per emoji (relative to the entire spritesheet).
      const emojiOffset = sourceConfiguration.emojiSize + (sourceConfiguration.emojiPadding * 2)

      // Get the image buffer for the current emoji.
      const buffer = await spritesheet
        .clone()
        .extract({
          left: emoji.sheet_x * emojiOffset + sourceConfiguration.emojiPadding,
          top: emoji.sheet_y * emojiOffset + sourceConfiguration.emojiPadding,
          width: sourceConfiguration.emojiSize,
          height: sourceConfiguration.emojiSize,
        })
        .resize(target.size)
        .png()
        .toBuffer()

      return { name: emoji.image, buffer }
    })

    // Add all emoji buffers to the archive.
    const emojiBuffers = await Promise.all(emojiBufferPromises)
    emojiBuffers.forEach(({ buffer, name }) => categoryArchive.append(buffer, { name }))

    // Generate XML files for palettes.
    const xmlObject = {}
    xmlObject.palette = category.emojis.map(emoji => ({
      item: [
        { name: { _cdata: emoji.name } },
        { imgfile: emoji.image },
        { imgWidth: target.size },
        { imgHeight: target.size },
        { alttext: { _cdata: emoji.name } },
        { keyboard: emoji.short_name ? { _cdata: `:${emoji.short_name}:` } : undefined },
      ]
    }))

    // Generate XML string and apoend it to the archive.
    const xmlString = xml(xmlObject, { declaration: true })
    categoryArchive.append(xmlString, { name: 'palette.xml' })

    // FInalize the archive
    categoryArchive.finalize()
  })
})


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

