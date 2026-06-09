# Backend Skill — SmartDiningRoom

## Estructura de controllers
- Todos los controllers son funciones async que reciben `(req: Request, res: Response, next: NextFunction)`.
- Los errores siempre pasan por `next(error)` — nunca responder directamente con 500 en el controller.
- Respetar los códigos HTTP: 200 GET, 201 POST, 204 DELETE, 400 validación, 401 auth, 403 permisos, 404 no encontrado.

## Manejo de errores
- Usar una clase `AppError extends Error` con `statusCode` y `isOperational`.
- El middleware `errorHandler` central transforma errores en respuestas JSON consistentes.
- Formato de error: `{ success: false, message: string, errors?: string[] }`.

## Modelos Sequelize
- Nunca usar `sync({ force: true })` en producción.
- Toda modificación de esquema necesita una migration (`sequelize migration:create`).
- Los modelos usan `timestamps: true` por defecto (`createdAt`, updatedAt).
- Naming: tablas en `snake_case` plural, modelos en `PascalCase` singular.

## Autenticación JWT
- Access token payload mínimo: `{ userId, role, iat, exp }`.
- Refresh token almacenado en DB con campo `revokedAt` para invalidación.
- Middleware `authenticate` valida access token; `requireRole('admin')` para rutas protegidas.

## TOTP (speakeasy)
- Secreto generado con `speakeasy.generateSecret({ length: 20 })`.
- Verificación con ventana de ±1 intervalo: `window: 1`.
- El secreto se guarda cifrado en la columna `totpSecret` del usuario.

## Tesseract.js (OCR)
- Worker se inicializa una sola vez al arrancar el servidor (singleton).
- Los archivos se guardan temporalmente en `/tmp/`, se eliminan después del procesamiento.
- Formatos soportados: PNG, JPEG, PDF (convertir a imagen primero con sharp o pdf2pic).
- Devolver siempre el texto extraído + confidence score.

## Reglas generales
- Usar `async/await`, nunca callbacks en código nuevo.
- Variables de entorno accedidas vía objeto `config` centralizado, nunca `process.env` directo.
- No hardcodear puertos, URLs ni credenciales — todo en `.env`.
- Logging con un logger estructurado (winston o pino), nunca `console.log` en producción.
