const crypto = require("crypto")
const querystring = require("querystring")

function randomString() {
	const randomBytes = crypto.randomBytes(20)
	return randomBytes.toString("base64")
}

// A1 = [1, 2, 3]
// A2 = [0]
// checks if A2 is subset of A1
function containsAll(arr1, arr2) {
	const arr1Set = new Set()
	for (let i = 0; i < arr1.length; i++) {
		arr1Set.add(arr1[i])
	}

	for (let i = 0; i < arr2.length; i++) {
		if (!arr1Set.has(arr2[i])) {
			return false
		}
	}
	return true
}

function decodeAuthCredentials(auth) {
	var clientCredentials = Buffer.from(auth.slice("basic ".length), "base64")
		.toString()
		.split(":")
	var clientId = querystring.unescape(clientCredentials[0])
	var clientSecret = querystring.unescape(clientCredentials[1])
	return { clientId, clientSecret }
}

function deleteAllKeys(obj) {
	Object.keys(obj).forEach((k) => {
		delete obj[k]
	})
}

function timeout(req, res, next) {
	res.setTimeout(400, function () {
		res.status(408).end()
	})

	next()
}

module.exports = {
	randomString,
	containsAll,
	decodeAuthCredentials,
	deleteAllKeys,
	timeout,
}
