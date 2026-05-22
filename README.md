# Portal RRHH Aviazion Group

Portal de Recursos Humanos para Aviazion Group Panamá — accesos rápidos a formularios y calculadoras laborales.

**URL de producción:** https://aviaziongroupsa-pty.github.io

---

## ¿Cómo actualizar un link de formulario?

1. Ir a GitHub → archivo `content/content.json`
2. Clic en el ícono de lápiz (editar)
3. Cambiar el valor de `"url"` al link real de Google Forms
4. Clic en **"Commit changes"**

El sitio se actualiza automáticamente en 2–3 minutos.

---

## ¿Cómo agregar una pregunta al FAQ?

En `content/content.json`, agregar un nuevo objeto al array `"faq"`:

```json
{
  "id": 8,
  "question": "Tu pregunta aquí",
  "answer": "La respuesta aquí"
}
```

El `id` debe ser un número único (mayor al último existente).

---

## ¿Cómo agregar un nuevo acceso rápido?

En `content/content.json`, agregar un nuevo objeto al array `"quickLinks"`:

```json
{
  "id": "nombre-unico",
  "title": "Nombre del formulario",
  "description": "Descripción corta",
  "icon": "file-text",
  "url": "https://link-al-formulario",
  "category": "Categoría"
}
```

Íconos disponibles: `user-plus`, `clock`, `file-text`, `dollar-sign`, `briefcase`, `receipt`, `calendar`.

---

## Comandos de desarrollo

```bash
npm run dev      # Servidor local en http://localhost:4321
npm run build    # Build de producción (output en ./dist/)
npm run preview  # Preview del build
```
