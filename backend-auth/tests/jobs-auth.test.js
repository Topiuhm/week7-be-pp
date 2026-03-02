const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Job = require("../models/jobModel");
const User = require("../models/userModel");

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
    return allJobs.map((t) => t.toJSON());
};

let token = null;


beforeAll(async () => {
    await User.deleteMany({});
    const result = await api.post("/api/users/signup").send({
        name: "Sami",
        email: "sami@example.com",
        password: "W129+fdAVBs",
        phone_number: "08126461901",
        gender: "Male",
        date_of_birth: "1990-04-12",
        membership_status: "Active",
    });
    token = result.body.token;
});


describe("Job Routes", () => {
    beforeEach(async () => {
        await Job.deleteMany({});
        await Promise.all(
            jobs.map((job) =>
                api
                    .post("/api/jobs")
                    .set("Authorization", "Bearer " + token)
                    .send(job)
            )
        );
    });

   describe('GET /api/jobs', () => {
    it('should return all jobs as JSON with status 200', async () => {
        const response = await api
            .get('/api/jobs')
            .expect(200)
            .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveLength(jobs.length);
    });


    });


    describe("GET /api/jobs/:id", () => {
        it("should return one job by ID", async () => {
            const job = await Job.findOne();
            const response = await api
                .get(`/api/jobs/${job._id}`)
                .expect(200)
                .expect("Content-Type", /application\/json/);

            expect(response.body.title).toBe(job.title);
        });

    });


    describe("POST /api/jobs", () => {
        describe("when the user is authenticated", () => {
            it("should create a new job with status 201", async () => {
                const newJob = {
                    title: "Mäki2n kassa2",
                    type: "Kassa",
                    description: "Mäkin kassa2",
                    company: {
                        name: "Mäkkär2i",
                        contactEmail: "makkari@exam2ple.com",
                        contactPhone: "12345672289"
                    }

                };

                const response = await api
                    .post("/api/jobs")
                    .set("Authorization", "Bearer " + token)
                    .send(newJob)
                    .expect(201);

                expect(response.body.title).toBe(newJob.title);

                const jobsAtEnd = await jobsInDb();
                expect(jobsAtEnd).toHaveLength(jobs.length + 1);
            });
        });

        describe("when the user is not authenticated", () => {
            it("should return 401 if no token is provided", async () => {
                const newJob = {
                    title: "Mäkin kassa4",
                    type: "Kassa4",
                    description: "Mäkin kassa4",
                    company: {
                        name: "Mäkkäri4",
                        contactEmail: "makkari@exam4ple.com",
                        contactPhone: "1234567849"
                    }

                };

                await api.post("/api/jobs").send(newJob).expect(401);

                const jobsAtEnd = await jobsInDb();
                expect(jobsAtEnd).toHaveLength(jobs.length);
            });
        });
    });

    describe("PUT /api/jobs/:id", () => {
        describe("when the user is authenticated", () => {
            it("should update the job and return the updated document", async () => {
                const job = await Job.findOne();
                const updates = { description: "Updated job information." };

                const response = await api
                    .put(`/api/jobs/${job._id}`)
                    .set("Authorization", "Bearer " + token)
                    .send(updates)
                    .expect(200)
                    .expect("Content-Type", /application\/json/);

                expect(response.body.description).toBe(updates.description);
            });
        });

        describe("when the user is not authenticated", () => {
            it("should return 401 if no token is provided", async () => {
                const job = await Job.findOne();
                await api
                    .put(`/api/jobs/${job._id}`)
                    .send({ info: "Nope" })
                    .expect(401);
            });
        });
    });

    describe("DELETE /api/jobs/:id", () => {
        describe("when the user is authenticated", () => {
            it("should delete the job and return status 204", async () => {
                const jobsAtStart = await jobsInDb();
                const jobToDelete = jobsAtStart[0];

                await api
                    .delete(`/api/jobs/${jobToDelete._id}`)
                    .set("Authorization", "Bearer " + token)
                    .expect(204);

                const jobsAtEnd = await jobsInDb();
                expect(jobsAtEnd).toHaveLength(jobsAtStart.length - 1);
                expect(jobsAtEnd.map((t) => t.title)).not.toContain(jobToDelete.title);
            });
        });

        describe("when the user is not authenticated", () => {
            it("should return 401 if no token is provided", async () => {
                const job = await Job.findOne();
                await api.delete(`/api/jobs/${job._id}`).expect(401);
            });
        });
    });
});


afterAll(async () => {
    await mongoose.connection.close();
});
