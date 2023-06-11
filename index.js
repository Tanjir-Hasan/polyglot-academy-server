const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


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
        // await client.connect();

        // all collections

        const usersCollection = client.db("campDb").collection("users");
        const classCollection = client.db("campDb").collection("classes");
        const instructorCollection = client.db("campDb").collection("instructors");

        // JWT

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
            res.send({ token });
        });

        // admin verification

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'Forbidden access' });
            }
            next();
        };

        // instructor verification

        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'Forbidden access' });
            }
            next();
        };

        // search users collection

        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });


        // make user collection

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

        // make admin from user

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        // make instructor from user

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });





        // get all classes data from db

        app.get('/all-classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        });

        // get all instructor data from db

        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        });


        // get all classes data from db (only approved classes)
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            const data = result.filter(item => item?.status == 'approved')
            res.send(data);
        });


        // add classes

        app.post('/classes', verifyJWT, verifyInstructor, async (req, res) => {
            const newClass = { ...req.body, status: 'pending' };
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        });

        // add classes


        // Approve class
        app.patch('/classes/approve/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    status: 'approved'
                }
            };

            const result = await classCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // Deny class 
        app.patch('/classes/deny/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const { feedback } = req.body;
            const updateDoc = {
                $set: {
                    status: 'denied',
                    feedback: feedback
                }
            };

            const result = await classCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        // user is admin or not

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false });
                return;
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' };
            res.send(result);
        });

        // user is instructor or not

        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false });
                return;
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' };
            res.send(result);
        });








        // specific data for the instructor

        app.get('/instructors/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            
            const query = { email: email };
            const instructor = await classCollection.findOne(query);
            
            if (!instructor) {
              return res.status(404).send('Instructor not found');
            }
            
            res.send(instructor);
          });
          




          

        // feedback

        app.get('/classes/feedback/:email', verifyJWT, verifyInstructor, async (req, res) => {
            const email = req.params.email;

            const filter = { email: email };
            const classItem = await classCollection.findOne(filter);

            if (!classItem) {
                return res.status(404).send('Class not found');
            }

            const feedback = classItem.feedback || '';

            res.send(feedback);
        });

        // send feedback

        app.post('/classes/feedback/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const { id } = req.params;
            const { feedback } = req.body;

            const filter = { _id: new ObjectId(id) };
            const update = { $set: { feedback } };

            const result = await classCollection.updateOne(filter, update);

            res.send(result);
        });









        













        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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
