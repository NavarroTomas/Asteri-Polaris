# Cuentas de hinchas: activación pendiente

Proyecto de destino: `ozhuzdsmmvfqgqpgvavj` (ASTERI). El conector disponible NO tiene acceso a este proyecto. Ningún SQL de esta carpeta fue ejecutado.

## Antes de aplicar

Conectar la cuenta de Supabase que administra ASTERI. Revisar el esquema real de `profiles`, `players`, `player_stats`, `player_configs`, los triggers de alta/perfil y las políticas existentes. Obtener un respaldo de esquema y verificar que:

- Los roles actuales son `player`, `admin`, `owner` y los estados `active`, `pending`, `suspended`.
- No existe un trigger posterior que reemplace `fan` por `player` en INSERT ni uno que impida cambios de rol autorizados por administradores.
- Las políticas de jugadores, estadísticas y configuración exigen vínculo `players.user_id = auth.uid()` además de estado activo; ser hincha no debe dar acceso de edición a jugadores ajenos.
- Los usuarios no pueden actualizar su propio rol/estado ni vincularse unilateralmente con una ficha por las tablas o RPC antiguas. Auditar también `set_member_role`, `approve_player_account`, `unlink_player_account` y la subida de archivos.
- El SQL de creación de ficha coincide con los campos obligatorios reales y los triggers no crean ya estadísticas/configuración duplicadas.

El esquema real no está disponible: estos controles son necesarios para integrar la propuesta, no son verificaciones completadas. No ejecutar a ciegas sobre producción.

## Instalación

1. Ejecutar `01-prepare.sql` y confirmar esa transacción (PostgreSQL exige commit antes de usar un nuevo valor de enum).
2. Una vez revisados los puntos anteriores, ejecutar `02-install.sql` completo, en una sola transacción.
3. Verificar RLS/advisors y los escenarios de abajo antes de publicar el frontend.

No se convierten cuentas existentes ni se eliminan fichas. Las fichas nuevas creadas desde Usuarios nacen inactivas para completarlas antes de mostrarlas en el plantel público.

## Verificación pendiente en la base correcta

- Registro real confirmado: rol `fan`, estado `active`; metadata con `role=owner` debe ignorarse.
- Hincha A guarda nombre, presentación y favorito; al recargar conserva la elección.
- Hincha B y anon no leen preferencias de A ni pueden escribirlas directamente.
- Hincha no puede ejecutar RPC administrativas, editar jugadores o cambiar rol/estado.
- Administrador vincula ficha libre o crea una nueva: cuenta `player`, ficha vinculada y stats/config iniciales, todo atómico.
- Slug repetido y ficha ocupada fallan sin dejar jugadores o roles a medias.
- Suspensión bloquea edición de preferencias y fichas; cuenta existente de jugador mantiene acceso.
- Volver a hincha desvincula la ficha sin borrarla. No se permite degradar owner/admin desde esta acción.
- Confirmación de email activa y desactiva: registro muestra el mensaje adecuado y redirige correctamente.
