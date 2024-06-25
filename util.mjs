export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

const apiKey = '44310474-bd3c2d1e29e617c54c09f0b06'
const apiBase = 'https://pixabay.com/api/'

export async function getPhoto(id) {
    const res = await fetch(`${apiBase}?key=${apiKey}&id=${id}`)
    const j = await res.json()
    return j['hits'][0]
}
