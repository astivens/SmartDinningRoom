# SmartComedor

Sistema de gestión del Comedor Universitario. Permite registrar estudiantes, gestionar pagos, supervisar almuerzos y administrar el servicio de comedor.

---

## Stack tecnológico

| Capa       | Tecnología                                   |
|------------|----------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite + Material UI   |
| Backend    | Node.js + Express + TypeScript               |
| Base datos | PostgreSQL 14 (Sequelize ORM)                |
| Auth       | JWT (access + refresh token)                 |
| Email      | Nodemailer (SMTP Gmail)                      |
| Docker     | Docker Compose (perfiles `dev` y `prod`)     |

---

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/) — **recomendado**
- **O bien** Node.js 20+ y PostgreSQL 14+ para correr en local sin Docker

---

## Inicio rápido con Docker

### 1. Clonar el repositorio

```bash
git clone git@github.com:astivens/SmartDinningRoom.git
cd SmartDinningRoom
```

### 2. Configurar variables de entorno

```bash
cp .env.example server/.env
```

Edita `server/.env` y completa los valores obligatorios:

```env
JWT_SECRET=pon_aqui_un_secreto_largo
JWT_REFRESH_SECRET=otro_secreto_largo
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password_de_gmail
```

> El resto de valores por defecto funcionan para desarrollo local.

### 3. Levantar el entorno

**Desarrollo** (hot-reload en cliente y servidor):

```bash
docker compose --profile dev up --build
```

| Servicio  | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:5174   |
| Backend   | http://localhost:3002   |
| PostgreSQL| localhost:5433          |

**Producción** (builds optimizados + nginx):

```bash
docker compose --profile prod up --build
```

| Servicio  | URL                   |
|-----------|-----------------------|
| Frontend  | http://localhost      |
| Backend   | http://localhost:3002 |

---

## Inicio manual (sin Docker)

### 1. Base de datos

Tener PostgreSQL corriendo y crear la base de datos:

```sql
CREATE DATABASE smart_comedor;
```

### 2. Backend

```bash
cd server
cp ../.env.example .env   # edita los valores
npm install
npm run dev               # inicia en http://localhost:3002
```

### 3. Frontend

```bash
cd client
npm install
npm run dev               # inicia en http://localhost:5174
```

---

## Variables de entorno (`server/.env`)

| Variable               | Descripción                          | Ejemplo                        |
|------------------------|--------------------------------------|--------------------------------|
| `PORT`                 | Puerto del servidor                  | `3002`                         |
| `NODE_ENV`             | Entorno                              | `development` / `production`   |
| `DB_HOST`              | Host de PostgreSQL                   | `localhost` (o `postgres` en Docker) |
| `DB_PORT`              | Puerto de PostgreSQL                 | `5433`                         |
| `DB_NAME`              | Nombre de la base de datos           | `smart_comedor`                |
| `DB_USER`              | Usuario de PostgreSQL                | `postgres`                     |
| `DB_PASSWORD`          | Contraseña de PostgreSQL             | —                              |
| `JWT_SECRET`           | Secreto para tokens de acceso        | cadena larga aleatoria         |
| `JWT_REFRESH_SECRET`   | Secreto para tokens de refresco      | cadena larga aleatoria         |
| `JWT_EXPIRES_IN`       | Expiración del token de acceso       | `15m`                          |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token      | `7d`                           |
| `SMTP_HOST`            | Servidor SMTP                        | `smtp.gmail.com`               |
| `SMTP_PORT`            | Puerto SMTP                          | `587`                          |
| `SMTP_USER`            | Correo emisor                        | `tu@gmail.com`                 |
| `SMTP_PASS`            | App password de Gmail                | —                              |
| `CLIENT_URL`           | URL del frontend (para CORS)         | `http://localhost:5174`        |

---

## Scripts disponibles

### Servidor (`server/`)

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Correr el build de producción
npm test             # Ejecutar todos los tests
npm run test:unit    # Solo tests unitarios
npm run test:integration  # Solo tests de integración
npm run test:coverage     # Reporte de cobertura
npm run db:seed      # Poblar la base de datos con datos de prueba
```

### Cliente (`client/`)

```bash
npm run dev     # Servidor de desarrollo Vite
npm run build   # Build de producción
npm run preview # Vista previa del build
npm run lint    # Revisar linting
```

---

## Estructura del proyecto

```
SmartDinningRoom/
├── client/                  # Frontend React + Vite
│   ├── src/
│   │   ├── api/             # Clientes HTTP (axios)
│   │   ├── auth/            # Proveedor de autenticación y rutas protegidas
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Vistas por rol (admin, student, supervisor, auth)
│   │   ├── store/           # Estado global
│   │   └── types/           # Tipos TypeScript compartidos
│   ├── Dockerfile
│   └── nginx.conf           # Config nginx para producción
│
├── server/                  # Backend Express + Sequelize
│   ├── src/
│   │   ├── config/          # Conexión a la base de datos
│   │   ├── controllers/     # Lógica de negocio por entidad
│   │   ├── middleware/       # Auth JWT, upload de archivos
│   │   ├── models/          # Modelos Sequelize
│   │   ├── routes/          # Definición de endpoints
│   │   ├── services/        # Servicios (email, auditoría, backup)
│   │   └── tests/           # Tests unitarios e integración
│   └── Dockerfile
│
├── diagrams/                # Diagramas PlantUML del sistema
├── docs/                    # Documentación e imágenes
├── docker-compose.yml       # Orquestación de servicios
└── .env.example             # Plantilla de variables de entorno
```

---

## Roles del sistema

| Rol            | Permisos principales                                              |
|----------------|-------------------------------------------------------------------|
| **Estudiante** | Ver perfil, registrar pagos, calificar servicio, ver noticias     |
| **Supervisor** | Buscar estudiantes, registrar asistencia a almuerzos              |
| **Admin**      | Gestión completa: usuarios, pagos, menús, reportes, auditoría     |

---

## Flujo de trabajo para contribuir

1. Crear una rama desde `main` con nombre descriptivo:

```bash
git checkout -b feature/nombre-de-la-funcionalidad
```

2. Hacer los cambios y commitear:

```bash
git add .
git commit -m "feat: descripción corta del cambio"
```

3. Subir la rama y abrir un Pull Request:

```bash
git push origin feature/nombre-de-la-funcionalidad
```

> Convención de commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
