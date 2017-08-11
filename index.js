const Promise = require('bluebird')
const chalk = require('chalk')
const figures = require('figures')
const fs = require('fs')
const path = require('path')
const pageSize = 100
const maxPages = 100
const eachLimit = require('async').eachLimit
const mkdirp = require('mkdirp')
const get = Promise.promisify(require('request').get)
const querystring = require('querystring')
const url = require('url')

function SouncloudBackup (opts) {
  const SoundCloud = require('simple-soundcloud')(opts.clientId)
  const user = new SoundCloud.User(opts.user)

  console.info(`creating ${chalk.yellow(opts.output)}`)
  mkdirp.sync(opts.output)

  user.details()
    .then((details) => {
      return getAll('favorites', user)
    })
    .then((favs) => {
      save(opts.output, 'favorites', favs)
      return getAll('tracks', user)
    })
    .then((tracks) => {
      save(opts.output, 'tracks', tracks)
      return getAll('comments', user)
    })
    .then((comments) => {
      // comments aren't interesting without the attached track,
      // so grab this.
      return new Promise((resolve, reject) => {
        eachLimit(comments, 1, (comment, done) => {
          get({
            url: `https://api.soundcloud.com/tracks/${comment.track_id}?client_id=${opts.clientId}`,
            json: true
          })
            .then((response) => {
              const track = response.body
              console.info(`\t${chalk.yellow(figures.tick)} fetched track ${chalk.yellow(track.title)} for comment "${chalk.yellow(comment.body)}"`)
              comment.track = track
              return done()
            })
            .catch((err) => {
              return done(err)
            })
        }, (err, result) => {
          if (err) return reject(err)
          else return resolve(comments)
        })
      })
    })
    .then((comments) => {
      save(opts.output, 'comments', comments)
      return getAll('followings', user)
    })
    .then((following) => {
      save(opts.output, 'followings', following)
      return getAll('followers', user)
    })
    .then((followers) => {
      save(opts.output, 'followers', followers)
      console.info(`finished backing up ${chalk.yellow(opts.user)} \\o/`)
    })
    .catch((err) => {
      console.log(`backup failed err = ${chalk.red(err.message)}`)
    })
}

function getAll (type, user) {
  console.info(`${chalk.yellow(figures.circle)} fetching ${type}`)

  const pages = []
  let hasMore = true
  let cursor = null
  let results = []
  for (var i = 0; i < maxPages; i++) {
    pages.push(i)
  }
  return new Promise((resolve, reject) => {
    eachLimit(pages, 1, (page, done) => {
      if (!hasMore) return done()
      const opts = {
        limit: pageSize,
        offset: page * pageSize
      }
      if (cursor) {
        opts.offset = 0
        opts.cursor = cursor
      }

      user.getUserInfo(type, opts).then((objs) => {
        if (objs.length === 0) {
          hasMore = false
          return done()
        }
        if (objs.next_href === null) {
          hasMore = false
        }
        if (objs.next_href) {
          const parsed = url.parse(objs.next_href)
          const params = querystring.parse(parsed.query)
          cursor = params.cursor
        }
        console.info(`\t${chalk.yellow(figures.tick)} fetching limit = ${pageSize} offset = ${opts.offset} cursor = ${opts.cursor ? opts.cursor : 'nil'}`)
        results = results.concat(objs)
        return done()
      }).catch((err) => {
        if (err) return done(err)
      })
    }, (err, done) => {
      if (err) return reject(err)
      else {
        if (results[0].collection) {
          const results2 = []
          results.forEach((result) => {
            result.collection.forEach((obj) => {
              results2.push(obj)
            })
          })
          return resolve(results2)
        } else {
          return resolve(results)
        }
      }
    })
  })
}

function save (output, type, items) {
  console.info(`${chalk.green(figures.tick)} writing ${items.length} ${type} to disk\n`)
  fs.writeFileSync(path.resolve(output, `./${type}.json`), JSON.stringify(items, null, 2), 'utf8')
}

module.exports = SouncloudBackup
