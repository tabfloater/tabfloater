
function generateRandomToken() {
    function decimalToTwoCharHex(n) {
        return ('0' + n.toString(16)).substr(-2);
    }

    var randomPool = new Uint8Array(20);
    crypto.getRandomValues(randomPool);
    return Array.from(randomPool, decimalToTwoCharHex).join('');
}
