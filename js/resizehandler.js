export function closeKeyboard() {
    const activeElement = document.activeElement;
    const isInputLike = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable') && activeElement.isContentEditable
    );
    if (isInputLike) {
        activeElement.blur();
    }
    return isInputLike;
}