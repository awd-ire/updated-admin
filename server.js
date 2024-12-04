const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'dilip', // Replace with your MySQL username
    password: '3615', // Replace with your MySQL password
    database: 'demo', // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// File storage configuration for circulars
const storageCirculars = multer.diskStorage({
    destination: './public/uploads/circulars',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const uploadCircular = multer({ storage: storageCirculars });

// File storage configuration for notes
const storageNotes = multer.diskStorage({
    destination: './public/uploads/notes',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const uploadNote = multer({ storage: storageNotes });

// Route to upload circular
app.post('/upload-circular', uploadCircular.single('circular_file'), (req, res) => {
    const circularTitle = req.body.circular_title;
    const filePath = `/uploads/circulars/${req.file.filename}`;

    if (!circularTitle || !req.file) {
        return res.status(400).send('Circular title and file are required');
    }

    const sql = 'INSERT INTO circulars (circular_title, file_url) VALUES (?, ?)';
    db.query(sql, [circularTitle, filePath], (err) => {
        if (err) {
            console.error('Error inserting circular:', err);
            return res.status(500).send('Failed to upload circular');
        }
        res.send('Circular uploaded successfully');
    });
});

// Route to upload note
app.post('/upload-note', uploadNote.single('note'), (req, res) => {
    const subjectName = req.body.subject_name;
    const filePath = `/uploads/notes/${req.file.filename}`;

    if (!subjectName || !req.file) {
        return res.status(400).send('Subject name and file are required');
    }

    const sql = 'INSERT INTO notes (subject_name, notes_url) VALUES (?, ?)';
    db.query(sql, [subjectName, filePath], (err) => {
        if (err) {
            console.error('Error inserting note:', err);
            return res.status(500).send('Failed to upload note');
        }
        res.send('Note uploaded successfully');
    });
});

// Route to fetch all circulars
app.get('/circulars', (req, res) => {
    const sql = 'SELECT circular_id, circular_title FROM circulars';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving circulars:', err);
            return res.status(500).send('Error retrieving circulars');
        }
        res.json(results);
    });
});

// Route to fetch all notes
app.get('/notes', (req, res) => {
    const sql = 'SELECT notes_id, subject_name FROM notes';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error retrieving notes:', err);
            return res.status(500).send('Error retrieving notes');
        }
        res.json(results);
    });
});

// Route to download circular
app.get('/download-circular/:id', (req, res) => {
    const circularId = req.params.id;
    const sql = 'SELECT file_url FROM circulars WHERE circular_id = ?';

    db.query(sql, [circularId], (err, result) => {
        if (err || result.length === 0) {
            console.error('Error finding circular:', err);
            return res.status(404).send('Circular not found');
        }

        const filePath = path.join(__dirname, 'public', result[0].file_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        res.download(filePath);
    });
});

// Route to download note
app.get('/download-note/:id', (req, res) => {
    const noteId = req.params.id;
    const sql = 'SELECT notes_url FROM notes WHERE notes_id = ?';

    db.query(sql, [noteId], (err, result) => {
        if (err || result.length === 0) {
            console.error('Error finding note:', err);
            return res.status(404).send('Note not found');
        }

        const filePath = path.join(__dirname, 'public', result[0].notes_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        res.download(filePath);
    });
});

// Route to delete circular
app.delete('/circulars/:id', (req, res) => {
    const circularId = req.params.id;
    const sql = 'SELECT file_url FROM circulars WHERE circular_id = ?';

    db.query(sql, [circularId], (err, result) => {
        if (err || result.length === 0) {
            console.error('Error finding circular:', err);
            return res.status(404).send('Circular not found');
        }

        const filePath = path.join(__dirname, 'public', result[0].file_url);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).send('Failed to delete file');
            }

            const deleteSql = 'DELETE FROM circulars WHERE circular_id = ?';
            db.query(deleteSql, [circularId], (err) => {
                if (err) {
                    console.error('Error deleting circular record:', err);
                    return res.status(500).send('Failed to delete circular');
                }
                res.send('Circular deleted successfully');
            });
        });
    });
});

// Route to delete note
app.delete('/notes/:id', (req, res) => {
    const noteId = req.params.id;
    const sql = 'SELECT notes_url FROM notes WHERE notes_id = ?';

    db.query(sql, [noteId], (err, result) => {
        if (err || result.length === 0) {
            console.error('Error finding note:', err);
            return res.status(404).send('Note not found');
        }

        const filePath = path.join(__dirname, 'public', result[0].notes_url);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).send('Failed to delete file');
            }

            const deleteSql = 'DELETE FROM notes WHERE notes_id = ?';
            db.query(deleteSql, [noteId], (err) => {
                if (err) {
                    console.error('Error deleting note record:', err);
                    return res.status(500).send('Failed to delete note');
                }
                res.send('Note deleted successfully');
            });
        });
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
