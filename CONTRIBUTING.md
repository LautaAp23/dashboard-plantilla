# Guía de Contribución - Flujo de Trabajo Git

## 📋 Estructura de Ramas

Este proyecto sigue un modelo de flujo de trabajo Git seguro con las siguientes ramas principales:

- **`main`**: Rama de producción. Solo contiene código probado y estable.
- **`develop`**: Rama de desarrollo. Aquí se integran los cambios antes de pasar a producción.

## 🔄 Flujo de Trabajo

### 1. **Obtener la última versión de desarrollo**

Antes de comenzar a trabajar, siempre actualiza tu rama `develop` local:

```bash
git checkout develop
git pull origin develop
```

### 2. **Crear una rama de feature**

Para trabajar en una nueva funcionalidad o corrección, crea una rama desde `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/descripcion-corta
```

**Convención de nombres:**
- `feature/nombre-feature` - Para nuevas funcionalidades
- `fix/nombre-bug` - Para correcciones de bugs
- `refactor/nombre-refactor` - Para refactorizaciones
- `docs/descripcion` - Para cambios de documentación

### 3. **Realizar commits en tu rama**

Desarrolla tu funcionalidad y haz commits frecuentes:

```bash
git add .
git commit -m "tipo: descripción breve"
```

**Tipos de commit recomendados:**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato de código (sin cambio de lógica)
- `refactor:` - Refactorización de código
- `perf:` - Mejoras de rendimiento
- `test:` - Agregación o modificación de tests

**Ejemplo:**
```bash
git commit -m "feat: agregar validación de formulario"
```

### 4. **Subir tu rama al repositorio remoto**

```bash
git push origin feature/descripcion-corta
```

### 5. **Crear un Pull Request (PR)**

1. Ve a [GitHub](https://github.com/LautaAp23/dashboard-plantilla)
2. Haz clic en "Pull requests" → "New pull request"
3. Selecciona:
   - **Base**: `develop`
   - **Compare**: tu rama (`feature/descripcion-corta`)
4. Completa el título y descripción del PR
5. Crea el PR

**Descripción de PR recomendada:**
```
## Descripción
Breve descripción de los cambios realizados

## Tipo de cambio
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Cambio en documentación
- [ ] Refactorización

## Cómo probar
Pasos para probar los cambios

## Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He probado los cambios localmente
- [ ] He actualizado la documentación si es necesario
```

### 6. **Revisión y aprobación**

- El código será revisado antes de ser aceptado
- Realiza los cambios solicitados si es necesario
- Una vez aprobado, el PR puede ser mergeado

### 7. **Merge a develop**

Una vez aprobado:

1. El PR se mergea a `develop` desde GitHub
2. Elimina tu rama local:
   ```bash
   git branch -D feature/descripcion-corta
   ```
3. Elimina tu rama remota:
   ```bash
   git push origin --delete feature/descripcion-corta
   ```

### 8. **De develop a main (Releases)**

Cuando `develop` es estable y listo para producción:

1. Crear un PR de `develop` → `main`
2. En el título incluir: `release: vX.X.X`
3. Una vez aprobado y testeado, mergear a `main`
4. Crear un tag de release en `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a vX.X.X -m "Descripción del release"
   git push origin vX.X.X
   ```

## 📝 Comandos Útiles

### Ver todas las ramas
```bash
git branch -a
```

### Ver el historial de commits
```bash
git log --oneline -n 10
```

### Actualizar tu rama con los últimos cambios de develop
```bash
git fetch origin
git rebase origin/develop
```

### Descartar cambios locales
```bash
git checkout .
```

### Ver cambios que has hecho
```bash
git diff
```

### Ver cambios antes de hacer commit
```bash
git diff --staged
```

## ⚠️ Reglas Importantes

✅ **SIEMPRE HACER:**
- Crear PRs y esperar aprobación antes de mergear a `develop`
- Escribir mensajes de commit claros y descriptivos
- Probar los cambios localmente antes de hacer push
- Mantener `main` siempre en estado estable

❌ **NUNCA HACER:**
- Hacer commit directo a `main` o `develop`
- Forzar push a ramas principales (`git push --force`)
- Ignorar revisiones de código
- Mergear sin probar

## 🆘 Ayuda y Preguntas

Si tienes dudas sobre el flujo de trabajo, consulta esta documentación o crea un issue en el repositorio.

---

**Última actualización:** Agosto 2026
