# 🚀 Plantilla de Sitio Web en Construcción (Under Construction / Coming Soon)

Una plantilla web moderna, ligera y responsiva para páginas de **"Próximamente"** o **"Sitio en Construcción"**, lista para desplegar en **GitHub Pages**, Vercel, Netlify o cualquier servidor web.

![Vista Previa](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Características

- 🎨 **Diseño Moderno & Glassmorphism:** Fondo dinámico con efecto de orbes de luz y rejilla sutil.
- ⏳ **Cuenta Regresiva Dinámica:** Reloj configurable en días, horas, minutos y segundos.
- 📊 **Barra de Progreso Interactiva:** Muestra el avance actual del proyecto y sus fases principales (Planificación, Diseño, Desarrollo, Lanzamiento).
- ✉️ **Formulario de Suscripción / Notificación:** Captura correos con validación de sintaxis y persistencia local (`localStorage`).
- 📱 **100% Responsivo:** Adaptado para teléfonos móviles, tablets y pantallas de escritorio.
- ⚡ **Sin dependencias pesadas:** HTML5, CSS3 puro y JavaScript Vanilla. Carga ultrarrápida.
- 🔗 **Enlaces a Redes Sociales:** Accesos directos a Twitter/X, Instagram, GitHub, LinkedIn y correo directo.

---

## 📁 Estructura del Proyecto

```text
├── index.html       # Estructura principal y contenido
├── style.css        # Estilos modernos con variables CSS y animaciones
├── script.js        # Lógica de cuenta regresiva y formulario
└── README.md        # Documentación de uso y personalización
```

---

## 🛠️ Personalización Rápida

### 1. Cambiar la Fecha del Lanzamiento
En [script.js](file:///c:/Users/usuar/Desktop/.arte/script.js#L20-L28), puedes modificar la fecha objetivo por la de tu evento o apertura:

```javascript
// Ejemplo para fijar una fecha específica:
const targetDateMs = new Date('2026-12-31T00:00:00').getTime();
```

### 2. Cambiar los Enlaces de Redes Sociales
En [index.html](file:///c:/Users/usuar/Desktop/.arte/index.html#L130-L160), actualiza los atributos `href` con tus perfiles:

```html
<a href="https://instagram.com/tu_cuenta" ...>
<a href="https://twitter.com/tu_cuenta" ...>
<a href="mailto:tu-correo@dominio.com" ...>
```

### 3. Ajustar el Porcentaje de Progreso
En [index.html](file:///c:/Users/usuar/Desktop/.arte/index.html#L55-L65), cambia el valor `82%` y el ancho `style="width: 82%;"`:

```html
<span class="progress-percent">85%</span>
<div class="progress-fill" style="width: 85%;"></div>
```

---

## 🌐 Publicar en GitHub Pages

Para ver tu sitio en vivo gratis usando GitHub Pages:
1. Ve al repositorio en GitHub.
2. Entra a **Settings** > **Pages** (en el menú lateral izquierdo).
3. En **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`.
5. Haz clic en **Save**. En unos minutos tu sitio estará en línea en:
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT. ¡Siéntete libre de usarlo y adaptarlo para tus propios proyectos!
