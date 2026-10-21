# GestaPro — Product Backlog definitivo (V3)

User stories atómicas: una acción por historia. Total: **142** US en 7 épicas.

## Product Backlog Priorizado

| N° US | Título | Descripción | Prioridad |
|---|---|---|---|
| **GP.01** | Ingresar Clave de Acceso del Local | Como Usuario, quiero ingresar la clave de acceso del local antes de la pantalla de inicio de sesión para que nadie ajeno al negocio pueda llegar al sistema. | Alta (núcleo del MVP) |
| **GP.02** | Registrar Usuario | Como Nuevo Usuario, quiero registrarme proporcionando mi información personal y mis credenciales para solicitar acceso al sistema, quedando mi cuenta pendiente de autorización. | Alta (núcleo del MVP) |
| **GP.03** | Iniciar Sesión | Como Usuario registrado y autorizado, quiero iniciar sesión con mi usuario y contraseña para acceder al panel principal con las funciones que mi perfil tiene permitidas. | Alta (núcleo del MVP) |
| **GP.04** | Cerrar Sesión | Como Usuario, quiero cerrar sesión al finalizar mi actividad para asegurar la confidencialidad de mi cuenta y liberar la terminal de trabajo. | Alta (núcleo del MVP) |
| **GP.26** | Registrar Cliente | Como Operario, quiero registrar un cliente con sus datos personales, su identificador único (DNI/CUIT), su contacto y su dirección física para mantener la base libre de duplicados y coordinar las entregas. | Alta (núcleo del MVP) |
| **GP.28** | Modificar Cliente | Como Operario, quiero modificar los datos personales, la dirección o los datos comerciales de un cliente para mantener su información actualizada. | Alta (núcleo del MVP) |
| **GP.29** | Dar de Baja Lógica a Cliente | Como Operario, quiero dar de baja lógicamente a un cliente para que no aparezca en las operaciones nuevas sin perder el histórico de sus transacciones. | Alta (núcleo del MVP) |
| **GP.40** | Registrar Proveedor | Como Operario, quiero registrar un proveedor con sus datos, su rubro, su identificador único (CUIT), su contacto y su dirección para evitar duplicados y coordinar la recepción de mercadería. | Alta (núcleo del MVP) |
| **GP.41** | Modificar Proveedor | Como Operario, quiero modificar los datos, el rubro o la dirección de un proveedor para mantener su información actualizada. | Alta (núcleo del MVP) |
| **GP.42** | Dar de Baja Lógica a Proveedor | Como Operario, quiero dar de baja lógicamente a un proveedor para resguardar el histórico de compras asociadas. | Alta (núcleo del MVP) |
| **GP.46** | Registrar Insumo | Como Operario, quiero registrar un insumo con su precio, unidad de consumo, unidad de compra, factor de conversión, stock mínimo y proveedor para controlar su inventario. | Alta (núcleo del MVP) |
| **GP.47** | Modificar Insumo | Como Operario, quiero modificar los datos, el precio o el stock mínimo de un insumo para mantener el catálogo actualizado. | Alta (núcleo del MVP) |
| **GP.48** | Dar de Baja Lógica a Insumo | Como Operario, quiero dar de baja lógicamente un insumo para resguardar el histórico de movimientos asociados. | Alta (núcleo del MVP) |
| **GP.52** | Registrar Venta Rápida | Como Operario, quiero registrar una venta rápida a "Consumidor Final" sin cargar datos personales para agilizar la atención en momentos de alta demanda. | Alta (núcleo del MVP) |
| **GP.56** | Registrar Pedido | Como Operario, quiero registrar un pedido asociado a un cliente, con sus productos, fecha estimada de entrega, empleado responsable y método de pago, para formalizar el compromiso de venta. | Alta (núcleo del MVP) |
| **GP.66** | Entregar Pedido | Como Operario, quiero marcar un pedido como Entregado cuando el cliente lo retira para que pase al historial de pedidos. | Alta (núcleo del MVP) |
| **GP.75** | Consultar Cola de Producción | Como Operario, quiero ver la cola de pedidos del taller ordenada por urgencia o por número de pedido para organizar las prioridades de producción. | Alta (núcleo del MVP) |
| **GP.76** | Consultar Tablero por Estado | Como Operario, quiero ver los pedidos en un tablero con una columna por estado (Pendiente, En proceso, Pausado, Finalizado) para visualizar el avance del taller. | Alta (núcleo del MVP) |
| **GP.80** | Actualizar Estado de un Pedido | Como Operario, quiero cambiar el estado de un pedido (Pendiente, En proceso, Pausado, Finalizado), registrando el motivo del cambio, para documentar el avance y las demoras. | Alta (núcleo del MVP) |
| **GP.98** | Registrar Producto | Como Operario, quiero registrar un producto con su precio, stock inicial, categoría y la máquina que necesita para ofrecerlo en las ventas. | Alta (núcleo del MVP) |
| **GP.99** | Modificar Producto | Como Operario, quiero modificar el precio, la categoría, la máquina o los datos de un producto para mantener el catálogo actualizado. | Alta (núcleo del MVP) |
| **GP.102** | Configurar Receta de un Producto | Como Operario, quiero definir qué insumos y en qué cantidad consume cada producto para automatizar el cálculo de material. | Alta (núcleo del MVP) |
| **GP.104** | Descontar Stock Automáticamente | Como Operario, quiero que el sistema descuente los insumos según la receta en el momento en que un pedido se marca como Finalizado para mantener el stock real sin cargas manuales. | Alta (núcleo del MVP) |
| **GP.115** | Abrir Turno de Caja | Como Operario, quiero abrir el turno de caja ingresando el monto inicial para comenzar a registrar las operaciones del día. | Alta (núcleo del MVP) |
| **GP.121** | Realizar Arqueo de Caja | Como Operario, quiero consultar el arqueo con los montos en efectivo y en medios digitales como verificación previa al cierre de turno. | Alta (núcleo del MVP) |
| **GP.122** | Cerrar Turno con Arqueo | Como Operario, quiero cerrar el turno ingresando el efectivo contado para rendir cuentas del dinero recaudado al finalizar mi horario. | Alta (núcleo del MVP) |
| **GP.06** | Autorizar Solicitud de Registro | Como Dueño o Gerente (Perfil Admin), quiero autorizar las solicitudes de registro pendientes para habilitar el acceso de los nuevos usuarios al sistema. | Media-alta |
| **GP.07** | Rechazar Solicitud de Registro | Como Dueño o Gerente (Perfil Admin), quiero rechazar una solicitud de registro dejando la cuenta inactiva para impedir el acceso de personas no autorizadas. | Media-alta |
| **GP.08** | Asignar Perfil a Usuario | Como Dueño o Gerente (Perfil Admin), quiero asignar un perfil (Dueño, Operario o uno personalizado) a cada usuario autorizado para habilitar sus accesos operativos. | Media-alta |
| **GP.15** | Restringir Pantallas según Permisos | Como Usuario, quiero ver en el menú solo los módulos que mi perfil tiene habilitados para no poder realizar acciones no autorizadas. | Media-alta |
| **GP.27** | Registrar Datos Comerciales del Cliente | Como Operario, quiero cargar la razón social, la persona de contacto y el límite de crédito al dar de alta un cliente para dejarlo listo para operar a cuenta corriente. | Media-alta |
| **GP.31** | Buscar Clientes | Como Operario, quiero buscar clientes por nombre o documento y filtrarlos por estado (activo/inactivo) para encontrar rápidamente al que necesito. | Media-alta |
| **GP.33** | Crear Categoría de Descuento | Como Operario, quiero crear categorías de clientes (por ejemplo, Estudiante o Mayorista) con un porcentaje de descuento para aplicarlas automáticamente en las ventas. | Media-alta |
| **GP.36** | Asignar Límite de Crédito | Como Operario, quiero asignar o actualizar el límite de crédito de la cuenta corriente de un cliente para controlar cuánto puede deber. | Media-alta |
| **GP.37** | Consultar Histórico de Cuenta Corriente | Como Operario, quiero consultar el histórico de compras y pagos y el saldo deudor de la cuenta corriente de un cliente para conocer su situación. | Media-alta |
| **GP.38** | Registrar Cobro en Cuenta Corriente | Como Operario, quiero registrar un pago total o parcial sobre la cuenta corriente de un cliente, con su medio de pago, para reducir su saldo deudor. | Media-alta |
| **GP.44** | Buscar Proveedores | Como Operario, quiero buscar proveedores por nombre o contacto y filtrarlos por estado y rubro para encontrar a quién comprarle cada insumo. | Media-alta |
| **GP.50** | Buscar Insumos | Como Operario, quiero buscar insumos por nombre y filtrarlos por estado para ubicar rápidamente uno en particular. | Media-alta |
| **GP.51** | Consultar Panel Principal | Como Usuario, quiero ver en el panel principal los pedidos pendientes, el estado de la caja y los insumos con falta de stock para tener el día bajo control de un vistazo. | Media-alta |
| **GP.55** | Aplicar Categoría de Descuento | Como Operario, quiero elegir la categoría del cliente al armar una venta o un pedido para que el sistema aplique su descuento automáticamente. | Media-alta |
| **GP.58** | Generar Presupuesto | Como Operario, quiero guardar un pedido como presupuesto, sin afectar la caja ni ocupar lugar en el taller, para cotizar trabajos a los clientes. | Media-alta |
| **GP.60** | Convertir Presupuesto en Pedido | Como Operario, quiero pasar un presupuesto confirmado por el cliente al estado Pendiente para que entre directo a la cola de producción. | Media-alta |
| **GP.61** | Registrar Seña | Como Operario, quiero registrar la seña o adelanto que deja el cliente al confirmar un pedido para que el sistema calcule el saldo pendiente. | Media-alta |
| **GP.63** | Cobrar Saldo de un Pedido | Como Operario, quiero registrar el pago total o parcial del saldo de un pedido para dejarlo cancelado antes de la entrega. | Media-alta |
| **GP.64** | Cobrar con Distintos Medios de Pago | Como Operario, quiero registrar cada cobro en efectivo, transferencia, débito, crédito o cuenta corriente (sujeta al límite de crédito) para brindar flexibilidad al cliente. | Media-alta |
| **GP.65** | Controlar Deuda al Entregar | Como Operario, quiero que el sistema no permita entregar un pedido de Consumidor Final con saldo pendiente y que, en un cliente registrado, el saldo pase a su cuenta corriente avisando si supera su límite, para no perder cobros. | Media-alta |
| **GP.68** | Emitir Ticket del Pedido (PDF) | Como Operario, quiero emitir e imprimir el ticket del pedido para el cliente, en papel o en PDF, como comprobante de la compra. | Media-alta |
| **GP.69** | Emitir Comprobante de Pago (PDF) | Como Operario, quiero emitir el comprobante de cada pago registrado para entregárselo al cliente. | Media-alta |
| **GP.72** | Consultar Historial de Pedidos | Como Operario, quiero consultar los pedidos entregados o cancelados filtrando por cliente, empleado, fecha o estado para revisar trabajos anteriores. | Media-alta |
| **GP.77** | Filtrar Pedidos del Taller | Como Operario, quiero filtrar los pedidos del taller por cliente, estado o empleado asignado para encontrar un trabajo puntual. | Media-alta |
| **GP.78** | Consultar Pedidos Atrasados | Como Operario, quiero ver resaltados y en una pestaña aparte los pedidos que superaron su fecha de entrega para priorizarlos. | Media-alta |
| **GP.82** | Consultar Línea de Tiempo del Pedido | Como Operario, quiero ver la línea de tiempo de un pedido con cada cambio, quién lo hizo, cuándo y por qué para conocer su historia completa. | Media-alta |
| **GP.83** | Asignar Pedido a un Operario | Como Operario, quiero asignar o reasignar el empleado responsable de un pedido para distribuir la carga de trabajo del taller. | Media-alta |
| **GP.85** | Emitir Comanda de Taller (PDF) | Como Operario, quiero emitir la comanda del taller con las especificaciones técnicas del trabajo para que acompañe físicamente al pedido durante su producción. | Media-alta |
| **GP.86** | Registrar Archivo en Repositorio | Como Operario, quiero subir un archivo (PDF/DOCX/JPG/PNG) con su título, docente, cátedra y precio base para alimentar el repositorio de apuntes, detectando la cantidad de páginas automáticamente. | Media-alta |
| **GP.89** | Buscar Archivos en Repositorio | Como Operario, quiero buscar archivos por título, autor o materia y filtrarlos por cátedra e institución para encontrar rápidamente el apunte solicitado. | Media-alta |
| **GP.91** | Crear Pedido de Impresión desde el Repositorio | Como Operario, quiero crear un pedido de impresión directamente desde un archivo del repositorio para que el pedido se arme solo con ese apunte y su precio. | Media-alta |
| **GP.92** | Consultar Estado del Inventario | Como Operario, quiero ver el stock de cada insumo, empaquetado y suelto, junto a su mínimo para conocer el material disponible. | Media-alta |
| **GP.93** | Recibir Alertas de Stock Crítico | Como Operario, quiero recibir alertas visuales cuando un insumo quede por debajo de su stock mínimo para anticipar su reposición. | Media-alta |
| **GP.94** | Registrar Conversión de Insumos | Como Operario, quiero abrir bultos (por ejemplo, una resma) y que el sistema los convierta a unidades de consumo (hojas) para llevar un inventario exacto. | Media-alta |
| **GP.96** | Registrar Compra de Insumos | Como Operario, quiero registrar una compra de insumos o productos, con proveedor, cantidades, precios y medio de pago, para actualizar el stock y registrar el egreso. | Media-alta |
| **GP.100** | Dar de Baja Lógica a Producto | Como Operario, quiero desactivar un producto que ya no se vende para que no aparezca en las ventas sin perder su histórico. | Media-alta |
| **GP.101** | Buscar Productos | Como Operario, quiero buscar productos por nombre y filtrarlos por estado para ubicar rápidamente uno en particular. | Media-alta |
| **GP.103** | Vincular Stock del Producto a sus Insumos | Como Operario, quiero activar o desactivar que el stock de un producto se calcule a partir de sus insumos para manejar tanto productos fabricados como de reventa. | Media-alta |
| **GP.107** | Registrar Equipo | Como Operario, quiero registrar una máquina o equipo del taller con su nombre, estado operativo y disponibilidad para controlar el parque de equipos. | Media-alta |
| **GP.109** | Reportar Falla en un Equipo | Como Operario, quiero reportar la falla de un equipo con su urgencia y descripción para que pase a "Fuera de Servicio" y quede registrada la incidencia. | Media-alta |
| **GP.110** | Avisar en Ventas con Equipo Fuera de Servicio | Como Operario, quiero que el sistema me avise y pida confirmación al vender un producto que depende de un equipo fuera de servicio para no prometer trabajos que no se pueden hacer. | Media-alta |
| **GP.116** | Consultar Flujo de Caja del Turno | Como Operario, quiero ver el saldo actual, los ingresos, los egresos y el gráfico del turno para conocer el estado de la caja en todo momento. | Media-alta |
| **GP.118** | Registrar Movimiento Manual de Caja | Como Usuario, quiero registrar ingresos o egresos extraordinarios con su categoría, medio de pago y descripción para asentar correctamente los gastos menores del local. | Media-alta |
| **GP.123** | Justificar Diferencia de Arqueo | Como Operario, quiero que el sistema calcule la diferencia entre lo esperado y lo contado y me pida justificarla para que ningún faltante o sobrante quede sin explicar. | Media-alta |
| **GP.126** | Consultar Métricas Generales | Como Dueño o Gerente (Perfil Admin), quiero ver los ingresos totales, la cantidad de tickets, el ticket promedio y los movimientos de caja por día, semana, mes o rango de fechas para seguir el negocio. | Media-alta |
| **GP.05** | Vencer Sesión por Inactividad | Como Usuario, quiero que mi sesión venza automáticamente pasado un tiempo para que nadie pueda operar con mi cuenta si dejo la terminal abierta. | Media |
| **GP.09** | Registrar Empleado | Como Dueño o Gerente (Perfil Admin), quiero dar de alta un empleado con sus datos personales, cargo y salario para mantener actualizada la nómina del local. | Media |
| **GP.10** | Modificar Datos de Empleado | Como Dueño o Gerente (Perfil Admin), quiero modificar los datos, el cargo o el salario de un empleado para mantener la nómina correcta y actualizada. | Media |
| **GP.11** | Dar de Baja Lógica a Empleado | Como Dueño o Gerente (Perfil Admin), quiero dar de baja lógicamente a un empleado para quitarlo de la nómina activa sin perder su historial de actividad. | Media |
| **GP.12** | Crear Perfil Personalizado | Como Dueño o Gerente (Perfil Admin), quiero crear un perfil personalizado (por ejemplo, Gerente) para definir un conjunto de accesos distinto a los perfiles base. | Media |
| **GP.13** | Configurar Permisos de un Perfil | Como Dueño o Gerente (Perfil Admin), quiero habilitar o deshabilitar cada módulo para un perfil desde la matriz de permisos para adaptar los accesos a las necesidades del local. | Media |
| **GP.14** | Asignar Usuarios a un Perfil desde la Matriz | Como Dueño o Gerente (Perfil Admin), quiero asignar usuarios a un perfil desde la matriz de permisos para que los cambios de accesos se apliquen a todos ellos al instante. | Media |
| **GP.16** | Consultar Historial de Actividad | Como Dueño o Gerente (Perfil Admin), quiero consultar el historial de actividad con cada cambio importante (dato previo, dato nuevo, usuario y fecha/hora) para auditar quién modificó qué y cuándo. | Media |
| **GP.17** | Filtrar Historial de Actividad | Como Dueño o Gerente (Perfil Admin), quiero filtrar el historial de actividad por tabla afectada y por usuario para encontrar rápidamente un cambio puntual. | Media |
| **GP.19** | Cambiar Contraseña Propia | Como Usuario, quiero cambiar mi contraseña desde Configuración, ingresando la actual, para mantener segura mi cuenta. | Media |
| **GP.21** | Ver o Restablecer Contraseña de un Usuario | Como Dueño o Gerente (Perfil Admin), quiero ver o restablecer la contraseña de otro usuario para recuperar su acceso cuando la olvida. | Media |
| **GP.22** | Generar Respaldo de Datos | Como Dueño o Gerente (Perfil Admin), quiero generar un respaldo de la base de datos en el momento para resguardar la información ante cualquier problema. | Media |
| **GP.23** | Restaurar Respaldo de Datos | Como Dueño o Gerente (Perfil Admin), quiero restaurar los datos desde un archivo de respaldo, confirmando la operación, para recuperar la información ante una falla. | Media |
| **GP.30** | Reactivar Cliente | Como Operario, quiero reactivar un cliente dado de baja para volver a operar con él conservando su histórico. | Media |
| **GP.34** | Modificar Categoría de Descuento | Como Operario, quiero modificar el nombre o el porcentaje de una categoría de descuento para actualizar las reglas comerciales. | Media |
| **GP.35** | Eliminar Categoría de Descuento | Como Operario, quiero eliminar una categoría de descuento que ya no se usa para mantener la lista ordenada. | Media |
| **GP.39** | Consultar Resumen de Cuentas Corrientes | Como Dueño o Gerente (Perfil Admin), quiero ver el resumen de todas las cuentas corrientes activas (crédito otorgado, deuda acumulada y clientes con deuda) para controlar el riesgo comercial. | Media |
| **GP.43** | Reactivar Proveedor | Como Operario, quiero reactivar un proveedor dado de baja para volver a comprarle sin perder su histórico. | Media |
| **GP.49** | Reactivar Insumo | Como Operario, quiero reactivar un insumo dado de baja para volver a usarlo sin perder su histórico. | Media |
| **GP.54** | Cancelar Venta en Curso | Como Operario, quiero cancelar una venta rápida antes de cobrarla, confirmando la acción, para descartar una carga equivocada. | Media |
| **GP.57** | Consultar Impacto en el Stock del Pedido | Como Operario, quiero ver antes de confirmar un pedido cuánto stock de insumos y productos va a consumir para no comprometer material que no hay. | Media |
| **GP.59** | Consultar Presupuestos | Como Operario, quiero ver los presupuestos guardados en su propia pestaña para hacer el seguimiento de las cotizaciones. | Media |
| **GP.62** | Adjuntar Comprobante de Pago | Como Operario, quiero adjuntar la foto o el PDF del comprobante cuando el cliente paga por transferencia para dejar respaldo del pago. | Media |
| **GP.67** | Notificar Pedido Listo al Cliente | Como Operario, quiero avisarle al cliente con un clic por WhatsApp o por mail que su pedido está listo para que pase a retirarlo. | Media |
| **GP.70** | Anular Pedido | Como Operario, quiero anular un pedido (estado Cancelado) registrando el motivo para que no avance en el taller ni consuma stock. | Media |
| **GP.71** | Registrar Devolución de un Pedido | Como Operario, quiero registrar la devolución de un pedido con su motivo y elegir si se vuelve a hacer o se marca como devuelto para atender los reclamos de los clientes. | Media |
| **GP.73** | Consultar Auditoría de Pagos de un Pedido | Como Dueño o Gerente (Perfil Admin), quiero ver el detalle de cobros y de cambios de estado de un pedido cerrado para auditar cómo se cobró y quién lo gestionó. | Media |
| **GP.79** | Consultar Pedidos Finalizados sin Retirar | Como Dueño o Gerente (Perfil Admin), quiero ver en la columna Finalizado los trabajos terminados que el cliente todavía no retiró para reclamar su retiro y su cobro. | Media |
| **GP.81** | Mover Pedido de Estado en el Tablero | Como Operario, quiero arrastrar la tarjeta de un pedido a otra columna del tablero para cambiar su estado de forma rápida. | Media |
| **GP.87** | Modificar Datos de un Archivo del Repositorio | Como Operario, quiero modificar los datos del producto vinculado a un archivo del repositorio (nombre, precio base, stock, estado, máquina y categoría) para mantener la información correcta. | Media |
| **GP.88** | Eliminar Archivo del Repositorio | Como Operario, quiero eliminar un archivo del repositorio que ya no se usa para mantener actualizada la lista de apuntes. | Media |
| **GP.90** | Previsualizar Archivo del Repositorio | Como Operario, quiero previsualizar un archivo en pantalla, o verlo a pantalla completa, para confirmar que es el correcto sin descargarlo. | Media |
| **GP.97** | Cargar Compra desde una Foto con IA | Como Operario, quiero subir la foto de un remito o lista de compras para que la inteligencia artificial detecte los ítems y arme la compra, que reviso antes de confirmar. | Media |
| **GP.105** | Registrar Merma de Material | Como Operario, quiero registrar mermas e impresiones fallidas de un producto o de un pedido, indicando cantidad y motivo, para descontarlas del stock y justificar el material perdido. | Media |
| **GP.108** | Modificar Equipo | Como Operario, quiero modificar los datos, el estado operativo o la disponibilidad de un equipo para mantener su información al día. | Media |
| **GP.111** | Registrar Pago de Reparación | Como Operario, quiero registrar lo que se le pagó al técnico por una reparación para que se descuente de la caja como egreso de mantenimiento. | Media |
| **GP.112** | Pasar Equipo a Mantenimiento | Como Operario, quiero pasar un equipo con falla a "En mantenimiento" detallando el trabajo técnico para seguir el estado de la reparación. | Media |
| **GP.113** | Dar de Alta Operativa a un Equipo | Como Operario, quiero dar de alta un equipo reparado indicando la solución para que vuelva a estar operativo. | Media |
| **GP.114** | Consultar Historial de Incidencias de un Equipo | Como Operario, quiero consultar las incidencias de un equipo (reporte, mantenimiento, alta y pago) para conocer su historial de fallas. | Media |
| **GP.117** | Filtrar Movimientos de Caja | Como Operario, quiero filtrar los movimientos del turno por tipo (ingreso/egreso) y medio de pago para revisar operaciones puntuales. | Media |
| **GP.119** | Consultar Comprobante de un Movimiento | Como Operario, quiero ver e imprimir el comprobante de un movimiento de caja para respaldar la operación. | Media |
| **GP.124** | Cerrar Turno Automáticamente | Como Dueño o Gerente (Perfil Admin), quiero que el sistema cierre solo el turno que quedó abierto de un día anterior para que la caja de cada día empiece limpia. | Media |
| **GP.125** | Consultar Registros de Arqueo | Como Dueño o Gerente (Perfil Admin), quiero consultar los cierres de caja registrados por turno, con sus movimientos y diferencias, para auditar la caja. | Media |
| **GP.127** | Consultar Reporte de Finanzas y Caja | Como Dueño o Gerente (Perfil Admin), quiero ver la evolución de ingresos y egresos y los medios de pago en gráficos para analizar la situación financiera. | Media |
| **GP.128** | Consultar Reporte de Productos y Ventas | Como Dueño o Gerente (Perfil Admin), quiero ver el ranking de productos y categorías más vendidos para decidir qué conviene ofrecer. | Media |
| **GP.129** | Consultar Reporte de Rendimiento y Operaciones | Como Dueño o Gerente (Perfil Admin), quiero ver el desempeño de cada empleado y el estado de los pedidos para evaluar la operación del taller. | Media |
| **GP.130** | Consultar Reporte de Clientes | Como Dueño o Gerente (Perfil Admin), quiero ver los mejores clientes y el comportamiento por categoría para orientar las acciones comerciales. | Media |
| **GP.131** | Consultar Reporte de Auditoría y Control | Como Dueño o Gerente (Perfil Admin), quiero ver las diferencias de arqueo, las mermas y las fallas de máquinas registradas para detectar irregularidades. | Media |
| **GP.134** | Aplicar Aumentos Porcentuales Masivos | Como Operario, quiero aplicar un aumento o un descuento porcentual de precios a todos los productos, a una categoría o a una selección manual para actualizar rápido el catálogo frente a variaciones de costos. | Media |
| **GP.18** | Exportar Historial de Actividad | Como Dueño o Gerente (Perfil Admin), quiero exportar el historial de actividad a PDF o Excel para conservarlo o presentarlo fuera del sistema. | Baja / complementaria |
| **GP.20** | Cambiar Usuario o Email Propio | Como Usuario, quiero cambiar mi nombre de usuario o mi email desde Configuración para mantener mis datos de acceso actualizados. | Baja / complementaria |
| **GP.24** | Descargar Respaldo Generado | Como Dueño o Gerente (Perfil Admin), quiero descargar un respaldo del historial de respaldos generados para guardar una copia fuera del sistema. | Baja / complementaria |
| **GP.25** | Eliminar Respaldo Generado | Como Dueño o Gerente (Perfil Admin), quiero eliminar un respaldo antiguo del historial para no acumular copias que ya no sirven. | Baja / complementaria |
| **GP.32** | Ver Ubicación de Cliente | Como Operario, quiero ver la dirección registrada de un cliente (y habilitar su edición si cambió) para coordinar los envíos. | Baja / complementaria |
| **GP.45** | Ver Ubicación de Proveedor | Como Operario, quiero ver la dirección registrada de un proveedor (y habilitar su edición si cambió) para organizar la recepción o el retiro de mercadería. | Baja / complementaria |
| **GP.53** | Operar la Venta Rápida con el Teclado | Como Operario, quiero agregar productos con Enter, cobrar con F2 y cancelar con Esc para atender más rápido sin usar el mouse. | Baja / complementaria |
| **GP.74** | Reimprimir Ticket desde el Historial | Como Operario, quiero reimprimir el ticket de un pedido ya cerrado para entregar un duplicado al cliente. | Baja / complementaria |
| **GP.84** | Registrar Ubicación Física del Pedido | Como Operario, quiero indicar dónde está guardado un pedido en el local (taller, mostrador, estante) para encontrarlo rápido al entregarlo. | Baja / complementaria |
| **GP.95** | Consultar Productos que Usan un Insumo | Como Operario, quiero ver en qué productos se usa un insumo para medir el impacto antes de modificarlo o darlo de baja. | Baja / complementaria |
| **GP.106** | Consultar Historial de Mermas | Como Dueño o Gerente (Perfil Admin), quiero consultar las mermas registradas para auditar el material perdido. | Baja / complementaria |
| **GP.120** | Exportar Movimientos de Caja | Como Dueño o Gerente (Perfil Admin), quiero descargar los movimientos de caja en Excel o en PDF para llevar el control fuera del sistema. | Baja / complementaria |
| **GP.132** | Comparar Períodos en Informes | Como Dueño o Gerente (Perfil Admin), quiero comparar un gráfico entre dos períodos para medir la evolución del negocio. | Baja / complementaria |
| **GP.133** | Exportar Informes a PDF | Como Dueño o Gerente (Perfil Admin), quiero exportar los informes a PDF para compartirlos o archivarlos. | Baja / complementaria |
| **GP.135** | Consultar Resumen del Día (Móvil) | Como Dueño, quiero ver desde el celular el estado de la caja, los pedidos en el taller y atrasados, el stock bajo y las máquinas para supervisar el local en tiempo real desde donde esté. | Baja / complementaria |
| **GP.136** | Recibir Notificaciones (Móvil) | Como Dueño, quiero ver en el celular las notificaciones de pedidos, stock bajo y movimientos de caja para enterarme de lo importante sin estar en el local. | Baja / complementaria |
| **GP.137** | Consultar Pedidos (Móvil) | Como Dueño, quiero consultar los pedidos desde el celular para seguir el trabajo del taller fuera del local. | Baja / complementaria |
| **GP.138** | Consultar Informes (Móvil) | Como Dueño, quiero ver las métricas e informes desde el celular para controlar las ventas y el rendimiento del personal en cualquier momento. | Baja / complementaria |
| **GP.139** | Consultar Estado de Máquinas y Fallas (Móvil) | Como Dueño, quiero ver desde el celular el estado operativo de las máquinas y las fallas reportadas para estar al tanto de los problemas del taller en tiempo real. | Baja / complementaria |
| **GP.140** | Alternar Modo de Interfaz | Como Usuario, quiero alternar entre Modo Claro y Modo Oscuro para adaptar la pantalla a mi comodidad visual según la iluminación de la terminal. | Baja / complementaria |
| **GP.141** | Consultar Manual de Usuario | Como Usuario, quiero ver o descargar el manual de usuario desde Configuración para resolver dudas sobre el uso del sistema. | Baja / complementaria |
| **GP.142** | Consultar al Asistente con IA | Como Usuario, quiero hacerle preguntas al asistente de ayuda con inteligencia artificial para que me explique en el momento cómo usar cada pantalla, basándose en el manual. | Baja / complementaria |

## Epics y USs asociadas

### EPIC 1: Seguridad, Acceso y Auditoría

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.01** | **Ingresar Clave de Acceso del Local.** Como Usuario, quiero ingresar la clave de acceso del local antes de la pantalla de inicio de sesión para que nadie ajeno al negocio pueda llegar al sistema. |
| **GP.02** | **Registrar Usuario.** Como Nuevo Usuario, quiero registrarme proporcionando mi información personal y mis credenciales para solicitar acceso al sistema, quedando mi cuenta pendiente de autorización. |
| **GP.03** | **Iniciar Sesión.** Como Usuario registrado y autorizado, quiero iniciar sesión con mi usuario y contraseña para acceder al panel principal con las funciones que mi perfil tiene permitidas. |
| **GP.04** | **Cerrar Sesión.** Como Usuario, quiero cerrar sesión al finalizar mi actividad para asegurar la confidencialidad de mi cuenta y liberar la terminal de trabajo. |
| **GP.05** | **Vencer Sesión por Inactividad.** Como Usuario, quiero que mi sesión venza automáticamente pasado un tiempo para que nadie pueda operar con mi cuenta si dejo la terminal abierta. |
| **GP.06** | **Autorizar Solicitud de Registro.** Como Dueño o Gerente (Perfil Admin), quiero autorizar las solicitudes de registro pendientes para habilitar el acceso de los nuevos usuarios al sistema. |
| **GP.07** | **Rechazar Solicitud de Registro.** Como Dueño o Gerente (Perfil Admin), quiero rechazar una solicitud de registro dejando la cuenta inactiva para impedir el acceso de personas no autorizadas. |
| **GP.08** | **Asignar Perfil a Usuario.** Como Dueño o Gerente (Perfil Admin), quiero asignar un perfil (Dueño, Operario o uno personalizado) a cada usuario autorizado para habilitar sus accesos operativos. |
| **GP.09** | **Registrar Empleado.** Como Dueño o Gerente (Perfil Admin), quiero dar de alta un empleado con sus datos personales, cargo y salario para mantener actualizada la nómina del local. |
| **GP.10** | **Modificar Datos de Empleado.** Como Dueño o Gerente (Perfil Admin), quiero modificar los datos, el cargo o el salario de un empleado para mantener la nómina correcta y actualizada. |
| **GP.11** | **Dar de Baja Lógica a Empleado.** Como Dueño o Gerente (Perfil Admin), quiero dar de baja lógicamente a un empleado para quitarlo de la nómina activa sin perder su historial de actividad. |
| **GP.12** | **Crear Perfil Personalizado.** Como Dueño o Gerente (Perfil Admin), quiero crear un perfil personalizado (por ejemplo, Gerente) para definir un conjunto de accesos distinto a los perfiles base. |
| **GP.13** | **Configurar Permisos de un Perfil.** Como Dueño o Gerente (Perfil Admin), quiero habilitar o deshabilitar cada módulo para un perfil desde la matriz de permisos para adaptar los accesos a las necesidades del local. |
| **GP.14** | **Asignar Usuarios a un Perfil desde la Matriz.** Como Dueño o Gerente (Perfil Admin), quiero asignar usuarios a un perfil desde la matriz de permisos para que los cambios de accesos se apliquen a todos ellos al instante. |
| **GP.15** | **Restringir Pantallas según Permisos.** Como Usuario, quiero ver en el menú solo los módulos que mi perfil tiene habilitados para no poder realizar acciones no autorizadas. |
| **GP.16** | **Consultar Historial de Actividad.** Como Dueño o Gerente (Perfil Admin), quiero consultar el historial de actividad con cada cambio importante (dato previo, dato nuevo, usuario y fecha/hora) para auditar quién modificó qué y cuándo. |
| **GP.17** | **Filtrar Historial de Actividad.** Como Dueño o Gerente (Perfil Admin), quiero filtrar el historial de actividad por tabla afectada y por usuario para encontrar rápidamente un cambio puntual. |
| **GP.18** | **Exportar Historial de Actividad.** Como Dueño o Gerente (Perfil Admin), quiero exportar el historial de actividad a PDF o Excel para conservarlo o presentarlo fuera del sistema. |
| **GP.19** | **Cambiar Contraseña Propia.** Como Usuario, quiero cambiar mi contraseña desde Configuración, ingresando la actual, para mantener segura mi cuenta. |
| **GP.20** | **Cambiar Usuario o Email Propio.** Como Usuario, quiero cambiar mi nombre de usuario o mi email desde Configuración para mantener mis datos de acceso actualizados. |
| **GP.21** | **Ver o Restablecer Contraseña de un Usuario.** Como Dueño o Gerente (Perfil Admin), quiero ver o restablecer la contraseña de otro usuario para recuperar su acceso cuando la olvida. |
| **GP.22** | **Generar Respaldo de Datos.** Como Dueño o Gerente (Perfil Admin), quiero generar un respaldo de la base de datos en el momento para resguardar la información ante cualquier problema. |
| **GP.23** | **Restaurar Respaldo de Datos.** Como Dueño o Gerente (Perfil Admin), quiero restaurar los datos desde un archivo de respaldo, confirmando la operación, para recuperar la información ante una falla. |
| **GP.24** | **Descargar Respaldo Generado.** Como Dueño o Gerente (Perfil Admin), quiero descargar un respaldo del historial de respaldos generados para guardar una copia fuera del sistema. |
| **GP.25** | **Eliminar Respaldo Generado.** Como Dueño o Gerente (Perfil Admin), quiero eliminar un respaldo antiguo del historial para no acumular copias que ya no sirven. |

### EPIC 2: Entidades Maestras y Cuentas Corrientes

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.26** | **Registrar Cliente.** Como Operario, quiero registrar un cliente con sus datos personales, su identificador único (DNI/CUIT), su contacto y su dirección física para mantener la base libre de duplicados y coordinar las entregas. |
| **GP.27** | **Registrar Datos Comerciales del Cliente.** Como Operario, quiero cargar la razón social, la persona de contacto y el límite de crédito al dar de alta un cliente para dejarlo listo para operar a cuenta corriente. |
| **GP.28** | **Modificar Cliente.** Como Operario, quiero modificar los datos personales, la dirección o los datos comerciales de un cliente para mantener su información actualizada. |
| **GP.29** | **Dar de Baja Lógica a Cliente.** Como Operario, quiero dar de baja lógicamente a un cliente para que no aparezca en las operaciones nuevas sin perder el histórico de sus transacciones. |
| **GP.30** | **Reactivar Cliente.** Como Operario, quiero reactivar un cliente dado de baja para volver a operar con él conservando su histórico. |
| **GP.31** | **Buscar Clientes.** Como Operario, quiero buscar clientes por nombre o documento y filtrarlos por estado (activo/inactivo) para encontrar rápidamente al que necesito. |
| **GP.32** | **Ver Ubicación de Cliente.** Como Operario, quiero ver la dirección registrada de un cliente (y habilitar su edición si cambió) para coordinar los envíos. |
| **GP.33** | **Crear Categoría de Descuento.** Como Operario, quiero crear categorías de clientes (por ejemplo, Estudiante o Mayorista) con un porcentaje de descuento para aplicarlas automáticamente en las ventas. |
| **GP.34** | **Modificar Categoría de Descuento.** Como Operario, quiero modificar el nombre o el porcentaje de una categoría de descuento para actualizar las reglas comerciales. |
| **GP.35** | **Eliminar Categoría de Descuento.** Como Operario, quiero eliminar una categoría de descuento que ya no se usa para mantener la lista ordenada. |
| **GP.36** | **Asignar Límite de Crédito.** Como Operario, quiero asignar o actualizar el límite de crédito de la cuenta corriente de un cliente para controlar cuánto puede deber. |
| **GP.37** | **Consultar Histórico de Cuenta Corriente.** Como Operario, quiero consultar el histórico de compras y pagos y el saldo deudor de la cuenta corriente de un cliente para conocer su situación. |
| **GP.38** | **Registrar Cobro en Cuenta Corriente.** Como Operario, quiero registrar un pago total o parcial sobre la cuenta corriente de un cliente, con su medio de pago, para reducir su saldo deudor. |
| **GP.39** | **Consultar Resumen de Cuentas Corrientes.** Como Dueño o Gerente (Perfil Admin), quiero ver el resumen de todas las cuentas corrientes activas (crédito otorgado, deuda acumulada y clientes con deuda) para controlar el riesgo comercial. |
| **GP.40** | **Registrar Proveedor.** Como Operario, quiero registrar un proveedor con sus datos, su rubro, su identificador único (CUIT), su contacto y su dirección para evitar duplicados y coordinar la recepción de mercadería. |
| **GP.41** | **Modificar Proveedor.** Como Operario, quiero modificar los datos, el rubro o la dirección de un proveedor para mantener su información actualizada. |
| **GP.42** | **Dar de Baja Lógica a Proveedor.** Como Operario, quiero dar de baja lógicamente a un proveedor para resguardar el histórico de compras asociadas. |
| **GP.43** | **Reactivar Proveedor.** Como Operario, quiero reactivar un proveedor dado de baja para volver a comprarle sin perder su histórico. |
| **GP.44** | **Buscar Proveedores.** Como Operario, quiero buscar proveedores por nombre o contacto y filtrarlos por estado y rubro para encontrar a quién comprarle cada insumo. |
| **GP.45** | **Ver Ubicación de Proveedor.** Como Operario, quiero ver la dirección registrada de un proveedor (y habilitar su edición si cambió) para organizar la recepción o el retiro de mercadería. |
| **GP.46** | **Registrar Insumo.** Como Operario, quiero registrar un insumo con su precio, unidad de consumo, unidad de compra, factor de conversión, stock mínimo y proveedor para controlar su inventario. |
| **GP.47** | **Modificar Insumo.** Como Operario, quiero modificar los datos, el precio o el stock mínimo de un insumo para mantener el catálogo actualizado. |
| **GP.48** | **Dar de Baja Lógica a Insumo.** Como Operario, quiero dar de baja lógicamente un insumo para resguardar el histórico de movimientos asociados. |
| **GP.49** | **Reactivar Insumo.** Como Operario, quiero reactivar un insumo dado de baja para volver a usarlo sin perder su histórico. |
| **GP.50** | **Buscar Insumos.** Como Operario, quiero buscar insumos por nombre y filtrarlos por estado para ubicar rápidamente uno en particular. |

### EPIC 3: Operativa de Ventas y Atención al Mostrador

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.51** | **Consultar Panel Principal.** Como Usuario, quiero ver en el panel principal los pedidos pendientes, el estado de la caja y los insumos con falta de stock para tener el día bajo control de un vistazo. |
| **GP.52** | **Registrar Venta Rápida.** Como Operario, quiero registrar una venta rápida a "Consumidor Final" sin cargar datos personales para agilizar la atención en momentos de alta demanda. |
| **GP.53** | **Operar la Venta Rápida con el Teclado.** Como Operario, quiero agregar productos con Enter, cobrar con F2 y cancelar con Esc para atender más rápido sin usar el mouse. |
| **GP.54** | **Cancelar Venta en Curso.** Como Operario, quiero cancelar una venta rápida antes de cobrarla, confirmando la acción, para descartar una carga equivocada. |
| **GP.55** | **Aplicar Categoría de Descuento.** Como Operario, quiero elegir la categoría del cliente al armar una venta o un pedido para que el sistema aplique su descuento automáticamente. |
| **GP.56** | **Registrar Pedido.** Como Operario, quiero registrar un pedido asociado a un cliente, con sus productos, fecha estimada de entrega, empleado responsable y método de pago, para formalizar el compromiso de venta. |
| **GP.57** | **Consultar Impacto en el Stock del Pedido.** Como Operario, quiero ver antes de confirmar un pedido cuánto stock de insumos y productos va a consumir para no comprometer material que no hay. |
| **GP.58** | **Generar Presupuesto.** Como Operario, quiero guardar un pedido como presupuesto, sin afectar la caja ni ocupar lugar en el taller, para cotizar trabajos a los clientes. |
| **GP.59** | **Consultar Presupuestos.** Como Operario, quiero ver los presupuestos guardados en su propia pestaña para hacer el seguimiento de las cotizaciones. |
| **GP.60** | **Convertir Presupuesto en Pedido.** Como Operario, quiero pasar un presupuesto confirmado por el cliente al estado Pendiente para que entre directo a la cola de producción. |
| **GP.61** | **Registrar Seña.** Como Operario, quiero registrar la seña o adelanto que deja el cliente al confirmar un pedido para que el sistema calcule el saldo pendiente. |
| **GP.62** | **Adjuntar Comprobante de Pago.** Como Operario, quiero adjuntar la foto o el PDF del comprobante cuando el cliente paga por transferencia para dejar respaldo del pago. |
| **GP.63** | **Cobrar Saldo de un Pedido.** Como Operario, quiero registrar el pago total o parcial del saldo de un pedido para dejarlo cancelado antes de la entrega. |
| **GP.64** | **Cobrar con Distintos Medios de Pago.** Como Operario, quiero registrar cada cobro en efectivo, transferencia, débito, crédito o cuenta corriente (sujeta al límite de crédito) para brindar flexibilidad al cliente. |
| **GP.65** | **Controlar Deuda al Entregar.** Como Operario, quiero que el sistema no permita entregar un pedido de Consumidor Final con saldo pendiente y que, en un cliente registrado, el saldo pase a su cuenta corriente avisando si supera su límite, para no perder cobros. |
| **GP.66** | **Entregar Pedido.** Como Operario, quiero marcar un pedido como Entregado cuando el cliente lo retira para que pase al historial de pedidos. |
| **GP.67** | **Notificar Pedido Listo al Cliente.** Como Operario, quiero avisarle al cliente con un clic por WhatsApp o por mail que su pedido está listo para que pase a retirarlo. |
| **GP.68** | **Emitir Ticket del Pedido (PDF).** Como Operario, quiero emitir e imprimir el ticket del pedido para el cliente, en papel o en PDF, como comprobante de la compra. |
| **GP.69** | **Emitir Comprobante de Pago (PDF).** Como Operario, quiero emitir el comprobante de cada pago registrado para entregárselo al cliente. |
| **GP.70** | **Anular Pedido.** Como Operario, quiero anular un pedido (estado Cancelado) registrando el motivo para que no avance en el taller ni consuma stock. |
| **GP.71** | **Registrar Devolución de un Pedido.** Como Operario, quiero registrar la devolución de un pedido con su motivo y elegir si se vuelve a hacer o se marca como devuelto para atender los reclamos de los clientes. |
| **GP.72** | **Consultar Historial de Pedidos.** Como Operario, quiero consultar los pedidos entregados o cancelados filtrando por cliente, empleado, fecha o estado para revisar trabajos anteriores. |
| **GP.73** | **Consultar Auditoría de Pagos de un Pedido.** Como Dueño o Gerente (Perfil Admin), quiero ver el detalle de cobros y de cambios de estado de un pedido cerrado para auditar cómo se cobró y quién lo gestionó. |
| **GP.74** | **Reimprimir Ticket desde el Historial.** Como Operario, quiero reimprimir el ticket de un pedido ya cerrado para entregar un duplicado al cliente. |

### EPIC 4: Producción, Repositorio e Historial Digital

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.75** | **Consultar Cola de Producción.** Como Operario, quiero ver la cola de pedidos del taller ordenada por urgencia o por número de pedido para organizar las prioridades de producción. |
| **GP.76** | **Consultar Tablero por Estado.** Como Operario, quiero ver los pedidos en un tablero con una columna por estado (Pendiente, En proceso, Pausado, Finalizado) para visualizar el avance del taller. |
| **GP.77** | **Filtrar Pedidos del Taller.** Como Operario, quiero filtrar los pedidos del taller por cliente, estado o empleado asignado para encontrar un trabajo puntual. |
| **GP.78** | **Consultar Pedidos Atrasados.** Como Operario, quiero ver resaltados y en una pestaña aparte los pedidos que superaron su fecha de entrega para priorizarlos. |
| **GP.79** | **Consultar Pedidos Finalizados sin Retirar.** Como Dueño o Gerente (Perfil Admin), quiero ver en la columna Finalizado los trabajos terminados que el cliente todavía no retiró para reclamar su retiro y su cobro. |
| **GP.80** | **Actualizar Estado de un Pedido.** Como Operario, quiero cambiar el estado de un pedido (Pendiente, En proceso, Pausado, Finalizado), registrando el motivo del cambio, para documentar el avance y las demoras. |
| **GP.81** | **Mover Pedido de Estado en el Tablero.** Como Operario, quiero arrastrar la tarjeta de un pedido a otra columna del tablero para cambiar su estado de forma rápida. |
| **GP.82** | **Consultar Línea de Tiempo del Pedido.** Como Operario, quiero ver la línea de tiempo de un pedido con cada cambio, quién lo hizo, cuándo y por qué para conocer su historia completa. |
| **GP.83** | **Asignar Pedido a un Operario.** Como Operario, quiero asignar o reasignar el empleado responsable de un pedido para distribuir la carga de trabajo del taller. |
| **GP.84** | **Registrar Ubicación Física del Pedido.** Como Operario, quiero indicar dónde está guardado un pedido en el local (taller, mostrador, estante) para encontrarlo rápido al entregarlo. |
| **GP.85** | **Emitir Comanda de Taller (PDF).** Como Operario, quiero emitir la comanda del taller con las especificaciones técnicas del trabajo para que acompañe físicamente al pedido durante su producción. |
| **GP.86** | **Registrar Archivo en Repositorio.** Como Operario, quiero subir un archivo (PDF/DOCX/JPG/PNG) con su título, docente, cátedra y precio base para alimentar el repositorio de apuntes, detectando la cantidad de páginas automáticamente. |
| **GP.87** | **Modificar Datos de un Archivo del Repositorio.** Como Operario, quiero modificar los datos del producto vinculado a un archivo del repositorio (nombre, precio base, stock, estado, máquina y categoría) para mantener la información correcta. |
| **GP.88** | **Eliminar Archivo del Repositorio.** Como Operario, quiero eliminar un archivo del repositorio que ya no se usa para mantener actualizada la lista de apuntes. |
| **GP.89** | **Buscar Archivos en Repositorio.** Como Operario, quiero buscar archivos por título, autor o materia y filtrarlos por cátedra e institución para encontrar rápidamente el apunte solicitado. |
| **GP.90** | **Previsualizar Archivo del Repositorio.** Como Operario, quiero previsualizar un archivo en pantalla, o verlo a pantalla completa, para confirmar que es el correcto sin descargarlo. |
| **GP.91** | **Crear Pedido de Impresión desde el Repositorio.** Como Operario, quiero crear un pedido de impresión directamente desde un archivo del repositorio para que el pedido se arme solo con ese apunte y su precio. |

### EPIC 5: Inventario, Conversión y Mantenimiento de Hardware

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.92** | **Consultar Estado del Inventario.** Como Operario, quiero ver el stock de cada insumo, empaquetado y suelto, junto a su mínimo para conocer el material disponible. |
| **GP.93** | **Recibir Alertas de Stock Crítico.** Como Operario, quiero recibir alertas visuales cuando un insumo quede por debajo de su stock mínimo para anticipar su reposición. |
| **GP.94** | **Registrar Conversión de Insumos.** Como Operario, quiero abrir bultos (por ejemplo, una resma) y que el sistema los convierta a unidades de consumo (hojas) para llevar un inventario exacto. |
| **GP.95** | **Consultar Productos que Usan un Insumo.** Como Operario, quiero ver en qué productos se usa un insumo para medir el impacto antes de modificarlo o darlo de baja. |
| **GP.96** | **Registrar Compra de Insumos.** Como Operario, quiero registrar una compra de insumos o productos, con proveedor, cantidades, precios y medio de pago, para actualizar el stock y registrar el egreso. |
| **GP.97** | **Cargar Compra desde una Foto con IA.** Como Operario, quiero subir la foto de un remito o lista de compras para que la inteligencia artificial detecte los ítems y arme la compra, que reviso antes de confirmar. |
| **GP.98** | **Registrar Producto.** Como Operario, quiero registrar un producto con su precio, stock inicial, categoría y la máquina que necesita para ofrecerlo en las ventas. |
| **GP.99** | **Modificar Producto.** Como Operario, quiero modificar el precio, la categoría, la máquina o los datos de un producto para mantener el catálogo actualizado. |
| **GP.100** | **Dar de Baja Lógica a Producto.** Como Operario, quiero desactivar un producto que ya no se vende para que no aparezca en las ventas sin perder su histórico. |
| **GP.101** | **Buscar Productos.** Como Operario, quiero buscar productos por nombre y filtrarlos por estado para ubicar rápidamente uno en particular. |
| **GP.102** | **Configurar Receta de un Producto.** Como Operario, quiero definir qué insumos y en qué cantidad consume cada producto para automatizar el cálculo de material. |
| **GP.103** | **Vincular Stock del Producto a sus Insumos.** Como Operario, quiero activar o desactivar que el stock de un producto se calcule a partir de sus insumos para manejar tanto productos fabricados como de reventa. |
| **GP.104** | **Descontar Stock Automáticamente.** Como Operario, quiero que el sistema descuente los insumos según la receta en el momento en que un pedido se marca como Finalizado para mantener el stock real sin cargas manuales. |
| **GP.105** | **Registrar Merma de Material.** Como Operario, quiero registrar mermas e impresiones fallidas de un producto o de un pedido, indicando cantidad y motivo, para descontarlas del stock y justificar el material perdido. |
| **GP.106** | **Consultar Historial de Mermas.** Como Dueño o Gerente (Perfil Admin), quiero consultar las mermas registradas para auditar el material perdido. |
| **GP.107** | **Registrar Equipo.** Como Operario, quiero registrar una máquina o equipo del taller con su nombre, estado operativo y disponibilidad para controlar el parque de equipos. |
| **GP.108** | **Modificar Equipo.** Como Operario, quiero modificar los datos, el estado operativo o la disponibilidad de un equipo para mantener su información al día. |
| **GP.109** | **Reportar Falla en un Equipo.** Como Operario, quiero reportar la falla de un equipo con su urgencia y descripción para que pase a "Fuera de Servicio" y quede registrada la incidencia. |
| **GP.110** | **Avisar en Ventas con Equipo Fuera de Servicio.** Como Operario, quiero que el sistema me avise y pida confirmación al vender un producto que depende de un equipo fuera de servicio para no prometer trabajos que no se pueden hacer. |
| **GP.111** | **Registrar Pago de Reparación.** Como Operario, quiero registrar lo que se le pagó al técnico por una reparación para que se descuente de la caja como egreso de mantenimiento. |
| **GP.112** | **Pasar Equipo a Mantenimiento.** Como Operario, quiero pasar un equipo con falla a "En mantenimiento" detallando el trabajo técnico para seguir el estado de la reparación. |
| **GP.113** | **Dar de Alta Operativa a un Equipo.** Como Operario, quiero dar de alta un equipo reparado indicando la solución para que vuelva a estar operativo. |
| **GP.114** | **Consultar Historial de Incidencias de un Equipo.** Como Operario, quiero consultar las incidencias de un equipo (reporte, mantenimiento, alta y pago) para conocer su historial de fallas. |

### EPIC 6: Tesorería, Cierres e Informes (Móvil)

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.115** | **Abrir Turno de Caja.** Como Operario, quiero abrir el turno de caja ingresando el monto inicial para comenzar a registrar las operaciones del día. |
| **GP.116** | **Consultar Flujo de Caja del Turno.** Como Operario, quiero ver el saldo actual, los ingresos, los egresos y el gráfico del turno para conocer el estado de la caja en todo momento. |
| **GP.117** | **Filtrar Movimientos de Caja.** Como Operario, quiero filtrar los movimientos del turno por tipo (ingreso/egreso) y medio de pago para revisar operaciones puntuales. |
| **GP.118** | **Registrar Movimiento Manual de Caja.** Como Usuario, quiero registrar ingresos o egresos extraordinarios con su categoría, medio de pago y descripción para asentar correctamente los gastos menores del local. |
| **GP.119** | **Consultar Comprobante de un Movimiento.** Como Operario, quiero ver e imprimir el comprobante de un movimiento de caja para respaldar la operación. |
| **GP.120** | **Exportar Movimientos de Caja.** Como Dueño o Gerente (Perfil Admin), quiero descargar los movimientos de caja en Excel o en PDF para llevar el control fuera del sistema. |
| **GP.121** | **Realizar Arqueo de Caja.** Como Operario, quiero consultar el arqueo con los montos en efectivo y en medios digitales como verificación previa al cierre de turno. |
| **GP.122** | **Cerrar Turno con Arqueo.** Como Operario, quiero cerrar el turno ingresando el efectivo contado para rendir cuentas del dinero recaudado al finalizar mi horario. |
| **GP.123** | **Justificar Diferencia de Arqueo.** Como Operario, quiero que el sistema calcule la diferencia entre lo esperado y lo contado y me pida justificarla para que ningún faltante o sobrante quede sin explicar. |
| **GP.124** | **Cerrar Turno Automáticamente.** Como Dueño o Gerente (Perfil Admin), quiero que el sistema cierre solo el turno que quedó abierto de un día anterior para que la caja de cada día empiece limpia. |
| **GP.125** | **Consultar Registros de Arqueo.** Como Dueño o Gerente (Perfil Admin), quiero consultar los cierres de caja registrados por turno, con sus movimientos y diferencias, para auditar la caja. |
| **GP.126** | **Consultar Métricas Generales.** Como Dueño o Gerente (Perfil Admin), quiero ver los ingresos totales, la cantidad de tickets, el ticket promedio y los movimientos de caja por día, semana, mes o rango de fechas para seguir el negocio. |
| **GP.127** | **Consultar Reporte de Finanzas y Caja.** Como Dueño o Gerente (Perfil Admin), quiero ver la evolución de ingresos y egresos y los medios de pago en gráficos para analizar la situación financiera. |
| **GP.128** | **Consultar Reporte de Productos y Ventas.** Como Dueño o Gerente (Perfil Admin), quiero ver el ranking de productos y categorías más vendidos para decidir qué conviene ofrecer. |
| **GP.129** | **Consultar Reporte de Rendimiento y Operaciones.** Como Dueño o Gerente (Perfil Admin), quiero ver el desempeño de cada empleado y el estado de los pedidos para evaluar la operación del taller. |
| **GP.130** | **Consultar Reporte de Clientes.** Como Dueño o Gerente (Perfil Admin), quiero ver los mejores clientes y el comportamiento por categoría para orientar las acciones comerciales. |
| **GP.131** | **Consultar Reporte de Auditoría y Control.** Como Dueño o Gerente (Perfil Admin), quiero ver las diferencias de arqueo, las mermas y las fallas de máquinas registradas para detectar irregularidades. |
| **GP.132** | **Comparar Períodos en Informes.** Como Dueño o Gerente (Perfil Admin), quiero comparar un gráfico entre dos períodos para medir la evolución del negocio. |
| **GP.133** | **Exportar Informes a PDF.** Como Dueño o Gerente (Perfil Admin), quiero exportar los informes a PDF para compartirlos o archivarlos. |
| **GP.134** | **Aplicar Aumentos Porcentuales Masivos.** Como Operario, quiero aplicar un aumento o un descuento porcentual de precios a todos los productos, a una categoría o a una selección manual para actualizar rápido el catálogo frente a variaciones de costos. |
| **GP.135** | **Consultar Resumen del Día (Móvil).** Como Dueño, quiero ver desde el celular el estado de la caja, los pedidos en el taller y atrasados, el stock bajo y las máquinas para supervisar el local en tiempo real desde donde esté. |
| **GP.136** | **Recibir Notificaciones (Móvil).** Como Dueño, quiero ver en el celular las notificaciones de pedidos, stock bajo y movimientos de caja para enterarme de lo importante sin estar en el local. |
| **GP.137** | **Consultar Pedidos (Móvil).** Como Dueño, quiero consultar los pedidos desde el celular para seguir el trabajo del taller fuera del local. |
| **GP.138** | **Consultar Informes (Móvil).** Como Dueño, quiero ver las métricas e informes desde el celular para controlar las ventas y el rendimiento del personal en cualquier momento. |
| **GP.139** | **Consultar Estado de Máquinas y Fallas (Móvil).** Como Dueño, quiero ver desde el celular el estado operativo de las máquinas y las fallas reportadas para estar al tanto de los problemas del taller en tiempo real. |

### EPIC 7: Ayuda y Experiencia de Usuario

| N° US | User Story (Título y Descripción) |
|---|---|
| **GP.140** | **Alternar Modo de Interfaz.** Como Usuario, quiero alternar entre Modo Claro y Modo Oscuro para adaptar la pantalla a mi comodidad visual según la iluminación de la terminal. |
| **GP.141** | **Consultar Manual de Usuario.** Como Usuario, quiero ver o descargar el manual de usuario desde Configuración para resolver dudas sobre el uso del sistema. |
| **GP.142** | **Consultar al Asistente con IA.** Como Usuario, quiero hacerle preguntas al asistente de ayuda con inteligencia artificial para que me explique en el momento cómo usar cada pantalla, basándose en el manual. |
