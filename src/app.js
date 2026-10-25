import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import usersRouter from './routes/users.router.js';
import petsRouter from './routes/pets.router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PUERTO = 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use("/api/users", usersRouter);
app.use("/api/pets", petsRouter);

app.use((req, res) => {
    res.status(404).send("404 - Ruta no encontrada");
});

// Manejo de errores del Servidor y de Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.status === 400 || error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: error.message })
    }

    console.error(error);

    res.status(500).json({ error: 'Error interno del servidor.' });
});



app.listen(PUERTO, () => {
    console.log("SERVIDOR FUNCIONANDO EN http://localhost:" + PUERTO);
});

