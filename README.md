# Gym Personal

Aplicación personal para Smart Fit Mercurio Soacha: rutina de cinco días, registro sin conexión y propuestas de variación con Gemini. La rutina inicial está vacía.

## Uso

1. Entra con tu cuenta de ChatGPT en el sitio privado.
2. En **Rutina**, configura los cinco días y las series de cada ejercicio. Objetivos y descansos son opcionales.
3. En **Ajustes**, confirma el equipo disponible y los ejercicios que quieras excluir. Puedes marcar ejercicios fijos en la rutina.
4. Registra tu entrenamiento desde **Hoy**. Los resultados se guardan en IndexedDB antes de sincronizarse.
5. Al terminar cinco días distintos, revisa las propuestas de **Variaciones** y acepta los cambios que quieras. La rutina base y el historial no se sobrescriben.

Abre el sitio una vez con internet y espera la indicación **Disponible sin conexión**. La generación de IA y la activación de ciclos necesitan conexión. Cerrar sesión elimina las copias locales; primero debes sincronizar y resolver los conflictos.

## Conectar Gemini

La aplicación se entrega sin una clave personal. No es necesario configurar IA para registrar entrenamientos.

- Crea tu propia clave en [Google AI Studio](https://aistudio.google.com/apikey), usando un proyecto de nivel gratuito sin facturación de pago.
- Configura **GEMINI_API_KEY** como secreto del servidor en Sites y vuelve a desplegar la versión guardada para aplicar la configuración.
- No pegues claves en el código, en la rutina, en el navegador ni en un respaldo. La interfaz solo consulta si existe la configuración.
- El modelo está fijado a **gemini-3.8-flash**. No hay cambio automático de proveedor o modelo, herramientas de pago ni reintentos ocultos.
- La aplicación permite como máximo cinco intentos de generación al día, según America/Bogota. La cuota efectiva también depende de Google. Ante un error, conserva el entrenamiento y requiere un reintento manual.

Consulta la [tarifa y el nivel gratuito](https://ai.google.dev/gemini-api/docs/pricing) y los [límites de Gemini](https://ai.google.dev/gemini-api/docs/rate-limits). Las condiciones pueden cambiar y la aplicación no puede comprobar si has habilitado facturación en tu proyecto de Google. El nivel gratuito puede usar las solicitudes para mejorar los productos de Google; se envían únicamente posiciones, candidatos y preferencias de variación, sin identidad ni notas de entrenamiento.

## Desarrollo

React y TypeScript sobre el starter Vinext de Sites. Requiere Node 22.13 o posterior.

```powershell
npm run install:ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file drizzle/0000_familiar_lightspeed.sql
npm run dev
```

La sentencia de inicialización D1 se ejecuta una sola vez en una base nueva. Sites aplica las migraciones guardadas al publicar. No se crean tablas desde los manejadores de solicitudes.

El servidor de desarrollo ofrece una identidad simulada en localhost; esa integración no forma parte de la autenticación de producción. La publicación usa acceso privado de Sites y comprueba la identidad en cada API. No despliegues los servidores de prueba incluidos en tests.

En Windows, si el shim de npm no resuelve su ruta, invoca npm con su ruta JavaScript absoluta. Los scripts de Sites se ejecutaron con un wrapper local ignorado; no se modificó la instalación global.

## Verificación

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/domain.test.ts tests/gemini.test.ts
```

Para la integración D1, inicia el Worker construido en localhost:5174 y ejecuta:

```powershell
node --test tests/api.test.ts
```

Las pruebas usan usuarios sintéticos y una base local. Cubren revisiones, duplicados, aislamiento entre propietarios, conflictos, cinco días únicos, propuestas, activación, restauración y errores de Gemini. Los errores del proveedor se verifican con respuestas simuladas, sin claves ni llamadas de pago.

## Datos y límites

- Catálogo de 329 entradas; 138 tienen clasificación para equivalencias. Las restantes se pueden registrar, pero no generan alternativas automáticas.
- Las familias de compatibilidad conservan patrón, músculos prioritarios, función y lateralidad. No representan equivalencias perfectas ni prescripción clínica.
- El equipo de Mercurio debe confirmarse manualmente. Las fotos públicas y la numeración de México son referencias, no un inventario actual.
- Los ciclos contienen copias de la rutina; cada sesión contiene su propia copia de los ejercicios y objetivos.
- La comparación de progreso separa ejercicio, equipo, perfil y lado. La carga de una variante no se transfiere a otra.
- Los respaldos JSON conservan registros y conflictos, sin identidad de cuenta ni claves. Restaurar combina el respaldo con los datos existentes; las coincidencias se actualizan y los demás registros permanecen.
- El servicio de sincronización usa revisiones y operaciones idempotentes. Al detectar un conflicto, retiene las dos versiones para elegir una explícitamente.
- La configuración de alojamiento conserva el ID privado de Sites en .openai/hosting.json. Los archivos .wrangler, node_modules, dist y los secretos están excluidos del repositorio.
