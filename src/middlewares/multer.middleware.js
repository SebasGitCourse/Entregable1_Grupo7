
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuración de dónde se guardan las imágenes.
function crearAlmacenamiento(carpeta) {
    return multer.diskStorage({
        destination(req, file, callback) {
            callback(null, path.join(__dirname, '../../public/img', carpeta));
        },

        filename(req, file, callback) {
            const extension = path.extname(file.originalname).toLowerCase();
            callback(null, `${Date.now()}-${randomUUID()}${extension}`);
        }
    });
}

// Comprobar que el archivo enviado sea una imagen.
function validarImagen(req, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
        const error = new Error('Solo se permiten archivos de imagen.');
        error.status = 400;
        return callback(error);
    }

    callback(null, true);
}

// Configuración para subir avatares de usuarios.
export const cargarUsuarios = multer({
    storage: crearAlmacenamiento('users'),
    fileFilter: validarImagen
});

// Configuración para subir imágenes de mascotas.
export const cargarMascotas = multer({
    storage: crearAlmacenamiento('pets'),
    fileFilter: validarImagen
});

// Eliminar un archivo cuando: En caso de reemplazarse o descartarse.
export async function eliminarArchivo(ruta) {
    if (!ruta) return;

    try {
        await fs.unlink(ruta);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('No se pudo eliminar el archivo:', error);
        }
    }
}
