import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./admin-client.ts";

// ---------------------------------------------------------------------------
// Camada de acesso Corporate Fleet (Fase 2 Frotas B2B).
//
// Todas as escritas passam pelas RPCs SECURITY DEFINER em
// supabase/migrations/20261022030000_corporate_fleet_rpcs.sql.
//
// Isolamento tri-camada:
//   1. RLS FORCE + REVOKE no DB
//   2. Validação de ownership DENTRO da RPC (COMPANY_MISMATCH)
//   3. Server resolve manager_id do JWT antes de chamar — nunca aceita
//      manager_id vindo do cliente sem autenticação.
// ---------------------------------------------------------------------------

export class CorporateFleetWriteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type CorporateRequestStatus =
  | "pending"
  | "confirmed"
  | "counter_proposed"
  | "cancelled";

// -----------------------------------------------------------------------------
// Companies
// -----------------------------------------------------------------------------

export interface CreateCompanyInput {
  legalName: string;
  displayName: string;
  cnpj?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export interface CreateCompanyResult {
  resultCode: "CREATED";
  companyId: string;
}

export async function createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.company_create");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  const legal = (input.legalName ?? "").trim();
  const display = (input.displayName ?? "").trim();
  if (!legal) throw new CorporateFleetWriteError("Razão social é obrigatória.", 400);
  if (!display) throw new CorporateFleetWriteError("Nome de exibição é obrigatório.", 400);

  const rpc = await db.rpc("crm_company_create", {
    p_legal_name: legal,
    p_display_name: display,
    p_cnpj: input.cnpj ?? null,
    p_contact_email: input.contactEmail ?? null,
    p_contact_phone: input.contactPhone ?? null,
    p_notes: input.notes ?? null,
    p_actor: actor,
  });
  if (rpc.error) throw new CorporateFleetWriteError(`Falha ao criar empresa: ${rpc.error.message}`, 502);
  const rows = (rpc.data ?? []) as Array<{ result_code?: string; company_id?: string | null }>;
  const row = rows[0] ?? {};
  if (row.result_code !== "CREATED" || !row.company_id) {
    throw new CorporateFleetWriteError(`Retorno inesperado de crm_company_create: ${row.result_code}`, 502);
  }
  return { resultCode: "CREATED", companyId: row.company_id };
}

// -----------------------------------------------------------------------------
// Managers
// -----------------------------------------------------------------------------

export interface CreateManagerInput {
  companyId: string;
  displayName: string;
  email: string;
  phone?: string | null;
  authUserId?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export type CreateManagerResult =
  | { resultCode: "CREATED"; managerId: string }
  | { resultCode: "COMPANY_NOT_FOUND" | "EMAIL_ALREADY_IN_COMPANY"; managerId: null };

export async function createManager(input: CreateManagerInput): Promise<CreateManagerResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.manager_create");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  const name = (input.displayName ?? "").trim();
  const email = (input.email ?? "").trim();
  if (!name) throw new CorporateFleetWriteError("Nome do gestor é obrigatório.", 400);
  if (!email) throw new CorporateFleetWriteError("E-mail é obrigatório.", 400);
  if (!input.companyId) throw new CorporateFleetWriteError("Empresa é obrigatória.", 400);

  const rpc = await db.rpc("crm_company_manager_create", {
    p_company_id: input.companyId,
    p_display_name: name,
    p_email: email,
    p_phone: input.phone ?? null,
    p_auth_user_id: input.authUserId ?? null,
    p_actor: actor,
  });
  if (rpc.error) throw new CorporateFleetWriteError(`Falha ao criar gestor: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; manager_id?: string | null }>;
  const row = rows[0] ?? {};
  if (row.result_code === "CREATED" && row.manager_id) {
    return { resultCode: "CREATED", managerId: row.manager_id };
  }
  if (row.result_code === "COMPANY_NOT_FOUND" || row.result_code === "EMAIL_ALREADY_IN_COMPANY") {
    return { resultCode: row.result_code, managerId: null };
  }
  throw new CorporateFleetWriteError(`Retorno inesperado de crm_company_manager_create: ${row.result_code}`, 502);
}

// -----------------------------------------------------------------------------
// Fleet vehicles
// -----------------------------------------------------------------------------

export interface CreateFleetVehicleInput {
  companyId: string;
  plate: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  driverName?: string | null;
  nickname?: string | null;
  notes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export type CreateFleetVehicleResult =
  | { resultCode: "CREATED"; vehicleId: string }
  | { resultCode: "COMPANY_NOT_FOUND" | "PLATE_ALREADY_IN_COMPANY"; vehicleId: null };

export async function createFleetVehicle(input: CreateFleetVehicleInput): Promise<CreateFleetVehicleResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.vehicle_create");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  const plate = (input.plate ?? "").trim();
  if (!plate) throw new CorporateFleetWriteError("Placa é obrigatória.", 400);
  if (!input.companyId) throw new CorporateFleetWriteError("Empresa é obrigatória.", 400);

  const rpc = await db.rpc("crm_fleet_vehicle_create", {
    p_company_id: input.companyId,
    p_plate: plate,
    p_make: input.make ?? null,
    p_model: input.model ?? null,
    p_year: input.year ?? null,
    p_color: input.color ?? null,
    p_driver_name: input.driverName ?? null,
    p_nickname: input.nickname ?? null,
    p_notes: input.notes ?? null,
    p_actor: actor,
  });
  if (rpc.error) throw new CorporateFleetWriteError(`Falha ao criar veículo da frota: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; vehicle_id?: string | null }>;
  const row = rows[0] ?? {};
  if (row.result_code === "CREATED" && row.vehicle_id) {
    return { resultCode: "CREATED", vehicleId: row.vehicle_id };
  }
  if (row.result_code === "COMPANY_NOT_FOUND" || row.result_code === "PLATE_ALREADY_IN_COMPANY") {
    return { resultCode: row.result_code, vehicleId: null };
  }
  throw new CorporateFleetWriteError(`Retorno inesperado de crm_fleet_vehicle_create: ${row.result_code}`, 502);
}

// -----------------------------------------------------------------------------
// Service requests
// -----------------------------------------------------------------------------

export interface CreateServiceRequestInput {
  fleetVehicleId: string;
  managerId: string;
  serviceType: string;
  preferredDate1: string;
  preferredDate2?: string | null;
  managerNotes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export type CreateServiceRequestResult =
  | { resultCode: "CREATED"; requestId: string }
  | {
      resultCode: "FLEET_VEHICLE_NOT_FOUND" | "MANAGER_NOT_FOUND" | "MANAGER_INACTIVE" | "COMPANY_MISMATCH";
      requestId: null;
    };

export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<CreateServiceRequestResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.request_create");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  const service = (input.serviceType ?? "").trim();
  if (!service) throw new CorporateFleetWriteError("Tipo de serviço é obrigatório.", 400);
  if (!input.fleetVehicleId) throw new CorporateFleetWriteError("Veículo é obrigatório.", 400);
  if (!input.managerId) throw new CorporateFleetWriteError("Gestor é obrigatório.", 400);
  if (!input.preferredDate1) throw new CorporateFleetWriteError("Data preferencial é obrigatória.", 400);

  const rpc = await db.rpc("crm_corporate_request_create", {
    p_fleet_vehicle_id: input.fleetVehicleId,
    p_manager_id: input.managerId,
    p_service_type: service,
    p_preferred_date_1: input.preferredDate1,
    p_preferred_date_2: input.preferredDate2 ?? null,
    p_manager_notes: input.managerNotes ?? null,
    p_actor: actor,
  });
  if (rpc.error) throw new CorporateFleetWriteError(`Falha ao criar solicitação: ${rpc.error.message}`, 502);

  const rows = (rpc.data ?? []) as Array<{ result_code?: string; request_id?: string | null }>;
  const row = rows[0] ?? {};
  if (row.result_code === "CREATED" && row.request_id) {
    return { resultCode: "CREATED", requestId: row.request_id };
  }
  const known = [
    "FLEET_VEHICLE_NOT_FOUND",
    "MANAGER_NOT_FOUND",
    "MANAGER_INACTIVE",
    "COMPANY_MISMATCH",
  ] as const;
  if (known.includes(row.result_code as (typeof known)[number])) {
    return { resultCode: row.result_code as (typeof known)[number], requestId: null };
  }
  throw new CorporateFleetWriteError(`Retorno inesperado de crm_corporate_request_create: ${row.result_code}`, 502);
}

// Transições admin / manager -----------------------------------------------

export interface ConfirmRequestInput {
  requestId: string;
  scheduledAt: string;
  adminNotes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export type DecisionResultCode =
  | "UPDATED"
  | "ALREADY_CONFIRMED"
  | "ALREADY_CANCELLED"
  | "INVALID_STATE_TRANSITION"
  | "NOT_FOUND"
  | "MANAGER_MISMATCH";

export interface DecisionResult {
  resultCode: DecisionResultCode;
  requestId: string | null;
}

async function callDecision(
  rpcName: string,
  params: Record<string, unknown>,
  allowed: readonly DecisionResultCode[],
  db: SupabaseClient,
): Promise<DecisionResult> {
  const rpc = await db.rpc(rpcName, params);
  if (rpc.error) throw new CorporateFleetWriteError(`Falha em ${rpcName}: ${rpc.error.message}`, 502);
  const rows = (rpc.data ?? []) as Array<{ result_code?: string; request_id?: string | null }>;
  const row = rows[0] ?? {};
  const code = allowed.includes(row.result_code as DecisionResultCode)
    ? (row.result_code as DecisionResultCode)
    : null;
  if (!code) throw new CorporateFleetWriteError(`Retorno inesperado de ${rpcName}: ${row.result_code}`, 502);
  return { resultCode: code, requestId: row.request_id ?? null };
}

export async function confirmServiceRequest(input: ConfirmRequestInput): Promise<DecisionResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.request_confirm");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  if (!input.requestId) throw new CorporateFleetWriteError("Solicitação é obrigatória.", 400);
  if (!input.scheduledAt) throw new CorporateFleetWriteError("Data confirmada é obrigatória.", 400);
  return callDecision(
    "crm_corporate_request_confirm",
    {
      p_request_id: input.requestId,
      p_scheduled_at: input.scheduledAt,
      p_admin_notes: input.adminNotes ?? null,
      p_actor: actor,
    },
    ["UPDATED", "ALREADY_CONFIRMED", "INVALID_STATE_TRANSITION", "NOT_FOUND"],
    db,
  );
}

export interface CounterProposeInput {
  requestId: string;
  proposedAt: string;
  adminNotes?: string | null;
  actor: string;
  db?: SupabaseClient;
}

export async function counterProposeServiceRequest(input: CounterProposeInput): Promise<DecisionResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.request_counter_propose");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  if (!input.requestId) throw new CorporateFleetWriteError("Solicitação é obrigatória.", 400);
  if (!input.proposedAt) throw new CorporateFleetWriteError("Nova data é obrigatória.", 400);
  return callDecision(
    "crm_corporate_request_counter_propose",
    {
      p_request_id: input.requestId,
      p_proposed_at: input.proposedAt,
      p_admin_notes: input.adminNotes ?? null,
      p_actor: actor,
    },
    ["UPDATED", "INVALID_STATE_TRANSITION", "NOT_FOUND"],
    db,
  );
}

export interface AcceptCounterInput {
  requestId: string;
  managerId: string;
  actor: string;
  db?: SupabaseClient;
}

export async function acceptCounterServiceRequest(input: AcceptCounterInput): Promise<DecisionResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.request_accept_counter");
  const actor = (input.actor ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  if (!input.requestId) throw new CorporateFleetWriteError("Solicitação é obrigatória.", 400);
  if (!input.managerId) throw new CorporateFleetWriteError("Gestor é obrigatório.", 400);
  return callDecision(
    "crm_corporate_request_accept_counter",
    { p_request_id: input.requestId, p_manager_id: input.managerId, p_actor: actor },
    ["UPDATED", "MANAGER_MISMATCH", "INVALID_STATE_TRANSITION", "NOT_FOUND"],
    db,
  );
}

export interface CancelRequestInput {
  requestId: string;
  reason: string;
  actor: string;
  db?: SupabaseClient;
}

export async function cancelServiceRequest(input: CancelRequestInput): Promise<DecisionResult> {
  const db = input.db ?? getSupabaseAdminClient("corporate_fleet.request_cancel");
  const actor = (input.actor ?? "").trim();
  const reason = (input.reason ?? "").trim();
  if (!actor) throw new CorporateFleetWriteError("Actor é obrigatório.", 400);
  if (!reason) throw new CorporateFleetWriteError("Motivo do cancelamento é obrigatório.", 400);
  if (!input.requestId) throw new CorporateFleetWriteError("Solicitação é obrigatória.", 400);
  return callDecision(
    "crm_corporate_request_cancel",
    { p_request_id: input.requestId, p_reason: reason, p_actor: actor },
    ["UPDATED", "ALREADY_CANCELLED", "NOT_FOUND"],
    db,
  );
}

// -----------------------------------------------------------------------------
// Readers (via from(), service_role bypass RLS)
// -----------------------------------------------------------------------------

export interface CompanyRow {
  id: string;
  legalName: string;
  displayName: string;
  cnpj: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyRaw {
  id: string;
  legal_name: string;
  display_name: string;
  cnpj: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapCompany(r: CompanyRaw): CompanyRow {
  return {
    id: r.id,
    legalName: r.legal_name,
    displayName: r.display_name,
    cnpj: r.cnpj,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    isActive: r.is_active,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listCompanies(options: { db?: SupabaseClient } = {}): Promise<CompanyRow[]> {
  const db = options.db ?? getSupabaseAdminClient("corporate_fleet.companies_list");
  const { data, error } = await db
    .from("crm_companies")
    .select("id, legal_name, display_name, cnpj, contact_email, contact_phone, is_active, notes, created_at, updated_at")
    .order("display_name", { ascending: true });
  if (error) throw new CorporateFleetWriteError(`Falha ao listar empresas: ${error.message}`, 502);
  return ((data ?? []) as CompanyRaw[]).map(mapCompany);
}

export interface ManagerRow {
  id: string;
  companyId: string;
  authUserId: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ManagerRaw {
  id: string;
  company_id: string;
  auth_user_id: string | null;
  display_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

function mapManager(r: ManagerRaw): ManagerRow {
  return {
    id: r.id,
    companyId: r.company_id,
    authUserId: r.auth_user_id,
    displayName: r.display_name,
    email: r.email,
    phone: r.phone,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export async function findManagerByAuthUserId(
  authUserId: string,
  options: { db?: SupabaseClient } = {},
): Promise<ManagerRow | null> {
  const db = options.db ?? getSupabaseAdminClient("corporate_fleet.manager_by_auth");
  const { data, error } = await db
    .from("crm_company_managers")
    .select("id, company_id, auth_user_id, display_name, email, phone, is_active, created_at")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new CorporateFleetWriteError(`Falha ao resolver gestor: ${error.message}`, 502);
  return data ? mapManager(data as ManagerRaw) : null;
}

export async function listManagersByCompany(
  companyId: string,
  options: { db?: SupabaseClient } = {},
): Promise<ManagerRow[]> {
  const db = options.db ?? getSupabaseAdminClient("corporate_fleet.managers_list");
  const { data, error } = await db
    .from("crm_company_managers")
    .select("id, company_id, auth_user_id, display_name, email, phone, is_active, created_at")
    .eq("company_id", companyId)
    .order("display_name", { ascending: true });
  if (error) throw new CorporateFleetWriteError(`Falha ao listar gestores: ${error.message}`, 502);
  return ((data ?? []) as ManagerRaw[]).map(mapManager);
}

export interface FleetVehicleRow {
  id: string;
  companyId: string;
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  driverName: string | null;
  nickname: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

interface FleetVehicleRaw {
  id: string;
  company_id: string;
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  driver_name: string | null;
  nickname: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

function mapFleetVehicle(r: FleetVehicleRaw): FleetVehicleRow {
  return {
    id: r.id,
    companyId: r.company_id,
    plate: r.plate,
    make: r.make,
    model: r.model,
    year: r.year,
    color: r.color,
    driverName: r.driver_name,
    nickname: r.nickname,
    notes: r.notes,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export async function listFleetVehiclesByCompany(
  companyId: string,
  options: { db?: SupabaseClient } = {},
): Promise<FleetVehicleRow[]> {
  const db = options.db ?? getSupabaseAdminClient("corporate_fleet.vehicles_list");
  const { data, error } = await db
    .from("crm_company_fleet_vehicles")
    .select("id, company_id, plate, make, model, year, color, driver_name, nickname, notes, is_active, created_at")
    .eq("company_id", companyId)
    .order("plate", { ascending: true });
  if (error) throw new CorporateFleetWriteError(`Falha ao listar veículos da frota: ${error.message}`, 502);
  return ((data ?? []) as FleetVehicleRaw[]).map(mapFleetVehicle);
}

export interface ServiceRequestRow {
  id: string;
  companyId: string;
  fleetVehicleId: string;
  requestedByManagerId: string;
  status: CorporateRequestStatus;
  serviceType: string;
  preferredDate1: string;
  preferredDate2: string | null;
  managerNotes: string | null;
  decidedByActor: string | null;
  decidedAt: string | null;
  scheduledAt: string | null;
  adminNotes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ServiceRequestRaw {
  id: string;
  company_id: string;
  fleet_vehicle_id: string;
  requested_by_manager_id: string;
  status: CorporateRequestStatus;
  service_type: string;
  preferred_date_1: string;
  preferred_date_2: string | null;
  manager_notes: string | null;
  decided_by_actor: string | null;
  decided_at: string | null;
  scheduled_at: string | null;
  admin_notes: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

function mapServiceRequest(r: ServiceRequestRaw): ServiceRequestRow {
  return {
    id: r.id,
    companyId: r.company_id,
    fleetVehicleId: r.fleet_vehicle_id,
    requestedByManagerId: r.requested_by_manager_id,
    status: r.status,
    serviceType: r.service_type,
    preferredDate1: r.preferred_date_1,
    preferredDate2: r.preferred_date_2,
    managerNotes: r.manager_notes,
    decidedByActor: r.decided_by_actor,
    decidedAt: r.decided_at,
    scheduledAt: r.scheduled_at,
    adminNotes: r.admin_notes,
    cancelReason: r.cancel_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface ListServiceRequestsFilter {
  companyId?: string;
  status?: CorporateRequestStatus | CorporateRequestStatus[];
  limit?: number;
  db?: SupabaseClient;
}

export async function listServiceRequests(
  filter: ListServiceRequestsFilter = {},
): Promise<ServiceRequestRow[]> {
  const db = filter.db ?? getSupabaseAdminClient("corporate_fleet.requests_list");
  let q = db
    .from("crm_corporate_service_requests")
    .select(
      "id, company_id, fleet_vehicle_id, requested_by_manager_id, status, service_type, preferred_date_1, preferred_date_2, manager_notes, decided_by_actor, decided_at, scheduled_at, admin_notes, cancel_reason, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 100);
  if (filter.companyId) q = q.eq("company_id", filter.companyId);
  if (filter.status) {
    if (Array.isArray(filter.status)) q = q.in("status", filter.status);
    else q = q.eq("status", filter.status);
  }
  const { data, error } = await q;
  if (error) throw new CorporateFleetWriteError(`Falha ao listar solicitações: ${error.message}`, 502);
  return ((data ?? []) as ServiceRequestRaw[]).map(mapServiceRequest);
}
