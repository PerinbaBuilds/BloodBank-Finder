import request from "supertest";
import type { Express } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { signToken } from "@/utils/jwt";

let seq = 0;
function nextSeq(): number {
  seq += 1;
  return seq;
}

export function donorPayload(overrides: Record<string, unknown> = {}) {
  const n = nextSeq();
  return {
    email: `donor${n}@test.local`,
    password: "Password123!",
    phone: `+91-90000${String(n).padStart(5, "0")}`,
    fullName: `Test Donor ${n}`,
    bloodGroup: "O-",
    gender: "MALE",
    dateOfBirth: "1995-01-01",
    weightKg: 70,
    lat: 13.0827,
    lng: 80.2707,
    address: "1 Test Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    ...overrides,
  };
}

export function orgPayload(overrides: Record<string, unknown> = {}) {
  const n = nextSeq();
  return {
    email: `org${n}@test.local`,
    password: "Password123!",
    phone: `+91-91000${String(n).padStart(5, "0")}`,
    name: `Test Org ${n}`,
    type: "HOSPITAL",
    regNumber: `REG-${n}`,
    contactPerson: "Front Desk",
    lat: 13.0827,
    lng: 80.2707,
    address: "1 Test Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    ...overrides,
  };
}

interface AuthResult {
  payload: Record<string, unknown>;
  body: Record<string, any>;
  token: string;
}

export async function registerDonor(app: Express, overrides: Record<string, unknown> = {}): Promise<AuthResult> {
  const payload = donorPayload(overrides);
  const res = await request(app).post("/api/auth/register/donor").send(payload);
  if (res.status !== 201) {
    throw new Error(`registerDonor failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { payload, body: res.body, token: res.body.token as string };
}

export async function registerOrg(app: Express, overrides: Record<string, unknown> = {}): Promise<AuthResult> {
  const payload = orgPayload(overrides);
  const res = await request(app).post("/api/auth/register/organization").send(payload);
  if (res.status !== 201) {
    throw new Error(`registerOrg failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { payload, body: res.body, token: res.body.token as string };
}

export async function createAdmin() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.create({
    data: {
      email: `admin${nextSeq()}@test.local`,
      passwordHash,
      phone: "+91-9999999999",
      role: "ADMIN",
    },
  });
  const token = signToken({ sub: user.id, role: "ADMIN" });
  return { user, token };
}

export function authHeader(token: string): [string, string] {
  return ["Authorization", `Bearer ${token}`];
}
