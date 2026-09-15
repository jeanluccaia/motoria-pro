import "server-only";

import { DGN_ADMIN_COOKIE, validateAdminSessionToken } from "../admin-session.ts";
import {
  AppointmentError,
  cancelAppointment,
  createAppointment,
  listAppointments,
  updateAppointment,
} from "./appointments-write.ts";

export interface AppointmentsRequest {
  cookies: { get(name: string): { value: string } | undefined };
  json(): Promise<unknown>;
  url: string;
}

interface RouteDependencies {
  authorize(request: AppointmentsRequest): Promise<boolean>;
  source: string;
}

const defaults: RouteDependencies = {
  authorize: (request) => validateAdminSessionToken(request.cookies.get(DGN_ADMIN_COOKIE)?.value),
  source: process.env.DGN_GROWTH_DATA_SOURCE ?? "json",
};

function unauthorized() { return Response.json({ error: "unauthorized" }, { status: 401 }); }
function dbOnly() { return Response.json({ error: "Agendamentos só estão disponíveis no modo DB." }, { status: 409 }); }
function invalidId() { return Response.json({ error: "Cliente inválido." }, { status: 400 }); }

function toResponse(error: unknown, fallback: string) {
  if (error instanceof AppointmentError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return Response.json({ error: "JSON inválido." }, { status: 400 });
  console.error("[DGN Growth] Falha no fluxo appointments", error instanceof Error ? error.message : "erro desconhecido");
  return Response.json({ error: fallback }, { status: 500 });
}

export async function handleAppointmentsGet(
  request: AppointmentsRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const rows = await listAppointments(customerId);
    return Response.json({ appointments: rows }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível listar agendamentos.");
  }
}

export async function handleAppointmentsPost(
  request: AppointmentsRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "payload inválido" }, { status: 400 });
    }
    const b = body as {
      scheduledAt?: unknown;
      serviceType?: unknown;
      notes?: unknown;
      vehicleId?: unknown;
      subscriptionId?: unknown;
    };
    if (typeof b.scheduledAt !== "string") {
      return Response.json({ error: "scheduledAt obrigatório." }, { status: 400 });
    }
    const created = await createAppointment({
      customerId,
      scheduledAt: b.scheduledAt,
      serviceType: typeof b.serviceType === "string" ? b.serviceType : null,
      notes: typeof b.notes === "string" ? b.notes : null,
      vehicleId: typeof b.vehicleId === "string" && b.vehicleId ? b.vehicleId : null,
      subscriptionId: typeof b.subscriptionId === "string" && b.subscriptionId ? b.subscriptionId : null,
      actor: "dgn-admin",
    });
    return Response.json({ appointment: created }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível criar o agendamento.");
  }
}

export async function handleAppointmentsPatch(
  request: AppointmentsRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "payload inválido" }, { status: 400 });
    }
    const b = body as {
      appointmentId?: unknown;
      scheduledAt?: unknown;
      serviceType?: unknown;
      notes?: unknown;
      vehicleId?: unknown;
      subscriptionId?: unknown;
    };
    if (typeof b.appointmentId !== "string" || !b.appointmentId) {
      return Response.json({ error: "appointmentId obrigatório." }, { status: 400 });
    }

    // Só passamos adiante campos realmente presentes no payload — assim
    // updateAppointment sabe distinguir "não mexer" (undefined) de "limpar"
    // (null explícito) para vehicleId / subscriptionId.
    const patch: {
      customerId: string;
      appointmentId: string;
      actor: string;
      scheduledAt?: string;
      serviceType?: string | null;
      notes?: string | null;
      vehicleId?: string | null;
      subscriptionId?: string | null;
    } = { customerId, appointmentId: b.appointmentId, actor: "dgn-admin" };

    if ("scheduledAt" in b) {
      if (typeof b.scheduledAt !== "string") {
        return Response.json({ error: "scheduledAt inválido." }, { status: 400 });
      }
      patch.scheduledAt = b.scheduledAt;
    }
    if ("serviceType" in b) {
      patch.serviceType = typeof b.serviceType === "string" ? b.serviceType : null;
    }
    if ("notes" in b) {
      patch.notes = typeof b.notes === "string" ? b.notes : null;
    }
    if ("vehicleId" in b) {
      patch.vehicleId = typeof b.vehicleId === "string" && b.vehicleId ? b.vehicleId : null;
    }
    if ("subscriptionId" in b) {
      patch.subscriptionId = typeof b.subscriptionId === "string" && b.subscriptionId ? b.subscriptionId : null;
    }

    const updated = await updateAppointment(patch);
    return Response.json({ appointment: updated }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível atualizar o agendamento.");
  }
}

export async function handleAppointmentsDelete(
  request: AppointmentsRequest,
  customerId: string,
  deps: RouteDependencies = defaults,
) {
  if (!(await deps.authorize(request))) return unauthorized();
  if (deps.source !== "db") return dbOnly();
  if (!customerId || customerId.length > 200) return invalidId();
  try {
    const body = await request.json().catch(() => ({}));
    const b = body as { appointmentId?: unknown; reason?: unknown };
    if (typeof b.appointmentId !== "string" || !b.appointmentId) {
      return Response.json({ error: "appointmentId obrigatório." }, { status: 400 });
    }
    const cancelled = await cancelAppointment({
      customerId,
      appointmentId: b.appointmentId,
      reason: typeof b.reason === "string" ? b.reason : null,
      actor: "dgn-admin",
    });
    return Response.json({ appointment: cancelled }, { status: 200 });
  } catch (error) {
    return toResponse(error, "Não foi possível cancelar o agendamento.");
  }
}
