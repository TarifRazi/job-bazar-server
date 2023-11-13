const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000

app.use(cors({
  origin:['http://localhost:5173'],
  credentials: true
}));
// app.use(cors())
app.use(express.json());

console.log(process.env.Db_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.Db_PASS}@cluster0.s33xtra.mongodb.net/?retryWrites=true&w=majority`;

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

    const jobCollection = client.db('jobBazarServer').collection('allJobs');
    const jobAppliedCollection = client.db('jobBazarServer').collection('appliedJobs');

    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
      .cookie('token', token,{
        httpOnly:true,
        secure: false,
        // sameSite: 'none'
      })
      .send({success: true})
    })

    // service related api
    app.get('/allJobs', async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // app.post('/allJobs',async(req,res) =>{
    //   const newJOb = req.body;
    //   console.log(newJOb)
    //   const result = await jobCollection.insertOne(allJobs)
    //   res.send(result)
    // })

    app.post('/allJobs', async (req, res) => {
      const newJob = req.body;
      console.log(newJob);
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });


    app.get('/allJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.findOne(query);
      res.json(result)
    })

    app.get('/myJobs/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email }
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/myJobs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.findOne(query);
      res.send(result)
    })

    app.put('/myJobs/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateJob = req.body
      const Job = {
        $set: {
          image: updateJob.image,
          jobDetails: updateJob.jobDetails,
          jobTitle: updateJob.jobTitle,
          userName: updateJob.userName,
          category: updateJob.category,
          salaryRange: updateJob.salaryRange,
          postingDate: updateJob.postingDate,
          applicantNumber: updateJob.applicantNumber,
          applicationDeadline: updateJob.applicationDeadline,
        }
      }
      const result = await jobCollection.updateOne(filter, Job, options)
      res.send(result)
    })

    app.delete('/myJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/appliedJobs', async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await jobAppliedCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/appliedJobs', async (req, res) => {
      try {
        const appliedJob = req.body;
        const id = appliedJob._id
        const filtered = await jobAppliedCollection.findOne({ _id: id })
        if (!!filtered) {
          res.json({ error: "Already applied" }).status(409)
        } else {
          const result = await jobAppliedCollection.insertOne(appliedJob);
          res.send(result)
        }
      } catch (error) {
        res.json({ error: "Error" })
        console.error(error)
      }
    })

    app.delete('/appliedJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('test')
})

app.listen(port, () => {
  console.log(`server running on ${port}`)
})