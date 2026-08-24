# 🚀 Flujo de Trabajo Rápido

## Resumen del Flujo Git

```
┌─────────────────────────────────────────────────────────────┐
│                      ESTRUCTURA GIT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  main (PRODUCCIÓN)                                         │
│    ↑                                                        │
│    │ (PR de release cuando está listo)                    │
│    │                                                        │
│  develop (DESARROLLO/TESTING)                             │
│    ↑                                                        │
│    │ (PRs de features/fixes)                              │
│    │                                                        │
│  feature/* (RAMAS DE TRABAJO)                             │
│  fix/*                                                      │
│  refactor/*                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Checklist Rápido

### Antes de empezar
- [ ] `git checkout develop`
- [ ] `git pull origin develop`

### Durante el desarrollo
- [ ] Crear rama: `git checkout -b feature/mi-feature`
- [ ] Hacer commits con mensajes claros
- [ ] Hacer push: `git push origin feature/mi-feature`
- [ ] Probar cambios localmente

### Cuando termino
- [ ] Crear PR: `develop` ← `feature/mi-feature`
- [ ] Esperar revisión de código
- [ ] Hacer cambios si se solicita
- [ ] Mergear PR a `develop`
- [ ] Eliminar rama: `git push origin --delete feature/mi-feature`

### Release a Producción
- [ ] Asegurar `develop` está estable
- [ ] Crear PR: `main` ← `develop`
- [ ] Título: `release: vX.X.X`
- [ ] Mergear a `main`
- [ ] Crear tag: `git tag -a vX.X.X`

## 🔗 Comandos Esenciales

```bash
# Clonar repositorio
git clone https://github.com/LautaAp23/dashboard-plantilla.git

# Ver ramas disponibles
git branch -a

# Cambiar a develop
git checkout develop
git pull origin develop

# Crear y cambiar a nueva rama
git checkout -b feature/mi-feature

# Ver cambios
git status
git diff

# Hacer commit
git add .
git commit -m "feat: descripción"

# Subir cambios
git push origin feature/mi-feature

# Actualizar rama con cambios de develop
git fetch origin
git rebase origin/develop

# Ver historial
git log --oneline -n 10

# Eliminar rama local
git branch -D feature/mi-feature

# Eliminar rama remota
git push origin --delete feature/mi-feature
```

## 🎯 Reglas de Oro

| ✅ HACER | ❌ NO HACER |
|---------|-----------|
| PRs antes de mergear | Push directo a main/develop |
| Commits descriptivos | Commits sin mensaje |
| Probar localmente | Mergear sin probar |
| Mantener main estable | Force push a ramas principales |
| Seguir convenciones | Mensajes de commit aleatorios |

## 🏷️ Convención de Nombres

```
feature/nombre-descriptivo      → Nueva funcionalidad
fix/nombre-del-bug              → Corrección de bug
refactor/nombre-refactor        → Refactorización de código
docs/descripcion                → Cambios de documentación
```

## 💬 Convención de Commits

```
feat:    Nueva funcionalidad
fix:     Corrección de bug
docs:    Cambios en documentación
style:   Formato de código
refactor: Refactorización
perf:    Mejoras de rendimiento
test:    Cambios en tests

Ejemplo: git commit -m "feat: agregar validación de email"
```

---

📖 Para más detalles, ver **CONTRIBUTING.md**
