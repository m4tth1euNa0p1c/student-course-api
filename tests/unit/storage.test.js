const storage = require('../../src/services/storage');

beforeEach(() => {
  storage.reset();
  storage.seed();
});

test('should not allow duplicate course title', () => {
  const result = storage.create('courses', { title: 'Math', teacher: 'Someone' });
  expect(result.error).toBe('Course title must be unique');
});

test('should list seeded students', () => {
  const students = storage.list('students');
  expect(students.length).toBe(3);
  expect(students[0].name).toBe('Alice');
});

test('should create a new student', () => {
  const result = storage.create('students', { name: 'David', email: 'david@example.com' });
  expect(result.name).toBe('David');
  expect(storage.list('students').length).toBe(4);
});

test('should not allow duplicate student email', () => {
  const result = storage.create('students', { name: 'Eve', email: 'alice@example.com' });
  expect(result.error).toBe('Email must be unique');
});

test('should delete a student', () => {
  const students = storage.list('students');
  const result = storage.remove('students', students[0].id);
  expect(result).toBe(true);
});

test('should not allow more than 3 students in a course', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  storage.create('students', { name: 'Extra', email: 'extra@example.com' });
  storage.create('students', { name: 'Extra2', email: 'extra2@example.com' });
  storage.enroll(students[0].id, course.id);
  storage.enroll(students[1].id, course.id);
  storage.enroll(students[2].id, course.id);
  const result = storage.enroll(4, course.id);
  expect(result.error).toBe('Course is full');
});

test('should not delete a student enrolled in a course', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  storage.enroll(students[0].id, course.id);
  const result = storage.remove('students', students[0].id);
  expect(result.error).toBe('Cannot delete student: enrolled in a course');
});

test('should not allow enrolling in non-existent course', () => {
  const students = storage.list('students');
  const result = storage.enroll(students[0].id, 999);
  expect(result.error).toBe('Course not found');
});

test('should not allow enrolling non-existent student', () => {
  const course = storage.list('courses')[0];
  const result = storage.enroll(999, course.id);
  expect(result.error).toBe('Student not found');
});

test('should not allow duplicate enrollment', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  storage.enroll(students[0].id, course.id);
  const result = storage.enroll(students[0].id, course.id);
  expect(result.error).toBe('Student already enrolled in this course');
});

test('should unenroll a student from a course', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  storage.enroll(students[0].id, course.id);
  const result = storage.unenroll(students[0].id, course.id);
  expect(result.success).toBe(true);
});

test('should return error when unenrolling non-existent enrollment', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  const result = storage.unenroll(students[0].id, course.id);
  expect(result.error).toBe('Enrollment not found');
});

test('should get courses for a student', () => {
  const students = storage.list('students');
  const courses = storage.list('courses');
  storage.enroll(students[0].id, courses[0].id);
  storage.enroll(students[0].id, courses[1].id);
  const studentCourses = storage.getStudentCourses(students[0].id);
  expect(studentCourses.length).toBe(2);
});

test('should get students in a course', () => {
  const students = storage.list('students');
  const course = storage.list('courses')[0];
  storage.enroll(students[0].id, course.id);
  storage.enroll(students[1].id, course.id);
  const courseStudents = storage.getCourseStudents(course.id);
  expect(courseStudents.length).toBe(2);
});

test('should get individual student by id', () => {
  const students = storage.list('students');
  const student = storage.get('students', students[0].id);
  expect(student.name).toBe('Alice');
});

test('should get individual course by id', () => {
  const courses = storage.list('courses');
  const course = storage.get('courses', courses[0].id);
  expect(course.title).toBe('Math');
});
