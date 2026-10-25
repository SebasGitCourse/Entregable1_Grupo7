import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/crypto.js';
import { cargarUsuarios, eliminarArchivo } from '../middlewares/multer.middleware.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const archivoUsuarios = path.join(__dirname, '../data/users.json');
const carpetaAvatares = path.join(__dirname, '../../public/img/users');

// Obtener los usuarios
async function obtenerUsuarios() {
    const usuarios = await fs.readFile(archivoUsuarios, 'utf-8');
    return JSON.parse(usuarios);
}

// Convertir y validar el "ID" recibido.
function obtenerId(valorId) {
    const id = Number(valorId);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Evitar mostrar contraseña de usuario - Operador REST "..."
function ocultarContrasenia({ password, ...usuario }) {
    return usuario;
}

// Validar campos -> Texto
function textoValido(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

// Guardar los usuarios en el archivo JSON (users.json)
async function guardarUsuarios(usuarios) {
    await fs.writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2), 'utf-8');
}

// Endpoints y metodos HTTP -> Operaciones CRUD

//GET - Consultar a todos los usuarios
router.get("/", async (req, res) => {
    const usuarios = await obtenerUsuarios();
    res.status(202).json(usuarios);
});

//GET - Consultar usuario por "id"
router.get("/:id", async (req, res) => {
    const id = obtenerId(req.params.id);

    if (id == null) {
        return res.status(400).json({ error: 'Id inválido' });
    }

    const usuarios = await obtenerUsuarios();
    const usuarioId = usuarios.find(u => u.id === id);

    if (!usuarioId) {
        return res.status(404).json({ error: `Usuario con ID:${id} no encontrado.` });
    }

    res.status(200).json(ocultarContrasenia(usuarioId));
});

//POST - Registrar nuevo usuario
router.post("/", cargarUsuarios.single('avatar'), async (req, res) => {
    try {
        const { firstName, lastName, username, password } = req.body;

        if (![firstName, lastName, username, password].every(textoValido)) {
            await eliminarArchivo(req.file?.path);

            return res.status(400).json({
                error:
                    'Nombre (firstName), Apellido (lastName), Nombre Usuario (username) & Contraseña (password) son obligatorios.'
            });
        }

        const usuarios = await obtenerUsuarios();

        if (usuarios.some(u => u.username === username.trim())) {
            await eliminarArchivo(req.file?.path);

            return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
        }

        const usuario = {
            id: Math.max(0, ...usuarios.map(u => u.id)) + 1,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username.trim(),
            password: await hashPassword(password),
            avatar: req.file ? `/img/users/${req.file.filename}` : null
        };

        usuarios.push(usuario);

        await guardarUsuarios(usuarios);

        res.status(201).json(ocultarContrasenia(usuario));

    } catch (error) {
        await eliminarArchivo(req.file?.path);
        throw error;
    }
});

// PUT - Actualizar usuario
router.put('/:id', cargarUsuarios.single('avatar'), async (req, res) => {
    try {
        const id = obtenerId(req.params.id);

        if (id === null) {
            await eliminarArchivo(req.file?.path);
            return res.status(400).json({ error: 'ID inválido.' });
        }

        const usuarios = await obtenerUsuarios();
        const usuario = usuarios.find(u => u.id === id);

        if (!usuario) {
            await eliminarArchivo(req.file?.path);

            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const cambios = {};

        for (const campo of ['firstName', 'lastName', 'username', 'password']) {
            if (req.body[campo] !== undefined) {

                if (!textoValido(req.body[campo])) {
                    await eliminarArchivo(req.file?.path);

                    return res.status(400).json({ error: `El campo ${campo} es inválido` });
                }

                cambios[campo] = campo === 'password' ? await hashPassword(req.body[campo]) : req.body[campo].trim();
            }
        }

        if (Object.keys(cambios).length === 0 && !req.file) {
            return res.status(400).json({ error: 'No se enviaron datos para actualizar.' });
        }

        if (cambios.username && usuarios.some(u => u.id !== id && u.username === cambios.username)) {
            await eliminarArchivo(req.file?.path);

            return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
        }

        const avatarAnterior = usuario.avatar;

        Object.assign(usuario, cambios);

        if (req.file) {
            usuario.avatar = `/img/users/${req.file.filename}`;
        }

        await guardarUsuarios(usuarios);

        if (req.file && avatarAnterior?.startsWith('/img/users/')) {
            await eliminarArchivo(path.join(carpetaAvatares, path.basename(avatarAnterior)));
        }

        res.status(200).json(ocultarContrasenia(usuario));

    } catch (error) {
        await eliminarArchivo(req.file?.path);
        throw error;
    }
});

// DELETE - Eliminar un usuario
router.delete('/:id', async (req, res) => {
    const id = obtenerId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    const usuarios = await obtenerUsuarios();
    const indice = usuarios.findIndex(u => u.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const [usuarioEliminado] = usuarios.splice(indice, 1);

    await guardarUsuarios(usuarios);

    if (typeof usuarioEliminado.avatar === 'string' && usuarioEliminado.avatar.startsWith('/img/users/')) {
        await eliminarArchivo(path.join(carpetaAvatares, path.basename(usuarioEliminado.avatar)));
    }

    res.status(200).json({ mensaje: 'Usuario eliminado correctamente.' });
});

export default router;