const express = require('express');
var cors = require('cors');
const app = express();
const port = 3000;

// These lines will be explained in detail later in the unit
app.use(express.json());// process json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
// These lines will be explained in detail later in the unit

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://giftadmin:admin@cluster0.wbg32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&connectTimeoutMS=30000";

const client = new MongoClient(uri, {
	useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 3000, keepAlive: true,	
	tlsInsecure: true, // Added to remove Mongo Topology Closed Error
});
// Global for general use
var userCollection;
var orderCollection;

client.connect(err => {
	if (err) {
		console.error("Failed to connect to the database. Error:", err);
		process.exit(1); // Exit the app if it cannot connect to the database
	} else {
		userCollection = client.db("giftdelivery").collection("users");
		orderCollection = client.db("giftdelivery").collection("orders");
		// perform actions on the collection object
		console.log('Database up!\n')
	}
});


app.get('/', (req, res) => {
	res.send('<h3>Welcome to Gift Delivery server app!</h3>')
})


app.get('/getUserDataTest', (req, res) => {

	console.log("GET request received\n");

	userCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			console.log(JSON.stringify(docs) + " have been retrieved.\n");
			res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
		}

	});

});


app.get('/getOrderDataTest', (req, res) => {

	console.log("GET request received\n");

	orderCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			console.log(JSON.stringify(docs) + " have been retrieved.\n");
			res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
		}

	});

});


app.post('/verifyUser', (req, res) => {

	console.log("POST request received : " + JSON.stringify(req.body) + "\n");

	loginData = req.body;

	userCollection.find({ email: loginData.email, password: loginData.password }, { projection: { _id: 0 } }).toArray(function (err, docs) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			console.log(JSON.stringify(docs) + " have been retrieved.\n");
			res.status(200).send(docs);
		}

	});

});


app.post('/postOrderData', function (req, res) {

	console.log("POST request received : " + JSON.stringify(req.body) + "\n");

	orderCollection.insertOne(req.body, function (err, result) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			console.log("Order record with ID " + result.insertedId + " have been inserted\n");
			res.status(200).send(result);
		}

	});

});

// Signup
app.post('/postNewUserData', function (req, res) {
	console.log("POST request received : " + JSON.stringify(req.body) + "\n");
	const signupData = req.body;

	// Check if a user with this email already exists
	userCollection.findOne({ email: signupData.email }, { projection: { _id: 0 } }, function (err, user) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.status(500).send(err); // Send a 500 status for server errors
		} else {
			if (user) {
				// If a user with the same email already exists
				console.log("User with email " + signupData.email + " already exists.\n");
				res.status(409).send("This email address has already been taken");
			} else {
				// If no user exists, proceed to insert the new user
				userCollection.insertOne(signupData, function (err, result) {
					if (err) {
						console.log("Some error.. " + err + "\n");
						res.status(500).send(err);
					} else {
						console.log("User record with ID " + result.insertedId + " has been inserted\n");
						res.status(200).send(result);
					}
				});
			}
		}
	});
});


// Endpoint to retrieve all past orders for the currently logged-in user
app.post('/getUserOrders', (req, res) => {
	console.log("POST request received for fetching user orders: " + JSON.stringify(req.body) + "\n");

	const userEmail = req.body.email; // Assume you pass the logged-in user's email in the request

	// Find all orders for the currently logged-in user
	orderCollection.find({ customerEmail: userEmail }, { projection: { _id: 0 } }).toArray(function (err, orders) {
		if (err) {
			console.log("Error occurred while fetching orders: " + err + "\n");
			res.status(500).send("Error fetching orders");
		} else {
			console.log(JSON.stringify(orders) + " orders retrieved for user: " + userEmail + "\n");
			res.status(200).json(orders); // Sending back in JSON
		}
	});
});

// Endpoint to delete orders for the currently logged-in user

app.delete('/deleteOrders', (req, res) => {
	const { orderNos } = req.body;
	
	if (!Array.isArray(orderNos) || orderNos.length === 0) {
		return res.status(400).json({ error: 'No order numbers provided.' });
	}

	// deleteMany to remove documents with matching order numbers
	orderCollection.deleteMany({ orderNo: { $in: orderNos } }, (err, result) => {
		if (err) {
			console.log("Error occurred while deleting orders: " + err + "\n");
			return res.status(500).json({ error: 'Error deleting orders' });
		}

		const deletedCount = result.deletedCount;
		console.log(`Deleted ${deletedCount} orders.`);


		res.json({ deletedCount });
	});
});


app.listen(port, () => {
	console.log(`Gift Delivery server app listening at http://localhost:${port}`)
});
