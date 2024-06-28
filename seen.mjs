export function getUnseenAndMarkAsSeen(photoIds) {
    const unseenIds = getUnseen(photoIds)
    if (!unseenIds.length) {
        deleteSeen(photoIds)
    }

    const unseen2 = getUnseen(photoIds)
    const picId = unseen2[Math.floor(Math.random() * unseen2.length)]
    seen(picId)
    return picId
}

function getUnseen(photoIds) {
    return photoIds.filter(id => !localStorage.getItem(getKey(id)))
}

function deleteSeen(photoIds) {
    photoIds.forEach(id => localStorage.removeItem(getKey(id)))
}

function seen(photoId) {
    localStorage.setItem(getKey(photoId), 'true')
}

function getKey(id) {
    return `hard-letters-seen-${id}`
}
