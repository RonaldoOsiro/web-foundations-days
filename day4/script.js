document.addEventListener("DOMContentLoaded", () => {
    const noteText = document.getElementById("note-text");
    const charCount = document.getElementById("char-count");
    const wordCount = document.getElementById("word-count");
    const clearBtn = document.getElementById("clear-btn");
    const themeToggle = document.getElementById("theme-toggle");

    // Update counts and warning classes function
    function updateCounts() {
        const text = noteText.value;
        const length = text.length;

        // Count words (splitting by whitespace and filtering empty strings)
        const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

        // Show counts
        charCount.textContent = `${length} / 200 characters`;
        wordCount.textContent = `${words} words`;

        // Reset classes
        charCount.classList.remove("warning", "over");

        // Add warning when over 180 characters and over when over 200
        if (length > 200) {
            charCount.classList.add("over");
        } else if (length > 180) {
            charCount.classList.add("warning");
        }
    }

    // Save draft and update counts on every input event
    noteText.addEventListener("input", () => {
        updateCounts();
        localStorage.setItem("noteDraft", noteText.value);
    });

    // Clear button functionality
    clearBtn.addEventListener("click", () => {
        noteText.value = "";
        localStorage.removeItem("noteDraft");
        updateCounts();
        noteText.focus();
    });

    // Pressing Escape inside the textarea also clears it
    noteText.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            noteText.value = "";
            localStorage.removeItem("noteDraft");
            updateCounts();
        }
    });

    // Theme toggle functionality
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    // Restore saved draft and theme on page load
    const savedDraft = localStorage.getItem("noteDraft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        themeToggle.textContent = "Dark mode";
    }

    // Initial update call
    updateCounts();
});