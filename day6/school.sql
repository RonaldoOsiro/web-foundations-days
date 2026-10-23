-- Drop tables if they already exist for a clean rerun
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    -- Prevents the same student from enrolling in the same course twice
    UNIQUE(student_id, course_id)
);

-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

INSERT INTO students (name, email) VALUES 
('Alice Wanjiku', 'alice@example.com'),
('Brian Kiprono', 'brian@example.com'),
('Cynthia Mutua', 'cynthia@example.com'),
('David Omwamba', 'david@example.com'); -- Student with no enrolments for Query 4

INSERT INTO courses (title, code) VALUES 
('Database Foundations', 'DB101'),
('Web Development Basics', 'WEB102'),
('Project Management', 'PM103');

INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'B+'),
(2, 3, 'A'),
(3, 2, 'C+');

-- ==========================================
-- 3. FIVE REQUIRED QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name)
SELECT s.name AS student_name, c.title AS course_title, c.code, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.name = 'Alice Wanjiku';

-- Query 2: All students on one course
SELECT c.title AS course_title, s.name AS student_name, e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.code = 'DB101';

-- Query 3: The number of students per course
SELECT c.title AS course_title, c.code, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.title, c.code;

-- Query 4: Students who have no enrolments
SELECT s.student_id, s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 1;