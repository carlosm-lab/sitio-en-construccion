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

## 🚀 Despliegue en Vercel (Recomendado)

Esta plantilla es 100% compatible con **Vercel** sin necesidad de configuración adicional ni comandos de build.

### Opción 1: Despliegue con 1 Clic
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcarlosm-lab%2Fsitio-en-construccion)

### Opción 2: Desde el Panel de Vercel
1. Ingresa a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Importa el repositorio **`carlosm-lab/sitio-en-construccion`**.
4. En **Framework Preset**, déjalo en **Other** (se detecta automáticamente como estático).
5. Haz clic en **Deploy**. En menos de 20 segundos tu sitio estará online con SSL gratuito y CDN global.

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
