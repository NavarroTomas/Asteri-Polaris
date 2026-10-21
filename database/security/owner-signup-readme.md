# Registro con aprobación del owner

Aplicado en ASTERI el 20 de octubre de 2026. La migración preserva todas las cuentas existentes. Las nuevas cuentas quedan como `fan / pending` y solo el owner activo puede habilitarlas. El panel del owner muestra **Solicitudes → Aprobar como hincha / Rechazar**. La asignación de jugador sigue siendo un paso posterior.

La aprobación se controla mediante un trigger de la base, no solo en la interfaz. También protege escrituras REST, cambios de rol, reactivaciones y RPCs anteriores. Las cuentas pendientes pueden iniciar sesión para consultar su estado, pero no editar su perfil ni acceder a contenido privado.

## Control de registros

- Auth Hook habilitado: `pg-functions://postgres/asteri_private/before_user_created` (Before User Created).
- Solo `supabase_auth_admin` puede invocar el hook. La IP procede de `event.metadata.ip_address`, nunca de metadatos enviados por el cliente.
- Un registro cada diez minutos por IPv4; IPv6 se agrupa por /64 para cubrir direcciones temporales. Las IPv4 mapeadas a IPv6 se normalizan.
- Se almacena una huella HMAC privada y su vencimiento; no la IP original, email o ID de usuario. La clave se genera dentro de Postgres.
- El bloqueo vence a los diez minutos. Un trabajo de pg_cron elimina huellas vencidas cada minuto; también se limpian al registrar. La retención física puede llegar a once minutos.
- Una operación atómica con clave única impide admitir registros simultáneos para la misma conexión. Los intentos rechazados no extienden el plazo.
- El hook reserva el plazo antes de crear el usuario. Si Auth falla después, la reserva puede permanecer hasta su vencimiento.
- Personas que comparten IP pública comparten el límite. Otra red/VPN puede eludir un control basado en IP; la revisión del owner sigue siendo necesaria.

La confirmación por email permanece desactivada. Este cambio no habilita SMTP ni recuperación de contraseña por correo.

## Validación

`database/security/owner-signup-verify.sql` se ejecuta en una transacción con rollback. Verifica aprobación exclusiva del owner, denegación a admin/fan, bypasses REST/RPC, rechazo, edición antes/después de aprobar, IPv4/IPv6, caducidad, limpieza y permisos de almacenamiento. No envía correos. El SQL Editor no permite asumir `supabase_auth_admin`; sus permisos se comprueban en el catálogo y el estado del hook se verifica en el dashboard.

La instalación de la función no habilita automáticamente el hook en otros proyectos: se debe seleccionar esa función en Authentication → Auth Hooks. Para rollback, primero deshabilitar el hook y revertir la UI; conservar respaldo de las definiciones previas. No borrar solicitudes o aprobaciones reales como parte de una reversión.
