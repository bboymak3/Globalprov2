import { onRequestPost as __api_admin_asignar_orden_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\asignar-orden.js"
import { onRequestGet as __api_admin_ordenes_aprobadas_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\ordenes-aprobadas.js"
import { onRequestGet as __api_admin_ordenes_disponibles_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\ordenes-disponibles.js"
import { onRequestGet as __api_admin_ordenes_tecnico_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\ordenes-tecnico.js"
import { onRequestGet as __api_admin_resumen_tecnicos_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\resumen-tecnicos.js"
import { onRequestGet as __api_admin_tecnicos_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\tecnicos.js"
import { onRequestPost as __api_admin_tecnicos_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\admin\\tecnicos.js"
import { onRequestPost as __api_tecnico_agregar_nota_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\agregar-nota.js"
import { onRequestPost as __api_tecnico_cambiar_estado_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\cambiar-estado.js"
import { onRequestPost as __api_tecnico_cerrar_orden_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\cerrar-orden.js"
import { onRequestGet as __api_tecnico_fotos_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\fotos.js"
import { onRequestPost as __api_tecnico_generar_token_firma_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\generar-token-firma.js"
import { onRequestGet as __api_tecnico_historial_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\historial.js"
import { onRequestPost as __api_tecnico_login_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\login.js"
import { onRequestGet as __api_tecnico_notas_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\notas.js"
import { onRequestGet as __api_tecnico_orden_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\orden.js"
import { onRequestGet as __api_tecnico_ordenes_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\ordenes.js"
import { onRequestPost as __api_tecnico_subir_foto_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\tecnico\\subir-foto.js"
import { onRequestPost as __api_aprobar_orden_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\aprobar-orden.js"
import { onRequestGet as __api_buscar_ordenes_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\buscar-ordenes.js"
import { onRequestGet as __api_buscar_patente_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\buscar-patente.js"
import { onRequestPost as __api_cancelar_orden_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\cancelar-orden.js"
import { onRequestPost as __api_crear_orden_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\crear-orden.js"
import { onRequestGet as __api_proximo_numero_orden_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\proximo-numero-orden.js"
import { onRequestGet as __api_ver_orden_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\api\\ver-orden.js"
import { onRequestGet as __aprobar_index_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\aprobar\\index.js"
import { onRequestGet as __aprobar_tecnico_index_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\aprobar-tecnico\\index.js"
import { onRequestPost as __aprobar_tecnico_index_js_onRequestPost } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\aprobar-tecnico\\index.js"
import { onRequestGet as __ver_ot_index_js_onRequestGet } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\ver-ot\\index.js"
import { onRequest as __aprobar__middleware_js_onRequest } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\aprobar\\_middleware.js"
import { onRequest as ___middleware_js_onRequest } from "E:\\Documents\\globalprov2\\Globalprov2\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/admin/asignar-orden",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_asignar_orden_js_onRequestPost],
    },
  {
      routePath: "/api/admin/ordenes-aprobadas",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_ordenes_aprobadas_js_onRequestGet],
    },
  {
      routePath: "/api/admin/ordenes-disponibles",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_ordenes_disponibles_js_onRequestGet],
    },
  {
      routePath: "/api/admin/ordenes-tecnico",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_ordenes_tecnico_js_onRequestGet],
    },
  {
      routePath: "/api/admin/resumen-tecnicos",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_resumen_tecnicos_js_onRequestGet],
    },
  {
      routePath: "/api/admin/tecnicos",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_tecnicos_js_onRequestGet],
    },
  {
      routePath: "/api/admin/tecnicos",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_tecnicos_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/agregar-nota",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_agregar_nota_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/cambiar-estado",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_cambiar_estado_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/cerrar-orden",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_cerrar_orden_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/fotos",
      mountPath: "/api/tecnico",
      method: "GET",
      middlewares: [],
      modules: [__api_tecnico_fotos_js_onRequestGet],
    },
  {
      routePath: "/api/tecnico/generar-token-firma",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_generar_token_firma_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/historial",
      mountPath: "/api/tecnico",
      method: "GET",
      middlewares: [],
      modules: [__api_tecnico_historial_js_onRequestGet],
    },
  {
      routePath: "/api/tecnico/login",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_login_js_onRequestPost],
    },
  {
      routePath: "/api/tecnico/notas",
      mountPath: "/api/tecnico",
      method: "GET",
      middlewares: [],
      modules: [__api_tecnico_notas_js_onRequestGet],
    },
  {
      routePath: "/api/tecnico/orden",
      mountPath: "/api/tecnico",
      method: "GET",
      middlewares: [],
      modules: [__api_tecnico_orden_js_onRequestGet],
    },
  {
      routePath: "/api/tecnico/ordenes",
      mountPath: "/api/tecnico",
      method: "GET",
      middlewares: [],
      modules: [__api_tecnico_ordenes_js_onRequestGet],
    },
  {
      routePath: "/api/tecnico/subir-foto",
      mountPath: "/api/tecnico",
      method: "POST",
      middlewares: [],
      modules: [__api_tecnico_subir_foto_js_onRequestPost],
    },
  {
      routePath: "/api/aprobar-orden",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_aprobar_orden_js_onRequestPost],
    },
  {
      routePath: "/api/buscar-ordenes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_buscar_ordenes_js_onRequestGet],
    },
  {
      routePath: "/api/buscar-patente",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_buscar_patente_js_onRequestGet],
    },
  {
      routePath: "/api/cancelar-orden",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_cancelar_orden_js_onRequestPost],
    },
  {
      routePath: "/api/crear-orden",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_crear_orden_js_onRequestPost],
    },
  {
      routePath: "/api/proximo-numero-orden",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_proximo_numero_orden_js_onRequestGet],
    },
  {
      routePath: "/api/ver-orden",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_ver_orden_js_onRequestGet],
    },
  {
      routePath: "/aprobar",
      mountPath: "/aprobar",
      method: "GET",
      middlewares: [],
      modules: [__aprobar_index_js_onRequestGet],
    },
  {
      routePath: "/aprobar-tecnico",
      mountPath: "/aprobar-tecnico",
      method: "GET",
      middlewares: [],
      modules: [__aprobar_tecnico_index_js_onRequestGet],
    },
  {
      routePath: "/aprobar-tecnico",
      mountPath: "/aprobar-tecnico",
      method: "POST",
      middlewares: [],
      modules: [__aprobar_tecnico_index_js_onRequestPost],
    },
  {
      routePath: "/ver-ot",
      mountPath: "/ver-ot",
      method: "GET",
      middlewares: [],
      modules: [__ver_ot_index_js_onRequestGet],
    },
  {
      routePath: "/aprobar",
      mountPath: "/aprobar",
      method: "",
      middlewares: [__aprobar__middleware_js_onRequest],
      modules: [],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]