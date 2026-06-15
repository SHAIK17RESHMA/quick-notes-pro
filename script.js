const API_URL = "http://127.0.0.1:5000/notes";

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const saveBtn = document.getElementById("saveBtn");
const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("search");
const themeBtn = document.getElementById("themeBtn");
const wordCount = document.getElementById("wordCount");
const charCount = document.getElementById("charCount");

let editId = null;
let allNotes = [];

/* =========================
   INITIAL LOAD
========================= */

loadNotes();
loadTheme();
updateCounts();

/* =========================
   EVENT LISTENERS
========================= */

contentInput.addEventListener("input", updateCounts);

saveBtn.addEventListener("click", saveNote);

searchInput.addEventListener("input", searchNotes);

themeBtn.addEventListener("click", toggleTheme);

/* =========================
   SAVE NOTE
========================= */

async function saveNote() {

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        alert("Please enter both title and content.");
        return;
    }

    try {

        if (editId) {

            await fetch(`${API_URL}/${editId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    content
                })
            });

            editId = null;
            saveBtn.textContent = "Save Note";

        } else {

            await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    content
                })
            });
        }

        clearForm();
        loadNotes();

    } catch (error) {

        console.error(error);

        alert("Failed to save note.");
    }
}

/* =========================
   LOAD NOTES
========================= */

async function loadNotes() {

    try {

        const response = await fetch(API_URL);

        const notes = await response.json();

        allNotes = notes;

        renderNotes(notes);

    } catch (error) {

        console.error(error);

        notesContainer.innerHTML = `
            <div class="note-card">
                <h3>Error</h3>
                <p>Unable to load notes.</p>
            </div>
        `;
    }
}

/* =========================
   RENDER NOTES
========================= */

function renderNotes(notes) {

    notesContainer.innerHTML = "";

    if (notes.length === 0) {

        notesContainer.innerHTML = `
            <div class="note-card">
                <h3>📝 No Notes Yet</h3>
                <p>Create your first note.</p>
            </div>
        `;

        return;
    }

    const pinnedNotes = notes.filter(note => note.pinned);
    const normalNotes = notes.filter(note => !note.pinned);

    pinnedNotes.forEach(createCard);
    normalNotes.forEach(createCard);
}

/* =========================
   CREATE CARD
========================= */

function createCard(note) {

    const card = document.createElement("div");

    card.className = "note-card";

    const formattedDate = new Date(
        note.created_at
    ).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    });

    card.innerHTML = `
        <h3>
            ${note.pinned ? "📌 " : ""}
            ${note.title}
        </h3>

        <p>${note.content}</p>

        <div class="note-date">
            🕒 ${formattedDate}
        </div>

        <div class="actions">

            <button
                class="edit-btn"
                onclick="editNote(${note.id})">
                Edit
            </button>

            <button
                class="delete-btn"
                onclick="deleteNote(${note.id})">
                Delete
            </button>

            <button
                class="pin-btn"
                onclick="togglePin(${note.id})">
                ${note.pinned ? "Unpin" : "Pin"}
            </button>

            <button
                class="copy-btn"
                onclick="copyNote(\`${note.content}\`)">
                Copy
            </button>

        </div>
    `;

    notesContainer.appendChild(card);
}

/* =========================
   EDIT NOTE
========================= */

function editNote(id) {

    const note = allNotes.find(
        note => note.id === id
    );

    if (!note) return;

    titleInput.value = note.title;
    contentInput.value = note.content;

    editId = id;

    saveBtn.textContent = "Update Note";

    updateCounts();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================
   DELETE NOTE
========================= */

async function deleteNote(id) {

    const confirmDelete =
        confirm("Delete this note?");

    if (!confirmDelete) return;

    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    loadNotes();
}

/* =========================
   PIN NOTE
========================= */

async function togglePin(id) {

    await fetch(`${API_URL}/${id}/pin`, {
        method: "PATCH"
    });

    loadNotes();
}

/* =========================
   COPY NOTE
========================= */

function copyNote(text) {

    navigator.clipboard.writeText(text);

    alert("Note copied successfully!");
}

/* =========================
   SEARCH NOTES
========================= */

function searchNotes() {

    const value =
        searchInput.value.toLowerCase();

    const filtered =
        allNotes.filter(note =>
            note.title.toLowerCase().includes(value) ||
            note.content.toLowerCase().includes(value)
        );

    renderNotes(filtered);
}

/* =========================
   COUNTERS
========================= */

function updateCounts() {

    const text = contentInput.value;

    charCount.textContent =
        `Characters: ${text.length}`;

    const words =
        text.trim() === ""
            ? 0
            : text.trim()
                .split(/\s+/)
                .length;

    wordCount.textContent =
        `Words: ${words}`;
}

/* =========================
   CLEAR FORM
========================= */

function clearForm() {

    titleInput.value = "";
    contentInput.value = "";

    editId = null;

    saveBtn.textContent = "Save Note";

    updateCounts();
}

/* =========================
   THEME
========================= */

function toggleTheme() {

    document.body.classList.toggle("dark");

    const darkMode =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "darkMode",
        darkMode
    );

    themeBtn.textContent =
        darkMode ? "☀️" : "🌙";
}

function loadTheme() {

    const darkMode =
        localStorage.getItem("darkMode");

    if (darkMode === "true") {

        document.body.classList.add("dark");

        themeBtn.textContent = "☀️";
    }
}