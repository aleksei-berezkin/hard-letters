import { lessonList, parseWord } from './public/lessonList.mjs'
import fs from 'fs'
import { Buffer } from 'buffer'
import { delay } from './public/util.mjs'


const requiredIds = getRequiredIds()
const existingSmallIds = getExistingIds('small')
const existingLargeIds = getExistingIds('large')
const existingInfoIds = getExistingInfoIds()

const smallIdsToRemove = subtract(existingSmallIds, requiredIds)
const largeIdsToRemove = subtract(existingLargeIds, requiredIds)
const infosToRemove = subtract(existingInfoIds, requiredIds)

console.log(`To remove: ${smallIdsToRemove.size} 'small', ${largeIdsToRemove.size} 'large', ${infosToRemove.size} 'info'`)
removeFiles('small', 'jpg', smallIdsToRemove)
removeFiles('large', 'jpg', largeIdsToRemove)
removeFiles('info', 'mjs', infosToRemove)
console.log('Done remove')

const smallIdsToDownload = subtract(requiredIds, existingSmallIds)
const largeIdsToDownload = subtract(requiredIds, existingLargeIds)
const infosToDownload = subtract(requiredIds, existingInfoIds)

console.log(`To download: ${smallIdsToDownload.size} 'small', ${largeIdsToDownload.size} 'large', ${infosToDownload.size} 'info'`)

const promises = new Set()
const maxPromises = 3

for (const id of union(smallIdsToDownload, largeIdsToDownload, infosToDownload)) {
    while (promises.size >= maxPromises) {
        await Promise.race(promises)
    }

    const promise = (async function() {
        console.log('Loading ' + id)
        const {webformatURL, largeImageURL, user, pageURL} = await getPixabayPhoto(id)
        if (smallIdsToDownload.has(id)) {
            await download(webformatURL.replace('_640', '_180'), `pics/small/${id}.jpg`)
        }
        if (largeIdsToDownload.has(id)) {
            await download(largeImageURL, `pics/large/${id}.jpg`)
        }
        if (infosToDownload.has(id)) {
            writeInfo(id, user, pageURL)
        }
        promises.delete(promise)
    })()
    promises.add(promise)
}

while (promises.size) {
    await Promise.all(promises)
}

console.log('All done')

// *** util ***

function getRequiredIds() {
    return new Set(
        lessonList
            .flatMap(l => 
                l.words.flatMap(w => parseWord(w).ids)
            )
    )
}

function getExistingIds(size) {
    return new Set(
        fs.readdirSync(`pics/${size}`)
            .map(n => Number(/(\w+)\.jpg/.exec(n)[1]))
    )
}

function getExistingInfoIds() {
    return new Set(
        fs.readdirSync(`pics/info`)
            .map(n => Number(/(\w+)\.mjs/.exec(n)[1]))
    )
}

function removeFiles(dir, ext, ids) {
    for (const id of ids) {
        fs.rmSync(`pics/${dir}/${id}.${ext}`)
    }
}

function subtract(setA, setB) {
    const result = new Set()
    for (const a of setA) {
        if (!setB.has(a)) result.add(a)
    }
    return result
}

function union(...sets) {
    const result = new Set()
    for (const set of sets) {
        for (const i of set) {
            result.add(i)
        }
    }
    return result
}

async function getPixabayPhoto(id) {
    const j = await (await fetch(`https://pixabay.com/api/?key=44310474-bd3c2d1e29e617c54c09f0b06&id=${id}`)).json()
    if (j.hits) {
        const {webformatURL, largeImageURL, user, pageURL} = j.hits[0]
        return {webformatURL, largeImageURL, user, pageURL}
    }
    if (j.detail) {
        const m = /in (\d+) second/.exec(j.detail)
        if (m) {
            const retryIn = Number(m[1]) + 1
            console.log(`Request throttled by server, retry in ${retryIn} s`)
            await delay(1000 * retryIn)
            return await getPixabayPhoto(id)
        }
    }
    throw new Error(`Bad response: ${JSON.stringify(j)}`)
}

async function download(url, path) {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    fs.writeFileSync(path, buf)
    console.log(`Downloaded ${path}`)
}

async function writeInfo(id, user, pageURL) {
    const path = `pics/info/${id}.mjs`
    fs.writeFileSync(
        path,
        `export const user = '${user}'\n` +
        `export const pageURL = '${pageURL}'\n`
    )
    console.log(`Wrote info ${path}`)
}
