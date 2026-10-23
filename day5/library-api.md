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
  ```
* **Success Status Code:** `201 Created`

### 5. Update a Book
* **Method:** `PUT`
* **Path:** `/api/v1/books/{id}`
* **Description:** Replaces the details of an existing book by its unique ID.
* **Request Body Example:**
  ```json
  {
    "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
    "author": "Robert C. Martin",
    "publishedYear": 2008,
    "isbn": "978-0132350884"
  }
  ```
* **Success Status Code:** `200 OK`

### 6. Delete a Book
* **Method:** `DELETE`
* **Path:** `/api/v1/books/{id}`
* **Description:** Removes the book with the specified ID from the library catalog.
* **Request Body:** None
* **Success Status Code:** `204 No Content`

## Error Responses

### `400 Bad Request`
The request contains invalid data, so the API cannot process it. For example, creating a book with a text value for `publishedYear` instead of a number should return `400 Bad Request`:

```json
{
  "error": "Invalid request",
  "message": "publishedYear must be a number."
}
```

### `404 Not Found`
The request is valid, but the requested book ID does not exist. For example, requesting `GET /api/v1/books/9999` should return `404 Not Found` if there is no book with ID `9999`:

```json
{
  "error": "Not found",
  "message": "No book exists with ID 9999."
}
```
