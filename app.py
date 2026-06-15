from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = "notes.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


init_db()


@app.route("/")
def home():
    return jsonify({
        "message": "Quick Notes API Running"
    })


@app.route("/notes", methods=["GET"])
def get_notes():
    conn = get_db_connection()

    notes = conn.execute("""
        SELECT * FROM notes
        ORDER BY pinned DESC, created_at DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(note) for note in notes])


@app.route("/notes", methods=["POST"])
def add_note():

    data = request.get_json()

    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({
            "error": "Title and Content required"
        }), 400

    conn = get_db_connection()

    conn.execute("""
        INSERT INTO notes(title, content)
        VALUES (?, ?)
    """, (title, content))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Note added successfully"
    })


@app.route("/notes/<int:id>", methods=["PUT"])
def update_note(id):

    data = request.get_json()

    title = data.get("title")
    content = data.get("content")

    conn = get_db_connection()

    conn.execute("""
        UPDATE notes
        SET title=?, content=?
        WHERE id=?
    """, (title, content, id))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Note updated successfully"
    })


@app.route("/notes/<int:id>", methods=["DELETE"])
def delete_note(id):

    conn = get_db_connection()

    conn.execute("""
        DELETE FROM notes
        WHERE id=?
    """, (id,))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Note deleted successfully"
    })


@app.route("/notes/<int:id>/pin", methods=["PATCH"])
def toggle_pin(id):

    conn = get_db_connection()

    note = conn.execute("""
        SELECT pinned
        FROM notes
        WHERE id=?
    """, (id,)).fetchone()

    if not note:
        conn.close()
        return jsonify({
            "error": "Note not found"
        }), 404

    new_value = 0 if note["pinned"] else 1

    conn.execute("""
        UPDATE notes
        SET pinned=?
        WHERE id=?
    """, (new_value, id))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Pin updated"
    })


if __name__ == "__main__":
    app.run(debug=True)