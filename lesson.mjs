import { lessonList } from './lessonList.mjs';
import { getParams, onMusicVolumeInput } from './params.mjs';

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

    const words = lessonList[lessonId].words
    shuffleArray(words);
    shuffleArray(animations);
    for (let i = 0; i < words.length; i++){
        const picIds = words[i].filter(w => typeof w === 'number')
        const picId = picIds[Math.floor(Math.random() * picIds.length)]
        const [picDesc, picDescSpoken] = words[i].filter(w => typeof w === 'string');
        const animation = animations[i % animations.length]

        const res = await fetch(`${apiBase}?key=${apiKey}&id=${picId}`)
        const j = await res.json()
        const photoObj = j['hits'][0]
        const imgUrl = photoObj['largeImageURL']
        mainImg.src = imgUrl

        await new Promise(resolve => mainImg.onload = resolve)

        document.querySelector('#loading-spinner')?.remove()
        pausePossible = true

        mainImg.className = animation + (animation.startsWith('slide') && Math.random() < .5 ? ' reverse-animation' : '');
        document.body.style.backgroundImage = `url(${imgUrl})`
        descOverlay.innerHTML = picDesc

        const userName = photoObj['user']
        const userLink = `https://pixabay.com/users/${userName}`
        attribution.innerHTML = `Фото <a href='${userLink}' target='_blank'>${userName}</a> на <a href='${photoObj['pageURL']}' target='_blank'>Pixabay</a>`

        const toSpeak = picDescSpoken ?? picDesc
        speak(toSpeak)


        await delayBetweenSlides(toSpeak.split(/[- ]/).length)
        await delayUntilPauseEnd()
    }

    speak('Молодец')
    descOverlay.innerHTML = '👍'
}

let pausePossible = false

let paused = false
let pauseEndPromise = Promise.resolve()
let pauseEndResolveFunc = undefined
let pauseEndedMs = undefined
let musicWasPlaying = undefined

export async function togglePause() {
    if (!pausePossible) return

    const playOverlay = document.querySelector('#play-overlay')
    const pauseOverlay = document.querySelector('#pause-overlay')

    if (paused) {
        paused = false
        pauseEndPromise = Promise.resolve()
        pauseEndResolveFunc()
        pauseEndedMs = Date.now()
        mainImg.style.animationPlayState = 'running'
        if (musicWasPlaying) getSCWidget()?.play()

        playOverlay.classList.remove('display-none')
        pauseOverlay.classList.add('display-none')
    } else {
        paused = true
        pauseEndPromise = new Promise(resolve => pauseEndResolveFunc = resolve)
        pauseEndedMs = undefined
        mainImg.style.animationPlayState = 'paused'
        getSCWidget()?.isPaused(p => {
            musicWasPlaying = !p
            if (!p) getSCWidget().pause()
        })

        playOverlay.classList.add('display-none')
        pauseOverlay.classList.remove('display-none')
    }


    setTimeout(function() {
        // Widged likes to steal the focus
        if (getSCiframe()?.contains(document.activeElement)) {
            document.body.focus()
        }
    }, 300)
}

async function delayUntilPauseEnd() {
    await pauseEndPromise

    const passedSincePauseEnd = Date.now() - pauseEndedMs
    const minIntervalAfterPauseEnd = 1000
    if (pauseEndedMs && passedSincePauseEnd < minIntervalAfterPauseEnd) {
        await delay(minIntervalAfterPauseEnd - passedSincePauseEnd)
    }
}

function playMusic() {
    const widget = getSCWidget()
    if (!widget) return

    const doNotSeekToLastTracks = 3
    widget.bind(SC.Widget.Events.READY, async function() {
        await delay(500)

        widget.getSounds(async sounds => {
            widget.setVolume(getParams().musicVolume)
            onMusicVolumeInput(volume => widget.setVolume(volume))

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
    const iframe = getSCiframe()
    if (!iframe) return undefined

    return SC.Widget(iframe)
}

function getSCiframe() {
    return document.querySelector('#sound-cloud-iframe')
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
    msg.pitch = getParams().voicePitch
    msg.rate = getParams().voiceRate
    msg.voice = speechSynthesis.getVoices().filter(v => v.lang === 'ru-RU' && v.voiceURI === getParams().voiceURI)[0]
    msg.volume = 1
    window.speechSynthesis.speak(msg);
}

async function delayBetweenSlides(wordsCount) {
    const startedAt = Date.now()

    for ( ; ; ) {
        const baseDelay = getParams().slidesDelay
        const perWordDelay = Math.min(1000, baseDelay / 4)

        const endAt = startedAt + baseDelay + wordsCount * perWordDelay
        const remaining = endAt - Date.now()
        if (remaining <= 0) break

        await delay(Math.min(remaining, 200))
    }
}
