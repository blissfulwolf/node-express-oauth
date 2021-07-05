const url = require("url")
const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")

const config = {
	port: 9000,

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
	tokenEndpoint: "http://localhost:9001/token",
	userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/* === Your code here === */

/*
4 = Building the Client Application | 45m
1. Creating the authorization route
2. Declaring the state
3. Redirecting the user to the authorization endpoint
4. Creating the callback endpoint
5. Verifying the state
6. Requesting for the access token
7. Requesting user information
8. Rendering the welcome page
*/

app.get("/authorize", (req,res) => {

	state = randomString()
	const redirectUrl = url.parse(config.authorizationEndpoint)

	redirectUrl.query = {
		response_type: "code",
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		scope: "permission:name permission:date_of_birth",
		state: state,
	}
	res.redirect(url.format(redirectUrl))
})

app.get("/callback", (req,res) => {
	if(state !== req.query.state) {
		res.status(403).send("Error: Mismatch State")
		return
	}  

		const { code } = req.query
		axios({			
				method:"POST",
				url:config.tokenEndpoint,
				auth: {
					username:config.clientId,
					password:config.clientSecret,
				},
				data: { code, },
				validateStatus: null,
		}) 	
		.then((response) => {
			return axios({
				method: "GET",
				url: config.userInfoEndpoint,
				headers: {
					authorization: "bearer " + response.data.access_token,
				},
			})
		})
		.then((response) => {
			res.render("welcome", { user:response.data })
		})
		.catch((err) => {
			console.error(err)
			res.status(500).send("Error: something went wrong")
		})

	
})

/* === Your code here === */


const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = {
	app,
	server,
	getState() {
		return state
	},
	setState(s) {
		state = s
	},
}
