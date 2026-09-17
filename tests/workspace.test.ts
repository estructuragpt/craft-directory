import { describe, expect, it } from "vitest";
import { canCreateRequirement, canManageProviderRecord, canRequestAppointment, validateAppointmentCreate, validateAppointmentStatus, validateRequirementClientPatch, validateRequirementCreate, validateRequirementStatus } from "../src/lib/workspace";

describe("workspace input validation", () => {
  it("accepts complete requirement and appointment payloads without client-controlled ownership", () => {
    expect(validateRequirementCreate({ title: " Kitchen refresh ", details: " More light ", providerId: "provider-1", clientId: "attacker" })).toEqual({ title: "Kitchen refresh", details: "More light", providerId: "provider-1" });
    expect(validateAppointmentCreate({ providerId: "provider-1", availabilityId: "slot-1", clientId: "attacker" })).toEqual({ providerId: "provider-1", availabilityId: "slot-1" });
  });
  it("rejects incomplete records and invalid status values", () => {
    expect(validateRequirementCreate({ title: "", details: "Brief" })).toBeNull();
    expect(validateAppointmentCreate({ providerId: "" })).toBeNull();
    expect(validateRequirementClientPatch({})).toBeNull();
    expect(validateRequirementStatus({ status: "deleted" })).toBeNull();
    expect(validateAppointmentStatus({ status: "confirmed" })).toBe("confirmed");
  });
});

describe("workspace authorization", () => {
  it("allows only clients to create briefs and request consultations", () => {
    expect(canCreateRequirement("client")).toBe(true);
    expect(canRequestAppointment("client")).toBe(true);
    expect(canCreateRequirement("provider")).toBe(false);
    expect(canRequestAppointment("admin")).toBe(false);
  });
  it("keeps provider actions limited to listings their account owns", () => {
    expect(canManageProviderRecord("provider", "owner-1", "owner-1")).toBe(true);
    expect(canManageProviderRecord("provider", "owner-1", "owner-2")).toBe(false);
    expect(canManageProviderRecord("admin", "admin-1", "owner-2")).toBe(true);
  });
});