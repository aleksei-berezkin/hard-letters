import { lessonList, parseWord } from './lessonList.mjs'

const idToDescr = new Map()
let wasDuplicates = false
for (const l of lessonList) {
    for (const w of l.words) {
        const {descr, ids} = parseWord(w)
        for (const id of ids) {
            if (idToDescr.has(id)) {
                console.error('Duplicate id=' + id + ' descr1=' + idToDescr.get(id) + ' descr2=' + descr)
                wasDuplicates = true
            }
            else {
                idToDescr.set(id, descr)
            }
        }
    }
}

if (wasDuplicates) throw new Error('Found duplicates')