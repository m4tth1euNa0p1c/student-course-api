const request = require('supertest');
const app = require('../../src/app');

describe('Student-Course API integration', () => {
  beforeEach(() => {
    // eslint-disable-next-line global-require
    require('../../src/services/storage').reset();
    // eslint-disable-next-line global-require
    require('../../src/services/storage').seed();
  });

  test('GET /students should return seeded students', async () => {
    const res = await request(app).get('/students');
    expect(res.statusCode).toBe(200);
    expect(res.body.students.length).toBe(3);
    expect(res.body.students[0].name).toBe('Alice');
  });

  test('POST /students should create a new student', async () => {
    const res = await request(app)
      .post('/students')
      .send({ name: 'David', email: 'david@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('David');
  });

  test('POST /students should not allow duplicate email', async () => {
    const res = await request(app)
      .post('/students')
      .send({ name: 'Eve', email: 'alice@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email must be unique');
  });

  test('DELETE /courses/:id should not delete a course if students are enrolled', async () => {
    const courses = await request(app).get('/courses');
    const courseId = courses.body.courses[0].id;
    await request(app).post(`/courses/${courseId}/students/1`);
    const res = await request(app).delete(`/courses/${courseId}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Cannot delete course: students are enrolled');
  });

  test('GET /students/:id should return a student with enrolled courses', async () => {
    await request(app).post('/courses/1/students/1');
    const res = await request(app).get('/students/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.student.name).toBe('Alice');
    expect(res.body.courses.length).toBe(1);
  });

  test('GET /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app).get('/students/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('GET /courses/:id should return a course with enrolled students', async () => {
    await request(app).post('/courses/1/students/1');
    const res = await request(app).get('/courses/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.course.title).toBe('Math');
    expect(res.body.students.length).toBe(1);
  });

  test('GET /courses/:id should return 404 for non-existent course', async () => {
    const res = await request(app).get('/courses/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  test('PUT /students/:id should update a student', async () => {
    const res = await request(app)
      .put('/students/1')
      .send({ name: 'Alice Updated', email: 'alice.updated@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Alice Updated');
    expect(res.body.email).toBe('alice.updated@example.com');
  });

  test('PUT /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app).put('/students/999').send({ name: 'Ghost' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('PUT /students/:id should not allow duplicate email', async () => {
    const res = await request(app).put('/students/1').send({ email: 'bob@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email must be unique');
  });

  test('PUT /courses/:id should update a course', async () => {
    const res = await request(app)
      .put('/courses/1')
      .send({ title: 'Advanced Math', teacher: 'Prof. Johnson' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Advanced Math');
    expect(res.body.teacher).toBe('Prof. Johnson');
  });

  test('PUT /courses/:id should return 404 for non-existent course', async () => {
    const res = await request(app).put('/courses/999').send({ title: 'Ghost Course' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  test('PUT /courses/:id should not allow duplicate title', async () => {
    const res = await request(app).put('/courses/1').send({ title: 'Physics' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Course title must be unique');
  });

  test('POST /courses should return 400 if title or teacher is missing', async () => {
    const res = await request(app).post('/courses').send({ title: 'Incomplete' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('title and teacher required');
  });

  test('DELETE /students/:id should return 404 for non-existent student', async () => {
    const res = await request(app).delete('/students/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Student not found');
  });

  test('DELETE /students/:id should not delete if student is enrolled', async () => {
    await request(app).post('/courses/1/students/1');
    const res = await request(app).delete('/students/1');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Cannot delete student: enrolled in a course');
  });

  test('DELETE /courses/:id should return 404 for non-existent course', async () => {
    const res = await request(app).delete('/courses/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  test('DELETE /courses/:id/students/:studentId should unenroll a student', async () => {
    await request(app).post('/courses/1/students/1');
    const res = await request(app).delete('/courses/1/students/1');
    expect(res.statusCode).toBe(204);
  });

  test('POST /courses/:id/students/:studentId should not enroll duplicate', async () => {
    await request(app).post('/courses/1/students/1');
    const res = await request(app).post('/courses/1/students/1');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Student already enrolled in this course');
  });

  test('GET /students should support search by name', async () => {
    const res = await request(app).get('/students?name=Alice');
    expect(res.statusCode).toBe(200);
    expect(res.body.students.length).toBe(1);
    expect(res.body.students[0].name).toBe('Alice');
  });

  test('GET /students should support search by email', async () => {
    const res = await request(app).get('/students?email=bob');
    expect(res.statusCode).toBe(200);
    expect(res.body.students.length).toBe(1);
    expect(res.body.students[0].email).toBe('bob@example.com');
  });

  test('GET /courses should support search by title', async () => {
    const res = await request(app).get('/courses?title=Math');
    expect(res.statusCode).toBe(200);
    expect(res.body.courses.length).toBe(1);
    expect(res.body.courses[0].title).toBe('Math');
  });

  test('GET /courses should support search by teacher', async () => {
    const res = await request(app).get('/courses?teacher=Smith');
    expect(res.statusCode).toBe(200);
    expect(res.body.courses.length).toBe(1);
    expect(res.body.courses[0].teacher).toBe('Mr. Smith');
  });
});
