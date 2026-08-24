# GitHub Actions - Quick Reference

## 🚀 Quick Start

Los workflows se ejecutan **automáticamente** cuando:

| Evento | Workflows | Status |
|--------|-----------|--------|
| 📤 Push a `develop` | CI Pipeline | Automático |
| 📤 Push a `main` | CI Pipeline + Deploy | Automático |
| 🔀 PR a `develop` | PR Validation | Bloquea si falla |
| 🔀 PR a `main` | PR Validation | Bloquea si falla |

## 📊 Ver Status de Actions

1. Ve a **Actions** en tu repo
2. Verás todos los workflows ejecutándose
3. Haz clic en uno para ver detalles

## 🟢 Status Checks en PRs

En cada PR verás:

```
✅ build-and-test (Node 18.x) — Passed
✅ build-and-test (Node 20.x) — Passed  
✅ code-quality — Passed
✅ PR Validation — Passed
```

Si ves ❌, **NO puedes mergear** hasta arreglarlo.

## ⚙️ Configuración Requerida

### 1. Branch Protection Rules ✅
Ya están configuradas (main y develop protegidas)

### 2. Secrets para Deployment
Si usas Vercel:
```
Settings → Secrets and variables → Actions
+ New secret
  Name: VERCEL_TOKEN
  Value: <tu-token>
```

## 🔍 Debugging

### Ver logs de una acción fallida:

1. Ve a **Actions**
2. Haz clic en el workflow fallido
3. Haz clic en el job (ej: "build-and-test")
4. Expande los pasos para ver qué falló

### Comandos locales para debuggear:

```bash
# Build
pnpm build

# Lint
pnpm lint

# Ver qué valida el workflow
cat .github/workflows/ci.yml
```

## 🎯 Flujo de Trabajo Seguro

```
1. Creas feature/nueva-funcionalidad
   ↓
2. Haces push (GitHub Actions se ejecuta)
   ↓
3. Creas PR a develop
   ↓
4. GitHub Actions valida automáticamente
   ↓
5. Si ✅ Aprobado → Puedes mergear
   Si ❌ Fallido → Arregla y haz push nuevamente
   ↓
6. Mergeas a develop
   ↓
7. Cuando esté listo: PR develop → main
   ↓
8. Mergeas a main → Deploy automático 🚀
```

## ✅ Checklist antes de hacer PR

- [ ] Corriste `pnpm build` localmente
- [ ] Corriste `pnpm lint` localmente
- [ ] No hay errores de TypeScript
- [ ] Pusheaste cambios a la rama
- [ ] Esperas a que Actions pase

## 🆘 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `pnpm: not found` | Problema de instalación | No es tu problema, es del CI |
| `Build failed` | TypeScript/Syntax error | Corre `pnpm build` localmente |
| `Lint failed` | Code style issues | Corre `pnpm lint --fix` |
| `Permission denied` | Falta secret | Agrega VERCEL_TOKEN |

## 📞 Ayuda

- Ver logs completos: **Actions** → haz clic en workflow
- Documentación completa: Ver `CI_CD_GUIDE.md`
- Preguntas: Crea un issue en el repo

---

**Status Actual:** ✅ Todos los workflows operacionales
