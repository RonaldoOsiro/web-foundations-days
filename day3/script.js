let notes = [
	{ id: 1, text: "Buy milk and bread", category: "personal" },
	{ id: 2, text: "Finish the Day 3 assignment", category: "study" },
	{ id: 3, text: "Email the project report to Grace", category: "work" },
	{ id: 4, text: "Revise JavaScript arrays", category: "study" },
	{ id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
	return notes.filter(note => note.text.toLowerCase().includes(word.toLowerCase()));
}

function longestNote() {
	if (notes.length === 0) return null;
	let longest = notes[0];
	for (let i = 1; i < notes.length; i++) {
		if (notes[i].text.length > longest.text.length) longest = notes[i];
	}
	return longest;
}

function countByCategory() {
	const counts = {};
	for (const note of notes) {
		counts[note.category] = (counts[note.category] || 0) + 1;
	}
	return counts;
}

function getSummary() {
	const totalNotes = notes.length;
	const noteWord = totalNotes === 1 ? "note" : "notes";
	const categoryStrings = Object.entries(countByCategory())
		.map(([category, count]) => `${count} ${category}`);
	return `${totalNotes} ${noteWord}: ${categoryStrings.join(", ")}.`;
}

function isDuplicate(text) {
	const cleanText = text.trim().toLowerCase();
	return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

function addNote(text, category) {
	const validCategories = ["personal", "work", "study"];
	if (typeof text !== "string" || text.trim().length < 1 || text.length > 200) {
		console.log("Failed to add note: text must be between 1 and 200 characters.");
		return false;
	}
	if (!validCategories.includes(category)) {
		console.log("Failed to add note: category must be personal, work, or study.");
		return false;
	}
	if (isDuplicate(text)) {
		console.log("Failed to add note: a duplicate note already exists.");
		return false;
	}

	const newId = notes.reduce((maxId, note) => Math.max(maxId, note.id), 0) + 1;
	notes.push({ id: newId, text: text.trim(), category });
	console.log("Successfully added note.");
	return true;
}

// Tests
console.log(searchNotes("day"));
console.log(searchNotes("nonexistent"));
console.log(longestNote());

const backupNotes = notes;
notes = [];
console.log(longestNote());
console.log(countByCategory());
notes = backupNotes;

console.log(countByCategory());
console.log(getSummary());
notes = [{ id: 1, text: "Single item", category: "personal" }];
console.log(getSummary());
notes = backupNotes;

console.log(isDuplicate("buy milk and bread"));
console.log(isDuplicate("Learn something new"));
console.log(addNote("Learn CSS Grid", "study"));
console.log(addNote("", "personal"));
