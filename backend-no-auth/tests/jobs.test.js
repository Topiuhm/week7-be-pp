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