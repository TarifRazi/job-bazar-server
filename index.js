const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000

app.use(cors());
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

    app.get('/allJobs', async(req, res) =>{
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
    

    app.get('/allJobs/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobCollection.findOne(query);
      res.json(result) 
    })

    app.get('/myJobs/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {userEmail: email}
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })

    

    app.get('/appliedJobs', async(req,res) =>{
      console.log(req.query.email);
      let query = {};
      if(req.query?.email){
        query={email:req.query.email}
      }
      const result = await jobAppliedCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/appliedJobs', async(req,res) => {
      try {
        const appliedJob = req.body;
      const id = appliedJob._id
      const filtered = await jobAppliedCollection.findOne({_id:id})
      if (!!filtered) {
        res.json({error:"Already applied"}).status(409)
      }else{
        const result = await jobAppliedCollection.insertOne(appliedJob);
        res.send(result)
      }
      } catch (error) {
        res.json({error:"Error"})
        console.error(error)
      }
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


app.get('/',(req,res) =>{
    res.send('test')
})

app.listen(port, () =>{
    console.log(`server running on ${port}`)
})