# School Database System Design

## Table Descriptions
- **`students`**: Stores core profile details for each learner, including a unique `student_id` primary key, their full `name`, and a `UNIQUE` `email` address to prevent duplicate accounts.
- **`courses`**: Holds information regarding available school subjects, featuring a unique `course_id`, the course `title`, and a `UNIQUE` course `code`.
- **`enrolments`**: A join table connecting students to courses. It tracks each registration using an `enrolment_id` primary key, foreign keys referencing `students` and `courses`, and an optional `grade` column.

## Relationships and the Join Table
- **One-to-Many Relationships**: A single student can have multiple enrolments, and a single course can have multiple student enrolments. 
- **Many-to-Many Relationship**: Because students can take multiple courses and courses have many students, a many-to-many relationship exists between `students` and `courses`.
- **Why a Join Table (`enrolments`) is Needed**: Relational databases do not allow multi-valued arrays in a single column while maintaining First Normal Form (1NF). The `enrolments` table breaks the many-to-many relationship into two clean one-to-many relationships. Additionally, it serves as the ideal home for relationship-specific attributes—such as the student's `grade` in a specific course—and enforces a composite `UNIQUE(student_id, course_id)` constraint to prevent duplicate enrolments.

## Recommended Index
- **Index**: `CREATE INDEX idx_enrolments_student_course ON enrolments(student_id, course_id);`
- **Reason**: Because filtering, joining, and counting operations constantly query the `enrolments` table using `student_id` and `course_id` foreign keys, adding an index drastically reduces lookup time by avoiding full table scans during `JOIN` and `GROUP BY` operations.

## SQL vs. NoSQL Justification
For a school management and student enrolment system, **SQL (Relational Database)** is the optimal choice. Academic data is highly structured, relational, and requires rigorous integrity guarantees—such as foreign key constraints to prevent orphaned records, unique email rules, and exact transaction atomicity for grading and enrolment counts. SQL guarantees ACID compliance, ensuring that records remain consistent and reliable across all queries and updates.