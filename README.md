# SmartComedor

Sistema de gestión del Comedor Universitario

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Configuración

1. Crear base de datos PostgreSQL:
```sql
CREATE DATABASE smart_comedor;
```

2. Configurar variables de entorno en `server/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_comedor
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_key
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
```

3. Instalar dependencias:
```bash
cd server && npm install
cd client && npm install
```

4. Ejecutar el servidor:
```bash
cd server && npm run dev
```

5. Ejecutar el cliente:
```bash
cd client && npm run dev
```

## Roles

- **Estudiante**: Puede ver perfil, subir pagos, calificar servicio, ver noticias
- **Supervisor**: Puede buscar estudiantes y registrar almuerzos
- **Administrador**: Gestión completa del sistema

## Características

- Autenticación JWT con roles
- Recuperación de contraseña por email
- Importación de estudiantes desde Excel
- Cálculo automático de almuerzos ($2000 = 1 almuerzo)
- Sistema de calificaciones
- Registro de actividad de supervisores
- Envío automático de comprobantes por email
# SmartDinningRoom
