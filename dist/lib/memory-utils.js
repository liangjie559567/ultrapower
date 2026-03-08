/**
 * Memory optimization utilities
 */
export function clearBuffer(_buffer) {
    return '';
}
export function limitArray(arr, max) {
    return arr.length > max ? arr.slice(0, max) : arr;
}
export function pruneMap(map, maxSize) {
    if (map.size <= maxSize)
        return;
    const toDelete = map.size - maxSize;
    let count = 0;
    for (const key of map.keys()) {
        if (count++ >= toDelete)
            break;
        map.delete(key);
    }
}
//# sourceMappingURL=memory-utils.js.map