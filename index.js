const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bb0v57f.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // all collections
        const usersCollection = client.db("campDb").collection("users");

        // search users collection

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        // user collection
        app.post('/users', async (req, res) => {
            const users = req.body;
            console.log(users);

            // for google only
            const query = { email: users.email };
            const existingUser = await usersCollection.findOne(query);
            console.log(existingUser);
            if (existingUser) {
                return res.send({ message: "User already exists" })
            };
            // for google only

            const result = await usersCollection.insertOne(users);
            res.send(result);
        });






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);








// routes

app.get('/', (req, res) => {
    res.send('Summer Camp');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});