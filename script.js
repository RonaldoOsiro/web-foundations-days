document.addEventListener("DOMContentLoaded", () => {
    const noteForm = document.querySelector("#note-form");
    const noteInput = document.querySelector("#note-input");
    const noteCategory = document.querySelector("#note-category");
    const errorMessage = document.querySelector("#error-message");
    const searchInput = document.querySelector("#search-input");
    const notesList = document.querySelector("#notes-list");
    const noteCount = document.querySelector("#note-count");
    const clearAllBtn = document.querySelector("#clear-all-btn");

    let notes = [];

    const savedNotes = localStorage.getItem("quicknotes_data");
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
        } catch (e) {
            console.error("Failed to parse saved notes", e);
            notes = [];
        }
    }

    function saveNotes() {
        localStorage.setItem("quicknotes_data", JSON.stringify(notes));
    }

    function render(filterText = "") {
        notesList.innerHTML = "";

        const filteredNotes = notes.filter(note => 
            note.text.toLowerCase().includes(filterText.toLowerCase())
        );

        if (notes.length === 0) {
            noteCount.textContent = "You have no notes yet.";
        } else if (notes.length === 1) {
            noteCount.textContent = "You have 1 note.";
        } else {
            noteCount.textContent = `You have ${notes.length} notes.`;
        }

        if (filteredNotes.length === 0 && notes.length > 0) {
            const emptySearchLi = document.createElement("li");
            emptySearchLi.textContent = "No notes match your search.";
            emptySearchLi.style.padding = "1rem";
            emptySearchLi.style.textAlign = "center";
            emptySearchLi.style.color = "#6b7280";
            notesList.appendChild(emptySearchLi);
            return;
        }

        if (notes.length === 0) {
            return;
        }

        filteredNotes.forEach(note => {
            const li = document.createElement("li");
            li.className = `note-card category-${note.category.toLowerCase()}`;

            const contentDiv = document.createElement("div");
            contentDiv.className = "note-content";

            const textP = document.createElement("p");
            textP.className = "note-text";
            textP.textContent = note.text;

            const metaDiv = document.createElement("div");
            metaDiv.className = "note-meta";

            const catSpan = document.createElement("span");
            catSpan.className = "note-category-badge";
            catSpan.textContent = note.category;

            const dateSpan = document.createElement("span");
            dateSpan.textContent = note.createdAt;

            metaDiv.appendChild(catSpan);
            metaDiv.appendChild(dateSpan);

            contentDiv.appendChild(textP);
            contentDiv.appendChild(metaDiv);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => {
                deleteNote(note.id);
            });

            li.appendChild(contentDiv);
            li.appendChild(deleteBtn);
            notesList.appendChild(li);
        });
    }

    noteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = noteInput.value.trim();
        const category = noteCategory.value;

        if (text === "") {
            errorMessage.textContent = "Please type a note first.";
            return;
        }
        if (text.length > 200) {
            errorMessage.textContent = "Notes must be 200 characters or fewer.";
            return;
        }

        errorMessage.textContent = "";

        const newNote = {
            id: Date.now().toString(),
            text: text,
            category: category,
            createdAt: new Date().toLocaleString()
        };

        notes.unshift(newNote);
        saveNotes();
        render(searchInput.value);

        noteInput.value = "";
        noteInput.focus();
    });

    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        render(searchInput.value);
    }

    searchInput.addEventListener("input", (e) => {
        render(e.target.value);
    });

    clearAllBtn.addEventListener("click", () => {
        if (notes.length === 0) return;
        if (confirm("Delete all notes?")) {
            notes = [];
            saveNotes();
            render();
            searchInput.value = "";
        }
    });

    render();
});