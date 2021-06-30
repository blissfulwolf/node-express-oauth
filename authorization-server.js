const url = require("url")
const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


// 2.1. Creating the authorization route
app.get("/authorize", (req, res) => {
	const clientId = req.query.client_id
	const client = clients[clientId]
// 2.2. Verifying the client ID
		if (!client) {
			res.status(401).send("Error: client not authorized")
			return 
		} 
// 2.3. Validating the scopes requested
// typo scopes
		console.log(typeof req.query.scope)
		if ( 
			typeof req.query.scope !== "string" || 
			!containsAll(client.scope, req.query.scope.split(" ")) 
		) { 
			res.status(401).send("Error: Invalid scope")
			return
		}	 

// 2.4. Storing the request
		const requestId = randomString() 
		requests[requestId] = req.query

// 2.5. Rendering the login page + template variables
		res.render("login", {
			client,
			scope: req.query.scope,
			requestId,
		})
})

		
//2.6. Creating the approve route
		app.post("/approve", (req, res) => {
			const { userName, password, requestId } = req.body
//2.7. Verifying the username and password
			if (!userName || users[userName] !== password) {
				res.status(401).send("Error: User not authorized")
				return
			}

//2.8. Checking if the request exists
			const clientReq = requests[requestId]
			delete requests[requestId]
			if (!clientReq) {
				res.status(401).send("Error: Invalid User Request")
				return 
			} 

//2.9. Storing the request and userName
			const code = randomString()
			authorizationCodes[code] = { clientReq, userName }

//2.10. Redirecting the user
			const redirectUri = url.parse(clientReq.redirect_uri)
			redirectUri.query = {
				code,
				state: clientReq.state,
			}
			res.redirect(url.format(redirectUri))
		})

//2.11. Creating the token route
app.post("/token", (req, res) => {		
//2.12. Checking if authorization credentials exist
		let authCredentials = req.headers.authorization
		if (!authCredentials) {
			res.status(401).send("Error: Not Authorized")
			return 
		}
//2.13. Verifying the authorization header
		const { clientId, clientSecret } = decodeAuthCredentials(authCredentials)
		const client = clients[clientId]
		if (!client || client.clientSecret !== clientSecret) {
			res.status(401).send("Error: client not authorized")
			return
		}
//2.14. Verifying the authorization code
		const code = req.body.code
		if (!code || !authorizationCodes[code]) {
			res.status(401).send("Error: invalid code")
			return
		}
//2.15. Issuing the access token
		const { clientReq, userName } = authorizationCodes[code]
		delete authorizationCodes[code]
		const token = jwt.sign(
			{
				userName,
				scope: clientReq.scope,
			},
			config.privateKey,
			{
				algorithm: "RS256",
				expiresIn: 300,
				issuer: "http://localhost:" + config.port,
			}
		)

//2.16. Returning a response on successful authorization		 

		res.json({
			access_token: token,
			token_type: "Bearer",
			scope: clientReq.scope,
		}) 

		 
})



 

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
