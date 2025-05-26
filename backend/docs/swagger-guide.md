# Guía de Swagger para Agricoventas API

## Introducción

Swagger (OpenAPI) es una herramienta que ayuda a diseñar, construir, documentar y consumir APIs REST. Esta guía explica cómo acceder y utilizar la documentación de la API de Agricoventas.

## Acceso a la documentación

Una vez que el servidor está en ejecución, puedes acceder a la documentación de la API en la siguiente URL:

```
http://localhost:3000/api-docs
```

También puedes obtener la definición de OpenAPI en formato JSON en:

```
http://localhost:3000/api-docs.json
```

## Estructura de la documentación

La documentación está organizada en varias secciones:

1. **Información general**: Versión de la API, contacto y descripción.
2. **Servidores**: URLs disponibles para interactuar con la API.
3. **Autenticación**: Método para autenticarse utilizando JWT.
4. **Endpoints**: Agrupados por etiquetas (Auth, Users).
5. **Esquemas**: Definiciones de los objetos utilizados en la API.

## Autenticación

Para probar endpoints protegidos:

1. Primero, autentícate usando el endpoint `/api/auth/login`.
2. Copia el `accessToken` de la respuesta.
3. Haz clic en el botón "Authorize" en la parte superior de la página.
4. Ingresa el token en el formato: `Bearer tu-token-aquí`.
5. Haz clic en "Authorize" y luego en "Close".

Ahora podrás probar los endpoints protegidos.

## Endpoints disponibles

### Autenticación

- `POST /api/auth/register`: Registra un nuevo usuario
- `POST /api/auth/login`: Inicia sesión con un usuario existente
- `POST /api/auth/logout`: Cierra la sesión del usuario actual
- `POST /api/auth/refresh`: Refresca el token de acceso
- `GET /api/auth/profile`: Obtiene el perfil del usuario actual

### Usuarios

- `GET /api/users`: Obtiene todos los usuarios (solo admin)
- `GET /api/users/{id}`: Obtiene un usuario por su ID
- `PUT /api/users/{id}`: Actualiza un usuario
- `DELETE /api/users/{id}`: Elimina un usuario

## Probando endpoints

Para probar un endpoint:

1. Haz clic en el endpoint que deseas probar
2. Haz clic en "Try it out"
3. Completa los parámetros requeridos
4. Haz clic en "Execute"
5. Verás la solicitud curl, la URL, el código de respuesta y el cuerpo de la respuesta

## Códigos de estado HTTP

- **200**: Éxito
- **201**: Recurso creado
- **400**: Solicitud incorrecta
- **401**: No autorizado (falta autenticación)
- **403**: Prohibido (falta autorización)
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

## Esquemas comunes

- **User**: Información de usuario
- **LoginRequest**: Credenciales de inicio de sesión
- **RegisterRequest**: Datos para registrar un usuario
- **AuthResponse**: Respuesta de autenticación con token
- **ErrorResponse**: Estructura de respuesta de error 