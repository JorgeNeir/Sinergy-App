# Sinergy Inventario - Sistema de Gestión de Inventario

## Descripción del Proyecto

Aplicación web para gestión de inventario multi-sede de la Clínica Estética Sinergy. Permite:
- Gestión de insumos por sede (agregar, editar, eliminar, importar desde Excel)
- Control de servicios con recetas que deducen automáticamente el inventario
- Registro de tratamientos realizados con deductiva de stock en tiempo real
- Alertas de stock bajo
- Acceso de emergencia local (break-glass)
- Panel de administración con gestión de usuarios

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend | Next.js Server Actions |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| ORM | Prisma 5 |
| Autenticación | NextAuth.js (Credentials + Google Provider opcional) |
| Infra as Code | Terraform |
| Contenedores | Docker (multi-stage) |
| Cloud | AWS App Runner, ECR, RDS PostgreSQL |

---

## Desarrollo Local

### 1. Requisitos Previos

- Node.js 20.x o superior
- npm 10.x

### 2. Instalación de Dependencias

```bash
cd inventario
npm install
```

### 3. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# DATABASE - SQLite para desarrollo local
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sinergy-inventory-secret-key-2024

# Superusuario Local (Break-Glass)
SUPERUSER_EMAIL=admin@sinergy.com
SUPERUSER_PASSWORD=sinergy2024admin
```

### 4. Migraciones de Prisma

```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push
```

### 5. Datos Iniciales (Seed)

```bash
# Ejecutar script de.seed
npm run db:seed
```

### 6. Levantar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### 7. URLs de Acceso (con sede por defecto)

| Página | URL |
|--------|-----|
| Dashboard | `/?sede=ID_SEDE` |
| Insumos | `/insumos?sede=ID_SEDE` |
| Servicios | `/servicios?sede=ID_SEDE` |
| Admin | `/admin?sede=ID_SEDE` |
| Login | `/login` |

**Credenciales de acceso local:**
- Email: `admin@sinergy.com`
- Contraseña: `xxxxxxx`

---

## Estructura del Proyecto

```
inventario/
├── src/
│   ├── actions/         # Server Actions (Next.js)
│   ├── app/            # Páginas y Layouts (App Router)
│   ├── components/     # Componentes React
│   └── lib/           # Prisma client singleton
├── prisma/
│   ├── schema.prisma   # Modelos de datos
│   └── seed.cjs       # Script de datos iniciales
├── terraform/          # Infraestructura como Código
│   ├── modules/       # Módulos Terraform
│   ├── main.tf       # Orchestración de módulos
│   ├── variables.tf  # Variables
│   ├── outputs.tf    # Outputs
│   └── *.tfvars      # Archivos por entorno
├── Dockerfile         # Multi-stage para producción
├── next.config.ts    # Configuración Next.js
└── package.json      # Dependencias
```

---

## Despliegue en AWS

### Prerrequisitos

1. **AWS CLI** configurado con credenciales
2. **Terraform** instalado
3. **Docker** instalado

### Paso 1: Build de Docker

```bash
cd inventario

# Build de la imagen
docker build -t sinergy-inventario:latest .

# (Opcional) Probar localmente
docker run -p 3000:3000 --env DATABASE_URL="postgresql://..." sinergy-inventario:latest
```

### Paso 2: push a ECR

```bash
# Autenticarse en ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Etiquetar imagen
docker tag sinergy-inventario:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sinergy-inventario:latest

# Subir imagen
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sinergy-inventario:latest
```

### Paso 3: Desplegar con Terraform

```bash
cd inventario/terraform

# Inicializar Terraform
terraform init

# Validar configuración
terraform validate

# Ver plan de despliegue
terraform plan -var-file="prod.tfvars"

# Ejecutar despliegue
terraform apply -var-file="prod.tfvars"
```

### Paso 4: Configurar PostgreSQL (RDS)

1. Crear instancia RDS PostgreSQL en AWS
2. Obtener endpoint y credentials
3. Actualizar `prod.tfvars` con la URL de conexión:

```postgresql
postgresql://username:password@endpoint.rds.amazonaws.com:5432/dbname
```

### Outputs del Despliegue

Después de `terraform apply`, obtendras:

```
app_runner_service_url = https://xxxxx.apprunner.aws.com
ecr_repository_url    = ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sinergy-inventario
```

---

## Terraform - Archivos por Entorno

| Archivo | Uso |
|---------|-----|
| `dev.tfvars` | Desarrollo |
| `staging.tfvars` | Pre-producción |
| `prod.tfvars` | Producción |
| `example.tfvars` | Plantilla |

### Variables Requeridas

```hcl
aws_region           = "us-east-1"
environment          = "prod"
app_name             = "sinergy-inventario"
database_url         = "postgresql://..."  # Sensible
nextauth_url         = "https://..."      # URL pública de App Runner
nextauth_secret      = "random-string"    # Sensible
superuser_email      = "admin@sinergy.com"
superuser_password   = "secure-password"   # Sensible
```

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:seed` | Insertar datos iniciales |
| `npm run lint` | Verificar código |

---

## Gestión de Usuarios

### Agregar usuario desde Admin

1. Ir a `/admin?sede=ID`
2. Click en pestaña "Usuarios"
3. Llenar formulario con email, nombre y rol (ADMIN/STAFF)

### Acceso de Emergencia

En la página de login (`/login`):
1. Click en "¿Olvidaste tus datos? Acceso de Emergencia (Local)"
2. Ingresar credenciales del superusuario definidas en variables de entorno

---

## Mantenimiento

### Actualizar modelo de datos

```bash
# Modificar prisma/schema.prisma
npx prisma db push        # Aplicar cambios
npx prisma generate      # Regenerar cliente
```

### Regenerar cliente Prisma

```bash
npx prisma generate
```

---

## Licencia

Propiedad de Clínica Estética Sinergy © 2024