# Library API Design

REST API design documentation for the Library's **Books** resource.

---

## Endpoints Overview

### 1. List All Books
* **Method:** `GET`
* **Path:** `/api/v1/books`
* **Description:** Retrieves a paginated list of all books in the library inventory.
* **Request Body:** None
* **Success Status Code:** `200 OK`

### 2. List Books by Author (Query Parameter)
* **Method:** `GET`
* **Path:** `/api/v1/books?author=Jane+Doe`
* **Description:** Retrieves a filtered list of books written by a specific author using a query parameter.
* **Request Body:** None
* **Success Status Code:** `200 OK`

### 3. Get One Book
* **Method:** `GET`
* **Path:** `/api/v1/books/{id}`
* **Description:** Retrieves detailed information for a single book by its unique ID.
* **Request Body:** None
* **Success Status Code:** `200 OK`

### 4. Create a Book
* **Method:** `POST`
* **Path:** `/api/v1/books`
* **Description:** Adds a new book to the library catalog.
* **Request Body Example:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "publishedYear": 2008,
    "isbn": "978-0132350884"
  }