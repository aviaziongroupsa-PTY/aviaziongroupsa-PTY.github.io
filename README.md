# Portal RRHH Aviazion Group

Portal de Recursos Humanos para Aviazion Group Panamá — accesos rápidos a formularios y calculadoras laborales.

**URL de producción:** https://aviaziongroupsa-pty.github.io

---

## ¿Cómo actualizar un link de formulario?

1. Ir a GitHub → archivo `content/content.json`
2. Clic en el ícono de lápiz (editar)
3. Cambiar el valor de `"url"` al link real del formulario (Google Forms, Microsoft Forms, etc.)
4. Clic en **"Commit changes"**

El sitio se actualiza automáticamente en 2–3 minutos.

Si un acceso todavía no tiene link, deja `"url": ""`: la tarjeta se muestra como **Próximamente** y no lleva a ningún lado. Nunca publiques un link de relleno.

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

Íconos disponibles: `user-plus`, `clock`, `file-text`, `dollar-sign`, `briefcase`, `receipt`, `calendar`, `help-circle`, `person-document`, `handshake`, `wrench`.

---

## Comandos de desarrollo

```bash
npm run dev      # Servidor local en http://localhost:4321
npm test         # Pruebas de las calculadoras
npm run build    # Build de producción (output en ./dist/)
npm run preview  # Preview del build
```

Un push a `main` publica en producción: el workflow corre las pruebas, compila y despliega a GitHub Pages.

Las fórmulas de las calculadoras viven solo en `src/lib/calculations.ts` y sus casos de prueba en `tests/calculations.test.ts`.
