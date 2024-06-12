import { lessons } from './lessons.mjs';

export function playMusic() {
    const widget = SC.Widget('sound-cloud-iframe')
    widget.setVolume(isWin() ? 10 : 13)
    widget.bind(SC.Widget.Events.READY, function() {
        widget.getSounds(sounds => {
            if (sounds.length > 3) {
                widget.skip(Math.floor(Math.random() * sounds.length - 3))
                widget.play()
            }
        })
    });
}

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

export async function runLesson(lessonId) {
    const lesson = lessons[lessonId]
    shuffleArray(lesson);
    shuffleArray(animations);
    for (let i = 0; i < lesson.length; i++){
        const [picId, picDesc, picDescSpoken] = lesson[i];
        const animation = animations[i % animations.length]

        const res = await fetch(
            `${apiBase}?key=${apiKey}&id=${picId}`,
            {
                method: 'GET',
                headers: {
                    // 'Cache-Control': 'max-age=86400'
                }
            }
        )
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
        document.querySelector('#attribution').innerHTML = `Photo by <a href='${userLink}' target='_blank'>${userName}</a> on <a href='${photoObj['pageURL']}' target='_blank'>Pixabay</a>`
        const toSpeak = picDescSpoken ?? picDesc
        speak(toSpeak)

        const wordsCount = toSpeak.split(/[- ]/).length

        await delay(4500 + wordsCount * 1000)
    }

    speak('Молодец')
    descOverlay.innerHTML = '👍'
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
    msg.lang = 'ru-RU';            // Language
    msg.pitch = isWin() ? 1.1 : 1;   // Pitch (0 to 2)
    msg.rate = isWin() ? .85 : .55;  // Rate (0.1 to 10)
    msg.volume = 1;                // Volume (0 to 1)
    window.speechSynthesis.speak(msg);
}

function isWin() {
    return navigator.userAgent.toLowerCase().includes('win')
}
