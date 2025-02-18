// prettier-ignore
const encodedMap = { "3A": ":", "2F": "/", "3F": "?", 23: "#", "5B": "[", "5D": "]", 40: "@", 21: "!", 24: "$", 26: "&", 27: "'", 28: "(", 29: ")", "2A": "*", "2B": "+", "2C": ",", "3B": ";", "3D": "=", 25: "%", 20: " ", 22: '"', "2D": "-", "2E": ".", 30: "0", 31: "1", 32: "2", 33: "3", 34: "4", 35: "5", 36: "6", 37: "7", 38: "8", 39: "9", 41: "A", 42: "B", 43: "C", 44: "D", 45: "E", 46: "F", 47: "G", 48: "H", 49: "I", "4A": "J", "4B": "K", "4C": "L", "4D": "M", "4E": "N", "4F": "O", 50: "P", 51: "Q", 52: "R", 53: "S", 54: "T", 55: "U", 56: "V", 57: "W", 58: "X", 59: "Y", "5A": "Z", 61: "a", 62: "b", 63: "c", 64: "d", 65: "e", 66: "f", 67: "g", 68: "h", 69: "i", "6A": "j", "6B": "k", "6C": "l", "6D": "m", "6E": "n", "6F": "o", 70: "p", 71: "q", 72: "r", 73: "s", 74: "t", 75: "u", 76: "v", 77: "w", 78: "x", 79: "y", "7A": "z", "5E": "^", "5F": "_", 60: "`", "7B": "{", "7C": "|", "7D": "}", "7E": "~", }; // prettier-ignore

function fastDecode(string) {
  let result = "";
  let lastIndex = 0;
  let index = string.indexOf("%");

  while (index !== -1) {
    result += string.substring(lastIndex, index);
    const hexVal = string.substring(index + 1, index + 3);
    result += encodedMap[hexVal] || "%" + hexVal;
    lastIndex = index + 3;
    index = string.indexOf("%", lastIndex);
  }

  return result + string.substring(lastIndex);
}

const crypto = require("crypto");

/**
 * Generates a robust and unique ID.
 * @returns {string} A unique ID string.
 */
function generateUniqueId() {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now().toString();

  // Generate a random number and convert it to a hexadecimal string
  const randomNum = Math.floor(Math.random() * 1000000).toString(16);

  // Generate a cryptographic hash (SHA-256) of the timestamp and random number
  const hash = crypto.createHash("sha256");
  hash.update(timestamp + randomNum);
  const hashHex = hash.digest("hex");

  // Combine the timestamp, random number, and hash to create a unique ID
  const uniqueId = `${timestamp}-${randomNum}-${hashHex.substring(0, 16)}`;
  console.log("uniqueId", uniqueId);
  return uniqueId;
}

module.exports = {
  fastDecode,
  generateUniqueId,
};
