const pics = [
    // Transport & machines
    [1534685, 'Кран'],
    [2587571, 'Робот'],
    [2835381, 'Паровоз'],
    [7795790, 'Метро'],
    [1080844, 'Квадрокоптер'],
    [6631117, 'Корабль'],
    [1578528, 'Лайнер'],
    [180746, 'Парусник'],
    [3036620, 'Трамвай'],
    [3392100, 'Автомагистраль'],
    [6961339, 'Пожарная машина'],
    [534577, 'Грузовик'],
    [4655049, 'Вертолёт'],
    [5279460, 'Летающая тарелка'],
    [3871893, 'Трансформер'],
    [7997980, 'Электричество'],
    [7367963, 'Ветряк'],
    [4349830, 'Электростанция'],
    [7116299, 'Аэропорт'],
    [7432680, 'Реактивный самолет'],
    [1271919, 'Гараж'],
    [4558069, 'Небоскрёб'],
    [4628308, 'Парашют'],
    [7385480, 'Дирижабль'],
    [4811563, 'Карусель'],
    // Nature & landscape
    [1453426, 'Гроза'],
    [7224930, 'Шторм'],
    [2080138, 'Горы'],
    [5129717, 'Река'],
    [4047523, 'Радуга'],
    [2641195, 'Коровы'],
    [140589, 'Ферма'],
    [1804481, 'Город'],
    [6278825, 'Озеро'],
    [7660016, 'Остров'],
    // Food
    [2664179, 'Пирог'],
    [5417154, 'Черника'],
    [1932375, 'Мороженое'],
    [286192, 'Торт'],
    [7870491, 'Пирожное'],
    [8442168, 'Орехи'],
    [87385, 'Картошка'],
    [2718477, 'Брецель', 'Брэцель'],
    [685704, 'Огурец'],
    [2282101, 'Помидор'],
    [1972744, 'Сыр'],
    // Art
    [3373844, 'Карандаши'],
    [7917562, 'Рисунок'],
    [911804, 'Краски'],
    [5049980, 'Картина'],
    [1514254, 'Оригами'],
    [1851248, 'Гитара'],
    [4163321, 'Барабан'],
]

const animations = [
    'enlarge-animation',
    'reduce-animation',
    'slide-animation-x',
    'slide-animation-y',
]

const apiKey = '44310474-bd3c2d1e29e617c54c09f0b06'
const apiBase = 'https://pixabay.com/api/'

const mainImg = document.getElementById('main-img')
const descOverlay = document.getElementById('description-overlay')

export async function main() {
    shuffleArray(pics);
    shuffleArray(animations);
    for (let i = 0; i < pics.length; i++){
        const [picId, picDesc, picDescSpoken] = pics[i];
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
        const imgUrl = j['hits'][0]['largeImageURL']
        mainImg.src = imgUrl

        await new Promise(resolve => mainImg.onload = resolve)
        mainImg.dataset.picDesc = picDescSpoken ?? picDesc
        mainImg.className = animation
        document.body.style.backgroundImage = `url(${imgUrl})`
        descOverlay.innerHTML = picDesc

        speak(picDescSpoken ?? picDesc)

        await delay(7000)
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
    const isWin = navigator.userAgent.toLowerCase().includes('win')

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'ru-RU';            // Language
    msg.pitch = isWin ? 1.1 : 1;   // Pitch (0 to 2)
    msg.rate = isWin ? .85 : .55;  // Rate (0.1 to 10)
    msg.volume = 1;                // Volume (0 to 1)
    window.speechSynthesis.speak(msg);
}
