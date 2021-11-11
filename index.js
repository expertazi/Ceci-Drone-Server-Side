const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const admin = require("firebase-admin");

require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
// const axios = require("axios").default;

const app = express();
const port = process.env.PORT || 5000;

// Middlewar
app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7zca.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("droneProject");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");
    const usersCollection = database.collection("users");

    // get api for Products
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
    // get api for Orders
    app.get("/orders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
    // get api for Reviews
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
    // get api for Users
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    // get api for orders
    app.get("/orders/:email", async (req, res) => {
      const cursor = ordersCollection.find({ email: req.params.email });
      const products = await cursor.toArray();
      res.send(products);
    });

    // Post Api for Orders
    app.post("/orders", async (req, res) => {
      const user = req.body;
      console.log("hit the api", user);
      const result = await ordersCollection.insertOne(user);
      res.json(result);
    });
    // Post Api Products
    app.post("/products", async (req, res) => {
      const user = req.body;
      console.log("hit the api", user);
      const result = await productsCollection.insertOne(user);
      res.json(result);
    });
    // Post Api Reviews
    app.post("/reviews", async (req, res) => {
      const user = req.body;
      console.log("hit the api", user);
      const result = await reviewsCollection.insertOne(user);
      res.json(result);
    });
    // Post Api Users
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log("hit the api", user);
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // Update Collection USER
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // This is for admin
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });

    // Get one User
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);

      res.send(result);
    });

    // Update Api
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      console.log(updatedUser);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updatedUser.status,
        },
      };
      console.log(updateDoc);
      const resut = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      res.json(resut);
    });

    // Delete One Order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });
    // Delete Api Post
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      console.log("deleteing the Product ", result);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running My Curd Server");
});

app.listen(port, () => {
  console.log("Running server On port", port);
});
