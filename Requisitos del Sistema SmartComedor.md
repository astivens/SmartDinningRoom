**Requisitos** **del** **Sistema** **–** **SmartComedor**

**1.** **Requisitos** **Funcionales**

**RF1** **–** **Autenticación** **de** **usuarios**

El sistema debe permitir a los usuarios **iniciar** **sesión**mediante:

> • Correo electrónico • Contraseña
>
> • Selección de rol (Estudiante, Administrador, Supervisor)

Si un usuario intenta ingresar como **administrador** **o**
**supervisor** **sin** **estarautorizado**, el sistema mostrará el
mensaje:

“Usted no está autorizado”.

**RF2** **–** **Recuperación** **de** **contraseña**

El sistema debe permitir a los usuarios recuperar su contraseña mediante
la opción **“Olvidaste** **tu** **contraseña”**, enviando un enlace de
recuperación al correo registrado.

**RF3** **–** **Registro** **de** **nuevos** **usuarios**

El sistema debe permitir crear una cuenta nueva solicitando los
siguientes datos:

> • Correo electrónico (máximo 30 caracteres) • Nombre (máximo 20
> caracteres)
>
> • Apellido (máximo 20 caracteres)
>
> • Cédula (mínimo 6 y máximo 12 dígitos)
>
> • Contraseña (mínimo y máximo 8 caracteres) • Carrera (máximo 25
> caracteres)
>
> • Semestre actual
>
> • Categoría SISBEN
>
> • Archivo adjunto SISBEN (PDF o JPG) • Dirección (opcional)
>
> • Barrio
>
> • Número de contacto • Trabaja (Sí / No)
>
> • Etnia
>
> • Desplazado o víctima de conflicto (Sí / No)
>
> • Trabajador o funcionario de la universidad (Sí / No) • Días de uso
> del comedor (Lunes a Viernes)
>
> • Escaneo QR para autenticación en dos factores (opcional)
>
> • Adjuntar recibo de pago

**RF4** **–** **Validación** **de** **datos** **SISBEN**

El sistema debe **verificar** **automáticamente** que los datos del
archivo SISBEN coincidan con:

> • Cédula • Nombre • Apellido

Si los datos coinciden, el sistema mostrará un **indicador** **de**
**validación** **(check** **verde)**.

**RF5** **–** **Asistente** **virtual**

El sistema debe incluir un **asistente** **virtual** que permita:

> • Registrar quejas
>
> • Registrar sugerencias
>
> • Enviar comentarios de forma anónima o con datos personales.

**Requisitos** **Funcionales** **–** **Rol** **Administrador**

**RF6** **–** **Gestión** **de** **supervisores**

El administrador debe poder:

> • Registrar supervisores mediante enlace de invitación. • Habilitar o
> inhabilitar supervisores.
>
> • Asignar supervisores entre estudiantes registrados.

**RF7** **–** **Carga** **de** **base** **de** **datos**

El sistema debe permitir al administrador **cargar** **archivos**
**Excel** con información de estudiantes.

Campos del Excel:

> • Nombre • Apellido • Carrera • Cédula • Pago
>
> • Días de uso del comedor

**RF8** **–** **Gestión** **de** **estudiantes**

El administrador debe poder:

> •      Agregar estudiantes manualmente •      Editar información de
> estudiantes
>
> • Habilitar o deshabilitar estudiantes del servicio.

**RF9** **–** **Validación** **de** **almuerzos** **pagados**

El sistema debe calcular automáticamente la cantidad de almuerzos
disponibles según el pago registrado.

Regla del sistema:

> • **2000** **pesos** **=** **1** **almuerzo**

Ejemplo:

> • 10.000 pesos = 5 almuerzos.

**RF10** **–** **Generación** **de** **reportes**

El sistema debe permitir al administrador:

> • Generar listas de estudiantes habilitados • Imprimir reportes
>
> • Exportar información en Excel/PDF.

**Requisitos** **Funcionales** **–** **Rol** **Supervisor** **RF11**
**–** **Consulta** **de** **estudiantes**

El supervisor debe poder buscar estudiantes por:

> • Cédula • Nombre • Apellido • Carrera

**RF12** **–** **Verificación** **de** **datos** **del** **estudiante**

El sistema debe mostrar al supervisor:

> • Cédula • Nombre • Apellido • Carrera
>
> • Días autorizados para almorzar • Almuerzos disponibles

**RF13** **–** **Registro** **de** **almuerzo**

El supervisor debe confirmar el uso del comedor mediante el botón
**“Firmar”**.

**RF14** **–** **Envío** **automático** **de** **comprobante**

Después de firmar, el sistema enviará un correo automático al estudiante
con:

> • Nombre completo
>
> • Confirmación del servicio • Mensaje de seguridad

Ejemplo:

“Gracias por utilizar nuestro servicio del comedor universitario. Si no
fuiste tú, comunícate con la persona encargada.”

**RF15** **–** **Registro** **de** **actividad** **del** **supervisor**

El sistema debe registrar en una tabla:

> • Nombre del supervisor • Apellido
>
> • Hora
>
> • Estudiante atendido

Este registro funcionará como comprobante para el administrador.

**Requisitos** **Funcionales** **–** **Rol** **Estudiante**

**RF16** **–** **Visualización** **de** **perfil**

El estudiante debe poder ver:

> • Nombre • Apellido • Carrera
>
> • Días autorizados para almorzar
>
> • Cantidad de almuerzos disponibles.

**RF17** **–** **Carga** **de** **comprobante** **de** **pago**

El estudiante debe poder subir un **recibo** **de** **pago** para
recargar almuerzos.

**RF18** **–** **Calificación** **del** **servicio**

El estudiante debe poder **calificar** **elalmuerzo** mediante un
sistema de **1** **a** **5** **estrellas**.

**RF19** **–** **Visualización** **de** **noticias**

El sistema debe mostrar noticias relacionadas con el comedor
universitario.

**2.** **Requisitos** **No** **Funcionales**

**RNF1** **–** **Seguridad**

El sistema debe proteger la información mediante:

> • Encriptación de contraseñas • Autenticación segura
>
> • Protección contra accesos no autorizados.

**RNF2** **–** **Disponibilidad**

El sistema debe estar disponible **24** **horas** **al** **día,** **7**
**días** **a** **la** **semana**.

**RNF3** **–** **Rendimiento**

El sistema debe responder a consultas en **menos** **de** **3**
**segundos**.

**RNF4** **–** **Usabilidad**

La interfaz debe ser:

> • Intuitiva
>
> • Fácil de usar
>
> • Adaptada para estudiantes y personal administrativo.

**RNF5** **–** **Compatibilidad**

El sistema debe funcionar en:

> • Navegadores web modernos • Dispositivos móviles
>
> • Computadores.

**RNF6** **–** **Escalabilidad**

El sistema debe permitir agregar nuevos usuarios, supervisores o módulos
sin afectar el funcionamiento.

**RNF7** **–** **Integridad** **de** **datos**

El sistema debe validar correctamente:

> • formatos de datos
>
> • campos obligatorios
>
> • coincidencia de documentos.

**RNF8** **–** **Auditoría**

El sistema debe registrar:

> • accesos al sistema
>
> • acciones de supervisores
>
> • cambios realizados por administradores.

**RNF9** **–** **Copias** **de** **seguridad**

El sistema debe realizar **backups** **automáticos** **diarios** de la
base de datos.

**RNF10** **–** **Accesibilidad**

El sistema debe ser usable por personas con diferentes niveles de
habilidades digitales.
