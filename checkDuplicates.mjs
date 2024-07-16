import { lessonList, parseWord } from './public/lessonList.mjs'

const descrToLesson = new Map()
const idToDescr = new Map()

const msg = []
for (const l of lessonList) {
    for (const w of l.words) {
        const {descr, ids} = parseWord(w)

        if (descrToLesson.has(descr)) {
            msg.push(`Duplicate descr: ${descr} lesson1: ${descrToLesson.get(descr)} lesson2: ${l.name}`)
        }
        else {
            descrToLesson.set(descr, l.name)
        }

        for (const id of ids) {
            if (idToDescr.has(id)) {
                msg.push(`Duplicate id: ${id} descr1: ${idToDescr.get(id)} descr2: ${descr}`)
            }
            else {
                idToDescr.set(id, descr)
            }
        }
    }
}

if (msg.length) throw new Error(msg.join('\n'))