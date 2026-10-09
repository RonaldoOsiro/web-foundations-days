# QuickNotes App

QuickNotes is a lightweight, responsive note-taking web application built as part of the web-foundations-days curriculum. It allows users to quickly capture, organize, search, and categorize personal, work, and study notes with full client-side persistence and robust input validation.

## Features
- **Categorized Notes**: Organize notes into Personal, Work, or Study categories with distinct color-coded left borders.
- **Input Validation**: Automatically validates that notes are non-empty and under 200 characters with clear error messaging.
- **Dynamic Search**: Real-time filtering of notes as you type in the search bar.
- **Data Persistence**: Automatically saves and loads notes using browser `localStorage` and `JSON.stringify`/`JSON.parse`.
- **Dynamic Counters**: Live count indicator that adapts correctly for zero, one, or multiple notes.
- **Responsive Layout**: Fully responsive CSS layout with Flexbox and media queries adapting for mobile devices (max-width 600px).
- **Bonus Clear All**: Quick bulk deletion with confirmation prompt.

## How to Run Locally
1. Clone the repository or download the project files.
2. Ensure all four required files (`index.html`, `style.css`, `script.js`, and `README.md`) are in the root directory.
3. Open `index.html` in any modern web browser or run via a local development server.

## What I Learned
1. **DOM Manipulation & XSS Prevention**: Learned why using `textContent` is critical over `innerHTML` when rendering user-generated content to prevent cross-site scripting vulnerabilities.
2. **Form Event Handling**: Understood the importance of `event.preventDefault()` in form submission handlers to stop the browser from reloading the page and wiping out volatile JavaScript state.
3. **State & Persistence Synchronization**: Mastered the render pattern where every data mutation immediately updates `localStorage` and triggers a re-render so the screen accurately reflects application state.
4. **Responsive CSS Architecture**: Gained practical experience designing mobile-first components using CSS Flexbox and media queries.