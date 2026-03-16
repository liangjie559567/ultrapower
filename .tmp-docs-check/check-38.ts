// Fast path for already-camelCase non-sensitive input
if (isAlreadyCamelCase(rawObj) && !isSensitive) {
  return normalizeFastPath(rawObj, hookType);
}
