import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { cargarMascotas, eliminarArchivo } from '../middlewares/multer.middleware.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const archivoMascotas = path.join(__dirname, '../data/pets.json');
const carpetaImagenes = path.join(__dirname, '../../public/img/pets');

async function obtenerMascotas() {
    const mascotas = await fs.readFile(archivoMascotas, 'utf8');
    return JSON.parse(mascotas);
}

async function guardarMascotas(mascotas) {
    await fs.writeFile(archivoMascotas, JSON.stringify(mascotas, null, 2), 'utf8');
}

function textoValido(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

// Validar que la edad sea un entero no negativo.
function edadValida(valor) {
    const texto = String(valor ?? '').trim();
    return /^\d+$/.test(texto) && Number.isSafeInteger(Number(texto));
}

function obtenerId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Obtener las rutas de las imágenes subidas.
function rutasImagenes(req) {
    return (req.files || []).map(archivo => `/img/pets/${archivo.filename}`);
}

// Eliminar imágenes subidas si ocurre un error.
async function eliminarImagenesSubidas(req) {
    for (const archivo of req.files || []) {
        await eliminarArchivo(archivo.path);
    }
}

// Endpoints y metodos HTTP -> Operaciones CRUD

router.get('/', async (req, res) => {
    const mascotas = await obtenerMascotas();
    res.status(200).json(mascotas);
});

router.get('/:id', async (req, res) => {
    const id = obtenerId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    const mascotas = await obtenerMascotas();
    const mascota = mascotas.find(m => m.id === id);

    if (!mascota) {
        return res.status(404).json({ error: 'Mascota no encontrada.' });
    }

    res.status(200).json(mascota);
});

// Registrar una mascota con hasta cinco imágenes.
router.post('/', cargarMascotas.array('img', 5), async (req, res) => {
    try {
        const { especie, color, edad, sexo } = req.body;

        if (![especie, color, sexo].every(textoValido) || !edadValida(edad)) {
            await eliminarImagenesSubidas(req);

            return res.status(400).json({
                error: 'Especie, color, edad y sexo son obligatorios y deben ser válidos.'
            });
        }

        const mascotas = await obtenerMascotas();

        const mascota = {
            id: Math.max(0, ...mascotas.map(m => m.id)) + 1,
            especie: especie.trim(),
            color: color.trim(),
            edad: Number(edad),
            sexo: sexo.trim(),
            img: rutasImagenes(req)
        };

        mascotas.push(mascota);

        await guardarMascotas(mascotas);

        res.status(201).json(mascota);

    } catch (error) {
        await eliminarImagenesSubidas(req);
        throw error;
    }
});

router.put('/:id', cargarMascotas.array('img', 5), async (req, res) => {
    try {
        const id = obtenerId(req.params.id);

        if (id === null) {
            await eliminarImagenesSubidas(req);
            return res.status(400).json({ error: 'ID inválido.' });
        }

        const mascotas = await obtenerMascotas();
        const mascota = mascotas.find(m => m.id === id);

        if (!mascota) {
            await eliminarImagenesSubidas(req);
            return res.status(404).json({ error: 'Mascota no encontrada.' });
        }

        const cambios = {};

        for (const campo of ['especie', 'color', 'sexo']) {
            if (req.body[campo] !== undefined) {
                if (!textoValido(req.body[campo])) {
                    await eliminarImagenesSubidas(req);

                    return res.status(400).json({ error: `El campo ${campo} es inválido.` });
                }

                cambios[campo] = req.body[campo].trim();
            }
        }

        if (req.body.edad !== undefined) {
            if (!edadValida(req.body.edad)) {
                await eliminarImagenesSubidas(req);

                return res.status(400).json({ error: 'La edad debe ser un entero mayor o igual a cero.' });
            }

            cambios.edad = Number(req.body.edad);
        }

        if (Object.keys(cambios).length === 0 && (req.files || []).length === 0) {
            return res.status(400).json({ error: 'No se enviaron datos para actualizar.' });
        }

        const imagenesAnteriores = mascota.img;
        Object.assign(mascota, cambios);

        // Si llegan nuevas imágenes, reemplazan las anteriores.
        if ((req.files || []).length > 0) {
            mascota.img = rutasImagenes(req);
        }

        await guardarMascotas(mascotas);

        if ((req.files || []).length > 0) {
            for (const ruta of imagenesAnteriores) {
                if (ruta.startsWith('/img/pets/')) {
                    await eliminarArchivo(path.join(carpetaImagenes, path.basename(ruta)));
                }
            }
        }

        res.status(200).json(mascota);

    } catch (error) {
        await eliminarImagenesSubidas(req);
        throw error;
    }
});

router.delete('/:id', async (req, res) => {
    const id = obtenerId(req.params.id);

    if (id === null) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    const mascotas = await obtenerMascotas();
    const indice = mascotas.findIndex(m => m.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: 'Mascota no encontrada.' });
    }

    const [mascotaEliminada] = mascotas.splice(indice, 1);

    await guardarMascotas(mascotas);

    for (const ruta of mascotaEliminada.img || []) {
        if (typeof ruta === 'string' && ruta.startsWith('/img/pets/')) {
            await eliminarArchivo(path.join(carpetaImagenes, path.basename(ruta)));
        }
    }

    res.status(200).json({ mensaje: 'Mascota eliminada correctamente.' });
});

export default router;