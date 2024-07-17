export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

export function decline(count, nom, gen, genP) {
    const rem10 = count % 10
    const rem100 = count % 100
    if (11 <= rem100 && rem100 <= 14 || rem10 === 0 || rem10 >= 5) return genP
    if (rem10 === 1) return nom
    return gen
}

export function delay(timeoutMs) {
    return new Promise(resolve => setTimeout(resolve, timeoutMs))
}

export function getPicUrl(size, id) {
    return window.location.hostname === 'localhost'
        ? `/pics/${size}/${id}.jpg`
        : `https://raw.githubusercontent.com/aleksei-berezkin/hard-letters/main/pics/${size}/${id}.jpg`
}

export async function getInfo(id) {
    // TODO just change to json

    if (window.location.hostname === 'localhost') {
        const path = `/pics/info/${id}.mjs`
        const {user, pageURL} = await import(path)
        return {user, pageURL}
    }

    // Cannot import() because Github responds with a MIME type "text/plain"
    return await (async function() {
        const path = `https://raw.githubusercontent.com/aleksei-berezkin/hard-letters/main/pics/info/${id}.mjs`
        const text = await (await fetch(path)).text()
        eval(text.replace(/export const/g, ''))
        return {user, pageURL}
    })()
}
