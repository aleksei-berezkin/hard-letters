import { lessonList, parseWord } from './public/lessonList.mjs'
import fs from 'fs'
import { Buffer } from 'buffer'
import { delay } from './public/util.mjs'


const requiredIds = getRequiredIds()
const existingSmallIds = getExistingIds('small')
const existingLargeIds = getExistingIds('large')

const smallIdsToRemove = subtract(existingSmallIds, requiredIds)
const largeIdsToRemove = subtract(existingLargeIds, requiredIds)

console.log(`To remove: ${smallIdsToRemove.size} 'small' and ${largeIdsToRemove.size} 'large' pics`)
removeFiles('small', smallIdsToRemove)
removeFiles('large', largeIdsToRemove)
console.log('Done remove')

const smallIdsToDownload = subtract(requiredIds, existingSmallIds)
const largeIdsToDownload = subtract(requiredIds, existingLargeIds)

console.log(`To download: ${smallIdsToDownload.size} 'small' and ${largeIdsToDownload.size} 'large' pics`)

const promises = new Set()
const maxPromises = 3

async function queueTask(asyncCb) {
    while (promises.size >= maxPromises) {
        await Promise.race(promises)
    }

    const promise = (async function() {
        await asyncCb()
        promises.delete(promise)
    })()
    promises.add(promise)
}

for (const id of union(smallIdsToDownload, largeIdsToDownload)) {
    queueTask(async function() {
        console.log('Loading ' + id)
        const {webformatURL, largeImageURL} = await getPixabayPhoto(id)
        if (smallIdsToDownload.has(id)) {
            await download(webformatURL.replace('_640', '_180'), `pics/small/${id}.jpg`)
        }
        if (largeIdsToDownload.has(id)) {
            await download(largeImageURL, `pics/large/${id}.jpg`)
        }
    })
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

function removeFiles(size, ids) {
    for (const id of ids) {
        fs.rmSync(`pics/${size}/${id}.jpg`)
    }
}

function subtract(setA, setB) {
    const result = new Set()
    for (const a of setA) {
        if (!setB.has(a)) result.add(a)
    }
    return result
}

function union(setA, setB) {
    const result = new Set()
    for (const a of setA) result.add(a)
    for (const b of setB) result.add(b)
    return result
}

async function getPixabayPhoto(id) {
    const j = await (await fetch(`https://pixabay.com/api/?key=44310474-bd3c2d1e29e617c54c09f0b06&id=${id}`)).json()
    if (j.hits) {
        const {webformatURL, largeImageURL} = j.hits[0]
        return {webformatURL, largeImageURL}
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
