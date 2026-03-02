const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const Job = require('../models/jobModel');

const jobs = [
    {
        title: "Mäkin kassa",
        type: "Kassa",
        description: "Mäkin kassa",
        company: {
            name: "Mäkkäri",
            contactEmail: "makkari@example.com",
            contactPhone: "123456789"
        }

    },
    {
        title: "Hesen kassa",
        type: "Kassa",
        description: "Hesen kassa",
        company: {
            name: "Hese",
            contactEmail: "hese@example.com",
            contactPhone: "987654321"
        }
    }
];

const jobsInDb = async () => {
    const allJobs = await Job.find({});
    return allJobs.map((job) => job.toJSON());
}

beforeEach(async () => {
    await Job.deleteMany({});
    await Job.insertMany(jobs);
})

describe('GET /api/jobs', () => {
    it('should return all jobs as JSON with status 200', async () => {
        const response = await api
            .get('/api/jobs')
            .expect(200)
            .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveLength(jobs.length);
    });

    it('should contain the first seed job title', async () => {
        const response = await api.get('/api/jobs');
        const titles = response.body.map((j) => j.title);
        expect(titles).toContain(jobs[0].title);
    });
});

describe('GET /api/jobs/:id', () => {
    it('should return a job with status 200', async () => {
        const job = await Job.findOne();
        const response = await api
            .get(`/api/jobs/${job._id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);

        expect(response.body.title).toBe(jobs[0].title);
    });

    it('should return a 404 for non-existent job id', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        await api.get(`/api/jobs/${nonExistentId}`).expect(404);
    });

    it("should return 400 for an invalid job ID format", async () => {
    const invalidId = "12345";
    await api.get(`/api/jobs/${invalidId}`).expect(400);
  });
});


describe("POST /api/jobs", () => {
    describe("when the payload is valid", () => {
        it("should create a new job with status 201", async () => {
        const newJob = {
        title: "Hesen kassa2",
        type: "Kassa",
        description: "Hesen kassa2",
        company: {
            name: "Hese2",
            contactEmail: "hese2@example.com",
            contactPhone: "9876543212"
        }
    };

        const response = await api
            .post("/api/jobs")
            .send(newJob)
            .expect(201)
            .expect("Content-Type", /application\/json/);

        expect(response.body.title).toBe(newJob.title);

        const jobsAtEnd = await jobsInDb();
        expect(jobsAtEnd).toHaveLength(jobs.length + 1);
        expect(jobsAtEnd.map((t) => t.title)).toContain(newJob.title);
        });
    });

    describe("when the payload is invalid", () => {
            it("should return 400 if required fields are missing", async () => {
                const incompleteJob = { name: "Missing Info Jobs" };

                await api.post("/api/jobs").send(incompleteJob).expect(400);

                const jobsAtEnd = await jobsInDb();
                expect(jobsAtEnd).toHaveLength(jobs.length);
            });
    });
});

describe("PUT /api/jobs/:id", () => {
    describe("when id is valid", () => {
        it("should update job and return updated job", async ()=>{
            const job = await Job.findOne();
            const updates = {description:"nuh uh"};
            const response = await api
                .put(`/api/jobs/${job._id}`)
                .send(updates)
                .expect(200)
                .expect("Content-Type", /application\/json/);
            expect(response.body.description).toBe(updates.description);

        });
    });
    describe("when the id is invalid", () => {
    it("should return 400 for an invalid ID format", async () => {
        const invalidId = "12345";
        await api.put(`/api/jobs/${invalidId}`).send({}).expect(400);
        });
    });
});

describe("DELETE /api/jobs/:id", () => {
    describe("when the id is valid", () => {
        it("should delete the job and return status 204", async () => {
        const jobsAtStart = await jobsInDb();
        const jobToDelete = jobsAtStart[0];

        await api.delete(`/api/jobs/${jobToDelete._id}`).expect(204);

        const jobsAtEnd = await jobsInDb();
        expect(jobsAtEnd).toHaveLength(jobsAtStart.length - 1);
        expect(jobsAtEnd.map((t) => t.title)).not.toContain(jobToDelete.title);
        });
    });

    describe("when the id is invalid", () => {
        it("should return 400 for an invalid ID format", async () => {
        const invalidId = "12345";
        await api.delete(`/api/jobs/${invalidId}`).expect(400);
        });
    });
});

afterAll(async () => {
  await mongoose.connection.close();
});