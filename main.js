const fs = require('fs')
const sharp = require('sharp')
const xml = require('xml')
const emojiData = require('emoji-datasource')



/**
 * Target Configuration.
 */
const targetConfiguration = {
  emojiSet: 'twitter',
  emojiSize: 16,
  folder: 'build',
}

/**
 * Source Configuration.
 */
const sourceConfiguration = {
  spritesheet: `${__dirname}/node_modules/emoji-datasource/img/${targetConfiguration.emojiSet}/sheets/32.png`,
  emojiSize: 32,
  emojiPadding: 1,
}


const spritesheet = sharp(sourceConfiguration.spritesheet)
const emojis = emojiData.filter(emoji => emoji.name !== null)


/**
 * Generate individual Emoji images.
 */
emojis.forEach(emoji => {
  const emojiOffset = sourceConfiguration.emojiSize + (sourceConfiguration.emojiPadding * 2)

  spritesheet
    .extract({
      left: emoji.sheet_x * emojiOffset + sourceConfiguration.emojiPadding,
      top: emoji.sheet_y * emojiOffset + sourceConfiguration.emojiPadding,
      width: sourceConfiguration.emojiSize,
      height: sourceConfiguration.emojiSize,
    })
    .resize(targetConfiguration.emojiSize)
    .toFile(`${targetConfiguration.folder}/${emoji.image}`)
    .then(() => console.log('Written Emoji ' + emoji.name))
    .catch(() => console.log('Failed Emoji ' + emoji.name))
})


/**
 * Generate XML object.
 */
const xmlObject = {}
xmlObject.palette = emojis.map(emoji => ({
  item: [
    { name: { _cdata: emoji.name } },
    { imgfile: emoji.image },
    { imgWidth: targetConfiguration.emojiSize },
    { imgHeight: targetConfiguration.emojiSize },
    { alttext: { _cdata: emoji.name } },
    { keyboard: emoji.short_name ? { _cdata: `:${emoji.short_name}:` } : undefined },
  ]
}))


/**
 * Generate XML string and save it to disk.
 */
const xmlString = xml(xmlObject, { declaration: true })
fs.writeFile(`${__dirname}/${targetConfiguration.folder}/palette.xml`, xmlString, err => console.log('XML:', err))

