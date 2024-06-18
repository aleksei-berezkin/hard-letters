const paramKey = 'hard-letters-param'


export async function initParams() {
    await loadParams()

    document.querySelector('#params-wrapper').addEventListener('change', () => {
        localStorage.setItem(paramKey, JSON.stringify(getParams()))
        setTitles()
    })

    document.querySelector('#reset-default').addEventListener('click', () => {
        localStorage.removeItem(paramKey)
        loadParams()
        document.querySelector('#music-volume').dispatchEvent(new InputEvent('input'))
    })
}

async function loadParams() {
    const params = JSON.parse(localStorage.getItem(paramKey)) ?? getDefaultParams()

    document.querySelector('#slides-delay').value = params.slidesDelay
    document.querySelector('#music-volume').value = params.musicVolume
    const voiceName = document.querySelector('#voice-name')
    voiceName.innerHTML = '';
    (await getVoices()).forEach((v, i) => {
        voiceName.innerHTML += `<option value='${v.voiceURI}'>${v.name}</option>`
        if (params.voiceURI === v.voiceURI || !params.voiceURI && v.default) {
            voiceName.value = params.voiceURI
        }
    })
    document.querySelector('#voice-pitch').value = params.voicePitch
    document.querySelector('#voice-rate').value = params.voiceRate

    setTitles()
}

function getDefaultParams() {
    return {
        slidesDelay: 4500,
        musicVolume: isWin() ? 6 : 13,
        voicePitch: isWin() ? 1.5 : 1,
        voiceRate: isWin() ? .6 : .55,
    }
}

function setTitles() {
    const params = getParams()
    document.querySelector('#slides-delay').title = params.slidesDelay
    document.querySelector('#music-volume').title = params.musicVolume
    document.querySelector('#voice-pitch').title = params.voicePitch
    document.querySelector('#voice-rate').title = params.voiceRate
}

async function getVoices() {
    function doGetVoices() {
        return speechSynthesis.getVoices().filter(v => v.lang === 'ru-RU')
    }

    return new Promise(resolve => {
        const voices = doGetVoices()
        if (voices?.length) resolve(voices)
        
        speechSynthesis.addEventListener('voiceschanged', () => {
            resolve(doGetVoices())
        })
    })
}

function isWin() {
    return navigator.userAgent.toLowerCase().includes('win')
}

export function getParams() {
    return {
        slidesDelay: Number(document.querySelector('#slides-delay').value),
        musicVolume: Number(document.querySelector('#music-volume').value),
        voiceURI: document.querySelector('#voice-name').value,
        voicePitch: Number(document.querySelector('#voice-pitch').value),
        voiceRate: Number(document.querySelector('#voice-rate').value),
    }
}

export function onMusicVolumeInput(cb) {
    document.querySelector('#music-volume').addEventListener('input', e => cb(Number(e.target.value)))
}
