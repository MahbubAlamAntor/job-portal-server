const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleWare 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jypts.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri)


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
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // jobs api

        const jobsCollections = client.db('jobsList').collection('jobs');
        const jobsApplication = client.db('jobsList').collection('job-application')

        app.get('/jobs', async(req, res) => {
            const email = req.query.email;
            let query = {};
            if(email){
                query = {hr_email : email}
            }
            const cursor = jobsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/jobs/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await jobsCollections.findOne(query);
            res.send(result)
        })

        app.post('/jobs', async(req, res) => {
            const userData = req.body;
            const result = await jobsCollections.insertOne(userData);
            res.send(result)
        })

        // jobs application api

        app.get('/job-application/jobs/:job_id', async(req, res) => {
            const jobId = req.params.job_id;
            const query = {job_id: jobId};
            const result = await jobsApplication.find(query).toArray();
            res.send(result)
        })
        
        app.get('/job-application', async(req, res) =>{
            const email = req.query.email;
            const query = {applicationEmail: email};
            const result = await jobsApplication.find(query).toArray();

            //  get application Data 
            console.log(result)
            for(const application of result){
                console.log(application.job_id)

                const queryOne = {_id:new ObjectId(application.job_id)}
                const jobs = await jobsCollections.findOne(queryOne)
                if(jobs){
                    application.title = jobs.title;
                    application.company = jobs.company;
                    application.company_logo = jobs.company_logo;
                    application.location = jobs.location;
                }
                console.log(jobs)
            }
            res.send(result)
        })

        app.post('/job-application', async(req, res) => {
            const application = req.body;
            const result = await jobsApplication.insertOne(application);

            const id = application.job_id;
            const query = {_id: new ObjectId(id)}
            const job = await jobsCollections.findOne(query)

            let count = 0;
            if(job.applicationCount){
                count = job.applicationCount + 1
            }
            else{
                count = 1;
            }

            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    applicationCount: count
                }
            }
            const updatedResult = await jobsCollections.updateOne(filter, updatedDoc)
            res.send(result)
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('This Jobs Is Running')
})

app.listen(port, () => {
    console.log(`Your Job Is Running ${port}`)
})