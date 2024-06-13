import { lessons } from './lessons.mjs';

const animations = [
    'enlarge-animation',
    'reduce-animation',
    'slide-1-animation',
    'slide-2-animation',
]

const apiKey = '44310474-bd3c2d1e29e617c54c09f0b06'
const apiBase = 'https://pixabay.com/api/'

const mainImg = document.getElementById('main-img')
const descOverlay = document.getElementById('description-overlay')
const attribution = document.querySelector('#attribution')

export async function runLesson(lessonId) {
    playMusic()

    const lesson = lessons[lessonId]
    shuffleArray(lesson);
    shuffleArray(animations);
    for (let i = 0; i < lesson.length; i++){
        const [picId, picDesc, picDescSpoken] = lesson[i];
        const animation = animations[i % animations.length]

        const res = await fetch(`${apiBase}?key=${apiKey}&id=${picId}`)
        const j = await res.json()
        const photoObj = j['hits'][0]
        const imgUrl = photoObj['largeImageURL']
        mainImg.src = imgUrl

        await new Promise(resolve => mainImg.onload = resolve)
        mainImg.className = animation + (animation.startsWith('slide') && Math.random() < .5 ? ' reverse-animation' : '');
        document.body.style.backgroundImage = `url(${imgUrl})`
        descOverlay.innerHTML = picDesc

        const userName = photoObj['user']
        const userLink = `https://pixabay.com/users/${userName}`
        attribution.innerHTML = `Photo by <a href='${userLink}' target='_blank'>${userName}</a> on <a href='${photoObj['pageURL']}' target='_blank'>Pixabay</a>`

        const toSpeak = picDescSpoken ?? picDesc
        speak(toSpeak)

        const wordsCount = toSpeak.split(/[- ]/).length
        await delay(4500 + wordsCount * 1000)

        await pauseEndPromise

        const passedSincePauseEnd = Date.now() - pauseEndedMs
        const minIntervalAfterPauseEnd = 1000
        if (pauseEndedMs && passedSincePauseEnd < minIntervalAfterPauseEnd) {
            await delay(minIntervalAfterPauseEnd - passedSincePauseEnd)
        }
    }

    speak('Молодец')
    descOverlay.innerHTML = '👍'
}

let paused = false
let pauseEndPromise = Promise.resolve()
let pauseEndResolveFunc = undefined
let pauseEndedMs = undefined

export function togglePause() {
    const playOverlay = document.querySelector('#play-overlay')
    const pauseOverlay = document.querySelector('#pause-overlay')

    if (paused) {
        paused = false
        pauseEndPromise = Promise.resolve()
        pauseEndResolveFunc()
        pauseEndedMs = Date.now()
        mainImg.style.animationPlayState = 'running'
        getSCWidget().play()

        playOverlay.style.display = 'block'
        pauseOverlay.style.removeProperty('display')
    } else {
        paused = true
        pauseEndPromise = new Promise(resolve => pauseEndResolveFunc = resolve)
        pauseEndedMs = undefined
        mainImg.style.animationPlayState = 'paused'
        getSCWidget().pause()

        playOverlay.style.removeProperty('display')
        pauseOverlay.style.display = 'block'
    }
}

function playMusic() {
    const widget = getSCWidget()
    const doNotSeekToLastTracks = 3
    widget.bind(SC.Widget.Events.READY, async function() {
        await delay(500)

        widget.getSounds(async sounds => {
            widget.setVolume(isWin() ? 10 : 13)
            if (sounds.length > doNotSeekToLastTracks) {
                widget.skip(Math.floor(Math.random() * (sounds.length - doNotSeekToLastTracks)))
            }

            // The widget can randomly fail on start
            let playing = false
            while (!playing) {
                widget.isPaused(paused => {
                    if (paused) {
                        widget.play()
                    }
                    else {
                        playing = true
                    }
                })
                await delay(500)
            }
        })
    });
}

function getSCWidget() {
    return SC.Widget('sound-cloud-iframe')
}

function delay(timeoutMs) {
    return new Promise(resolve => setTimeout(resolve, timeoutMs))
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'ru-RU'
    msg.pitch = isWin() ? 1.1 : 1
    msg.rate = isWin() ? .85 : .55
    msg.volume = 1
    window.speechSynthesis.speak(msg);
}

function isWin() {
    return navigator.userAgent.toLowerCase().includes('win')
}
