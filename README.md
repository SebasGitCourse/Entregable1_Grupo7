📌 Entregable 1 - Grupo 7

API REST desarrollada con Node.js y Express para gestionar
usuarios y mascotas mediante archivos JSON.

Permite realizar operaciones CRUD, subir imágenes con Multer,
proteger contraseñas con Crypto y consultar registros desde
una interfaz web responsive.

📌 Requisitos

- Node.js 18 o superior
- npm

📌 Instalación y ejecución

1. Descargar o clonar el repositorio.
2. Abrir una terminal en la carpeta del proyecto.
3. Instalar las dependencias:

   npm install

4. Iniciar el servidor:

   npm start

El servidor estará disponible en:
http://localhost:8080

La interfaz visual se abre desde esa misma dirección. 💻

📌 Endpoints

Usuarios ( Método | Ruta )
GET  	/api/users 
GET  	/api/users/:id 
POST  	/api/users 
PUT  	/api/users/:id 
DELETE  /api/users/:id 

Mascotas ( Método | Ruta )
GET  	/api/pets 
GET  	/api/pets/:id 
POST  	/api/pets 
PUT  	/api/pets/:id 
DELETE  /api/pets/:id 

📌 Pruebas

Los endpoints pueden probarse con Postman.

Para POST y PUT con imágenes, utilizar Body -> form-data:

- Usuarios: campo de archivo 'avatar' (una imagen).
- Mascotas: campo de archivo 'img' (máximo cinco imágenes).

El repositorio incluye registros de prueba en 'src/data/users.json' y 'src/data/pets.json', junto con sus imágenes en 'public/img/'.
