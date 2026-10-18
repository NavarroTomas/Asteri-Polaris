# Cuentas de hinchas: activadas

Aplicado el 18 de octubre de 2026 en `ozhuzdsmmvfqgqpgvavj` (ASTERI Polaris), mediante el editor SQL de la sesión autorizada de Supabase.

## Instalación aplicada

Se inspeccionaron columnas, restricciones, triggers, funciones y políticas reales. El rol es texto: no fue necesario extender un enum con `01-prepare.sql`. Se aplicó `02-install.sql` completo, dentro de una transacción.

- Las altas nuevas usan `fan` y `active` desde el trigger de Auth, sin confiar en roles enviados en metadata.
- Las preferencias son privadas, con RLS y escritura únicamente mediante RPC para el propio hincha activo.
- Crear/vincular una ficha y habilitar el rol de jugador es una única operación transaccional, exclusiva de administración.
- Las fichas nuevas son inactivas hasta que administración las completa y activa.
- Volver a hincha desvincula la ficha sin borrarla.
- `is_active_member`, `owns_player` y `current_player_id` conservan los permisos internos para jugadores/staff y excluyen hinchas.
- Se quitaron los privilegios TRUNCATE, REFERENCES y TRIGGER de anon/authenticated sobre las cuatro tablas principales; se conservaron los accesos controlados por RLS.
- No se convirtieron ni alteraron las 10 cuentas existentes.

Respaldo de esquema y funciones anteriores en `.asteri-backups/2026-10-18-before-fan-accounts/`.

## Verificación ejecutada

`03-verify.sql` pasó primero junto a la instalación en una transacción revertida y luego sobre la instalación definitiva. Los usuarios y fichas de prueba también se revirtieron: quedaron 0 cuentas de prueba.

Probado: trigger de alta, metadata maliciosa, guardar nombre/favorito/presentación, aislamiento entre hinchas, permisos anónimos, contenido privado, bloqueo de autoasignación de rol, crear/vincular fichas, rechazo de slug duplicado/ficha ocupada sin cambios parciales, edición de estadísticas propias, bloqueo de edición ajena, vuelta a hincha conservando ficha y suspensión.

Comprobación adicional por la API pública usada por el frontend: `fan_accounts_ready=true` y lectura anónima de preferencias bloqueada.

Las pruebas usan altas SQL transaccionales de Auth y no envían emails. El envío y confirmación de correo y la entrega de emails no se probaron con una cuenta real.

Revisión de Security Advisor tras aplicar: 0 errores y 17 avisos. Los avisos corresponden al listado de dos buckets públicos ya existentes y a RPC SECURITY DEFINER accesibles a usuarios autenticados. Las RPC nuevas validan cuenta/estado/rol desde profiles (no metadata) y los ensayos de autorización y aislamiento pasaron. No se modificaron esos buckets ni se eliminaron verificaciones de autorización para silenciar el análisis.
