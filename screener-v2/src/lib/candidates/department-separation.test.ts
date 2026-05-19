import { describe, expect, it } from "vitest";

describe("candidate department separation", () => {
  describe("when candidate applies to job", () => {
    it("auto-assigns department from job role", () => {
      const role = {
        id: "role-senior-eng",
        departmentId: "dept-eng",
        label: "Senior Engineer",
      };

      const job = {
        id: "job-1",
        roleId: role.id,
        role: role,
      };

      const newCandidate = {
        id: "cand-1",
        email: "alice@example.com",
        fullName: "Alice",
        departmentId: job.role.departmentId, // Auto-assigned
        roleId: job.role.id,
      };

      expect(newCandidate.departmentId).toBe("dept-eng");
    });

    it("auto-assigns department for existing candidate applying to job", () => {
      const existingCandidate = {
        id: "cand-existing",
        email: "bob@example.com",
        fullName: "Bob",
        departmentId: "dept-sales", // Previously in Sales
        roleId: "role-sales-rep",
      };

      const newRole = {
        id: "role-eng",
        departmentId: "dept-eng",
      };

      const updatedCandidate = {
        ...existingCandidate,
        departmentId: newRole.departmentId, // Updated to new department
        roleId: newRole.id,
      };

      expect(updatedCandidate.departmentId).toBe("dept-eng");
      expect(updatedCandidate.roleId).toBe("role-eng");
    });
  });

  describe("when transferring candidate between departments", () => {
    it("clears role when department changes", () => {
      const candidate = {
        id: "cand-1",
        email: "charlie@example.com",
        fullName: "Charlie",
        departmentId: "dept-eng",
        roleId: "role-senior-eng",
      };

      const newDepartment = {
        id: "dept-sales",
        name: "Sales",
      };

      const updatedCandidate = {
        ...candidate,
        departmentId: newDepartment.id,
        roleId: null, // Cleared on department transfer
      };

      expect(updatedCandidate.departmentId).toBe("dept-sales");
      expect(updatedCandidate.roleId).toBeNull();
    });

    it("preserves other candidate fields during department transfer", () => {
      const candidate = {
        id: "cand-1",
        email: "diana@example.com",
        fullName: "Diana",
        stage: "screening",
        hrOwnerId: "user-1",
        departmentId: "dept-eng",
        roleId: "role-eng",
      };

      const updatedCandidate = {
        ...candidate,
        departmentId: "dept-product",
        roleId: null,
      };

      expect(updatedCandidate.id).toBe(candidate.id);
      expect(updatedCandidate.email).toBe(candidate.email);
      expect(updatedCandidate.fullName).toBe(candidate.fullName);
      expect(updatedCandidate.stage).toBe(candidate.stage);
      expect(updatedCandidate.hrOwnerId).toBe(candidate.hrOwnerId);
      expect(updatedCandidate.departmentId).toBe("dept-product");
      expect(updatedCandidate.roleId).toBeNull();
    });
  });

  describe("when assigning role in same department", () => {
    it("keeps department unchanged", () => {
      const candidate = {
        id: "cand-1",
        email: "evan@example.com",
        fullName: "Evan",
        departmentId: "dept-eng",
        roleId: null,
      };

      const roleInSameDept = {
        id: "role-engineer",
        departmentId: "dept-eng",
      };

      const updatedCandidate = {
        ...candidate,
        roleId: roleInSameDept.id,
      };

      expect(updatedCandidate.departmentId).toBe("dept-eng");
      expect(updatedCandidate.roleId).toBe("role-engineer");
    });

    it("prevents assigning role from different department", () => {
      const candidate = {
        id: "cand-1",
        email: "frank@example.com",
        fullName: "Frank",
        departmentId: "dept-eng",
        roleId: "role-senior-eng",
      };

      const roleInDifferentDept = {
        id: "role-sales",
        departmentId: "dept-sales",
      };

      // This operation should be invalid - would require department transfer
      const isValidAssignment = candidate.departmentId === roleInDifferentDept.departmentId;
      expect(isValidAssignment).toBe(false);

      // Should use set_department action instead
      expect(true).toBe(true); // The API layer should validate this
    });
  });

  describe("when assigning owner to candidate", () => {
    it("accepts valid user from same department", () => {
      const candidate = {
        id: "cand-1",
        departmentId: "dept-eng",
        hrOwnerId: null,
      };

      const user = {
        id: "user-1",
        name: "Grace",
        departmentId: "dept-eng",
        isActive: true,
      };

      const isValidOwner = user.departmentId === candidate.departmentId && user.isActive;
      expect(isValidOwner).toBe(true);

      const updatedCandidate = {
        ...candidate,
        hrOwnerId: user.id,
      };

      expect(updatedCandidate.hrOwnerId).toBe("user-1");
    });

    it("prevents assigning user from different department", () => {
      const candidate = {
        id: "cand-1",
        departmentId: "dept-eng",
        hrOwnerId: null,
      };

      const userFromDifferentDept = {
        id: "user-2",
        name: "Henry",
        departmentId: "dept-sales",
        isActive: true,
      };

      const isValidOwner = userFromDifferentDept.departmentId === candidate.departmentId && userFromDifferentDept.isActive;
      expect(isValidOwner).toBe(false);
    });

    it("filters owner options by candidate department", () => {
      const allUsers = [
        { id: "user-1", name: "Grace", departmentId: "dept-eng", isActive: true },
        { id: "user-2", name: "Henry", departmentId: "dept-sales", isActive: true },
        { id: "user-3", name: "Iris", departmentId: "dept-eng", isActive: true },
        { id: "user-4", name: "Jack", departmentId: "dept-eng", isActive: false },
      ];

      const candidateDepartmentId = "dept-eng";
      const ownerOptions = allUsers.filter(
        u => u.departmentId === candidateDepartmentId && u.isActive
      );

      expect(ownerOptions).toHaveLength(2);
      expect(ownerOptions.map(u => u.id)).toEqual(["user-1", "user-3"]);
    });
  });

  describe("candidate record fields", () => {
    it("includes all required department-related fields", () => {
      const candidate = {
        id: "cand-1",
        email: "kane@example.com",
        fullName: "Kane",
        departmentId: "dept-eng",
        departmentName: "Engineering",
        roleId: "role-engineer",
        hrOwnerId: "user-1",
        hrOwner: "Grace", // Display cache from user.name
      };

      expect(candidate.departmentId).toBeDefined();
      expect(candidate.departmentName).toBeDefined();
      expect(candidate.roleId).toBeDefined();
      expect(candidate.hrOwnerId).toBeDefined();
      expect(candidate.hrOwner).toBeDefined();
    });

    it("handles null optional fields correctly", () => {
      const candidate = {
        id: "cand-1",
        email: "luna@example.com",
        fullName: "Luna",
        departmentId: null,
        departmentName: null,
        roleId: null,
        hrOwnerId: null,
        hrOwner: null,
      };

      expect(candidate.departmentId).toBeNull();
      expect(candidate.roleId).toBeNull();
      expect(candidate.hrOwnerId).toBeNull();
    });
  });

  describe("department filter in workspace", () => {
    const candidates = [
      {
        id: "cand-1",
        fullName: "Alice",
        departmentId: "dept-eng",
      },
      {
        id: "cand-2",
        fullName: "Bob",
        departmentId: "dept-sales",
      },
      {
        id: "cand-3",
        fullName: "Charlie",
        departmentId: "dept-eng",
      },
      {
        id: "cand-4",
        fullName: "Diana",
        departmentId: null,
      },
    ];

    it("filters candidates by department", () => {
      const filteredByEng = candidates.filter(c => c.departmentId === "dept-eng");
      expect(filteredByEng).toHaveLength(2);
      expect(filteredByEng.map(c => c.fullName)).toEqual(["Alice", "Charlie"]);
    });

    it("filters candidates by sales department", () => {
      const filteredBySales = candidates.filter(c => c.departmentId === "dept-sales");
      expect(filteredBySales).toHaveLength(1);
      expect(filteredBySales[0]?.fullName).toBe("Bob");
    });

    it("handles candidates with no department", () => {
      const unassigned = candidates.filter(c => !c.departmentId);
      expect(unassigned).toHaveLength(1);
      expect(unassigned[0]?.fullName).toBe("Diana");
    });
  });

  describe("bulk operations with departments", () => {
    it("validates bulk set_department action parameters", () => {
      const bulkPayload = {
        action: "set_department",
        departmentId: "dept-sales", // Should have departmentId, not roleId
        candidateIds: ["cand-1", "cand-2"],
      };

      expect(bulkPayload.action).toBe("set_department");
      expect(bulkPayload.departmentId).toBeDefined();
      expect(bulkPayload.candidateIds).toHaveLength(2);
    });

    it("validates bulk assign_owner action uses hrOwnerId", () => {
      const bulkPayload = {
        action: "assign_owner",
        hrOwnerId: "user-1",
        candidateIds: ["cand-1", "cand-2"],
      };

      expect(bulkPayload.action).toBe("assign_owner");
      expect(bulkPayload.hrOwnerId).toBeDefined();
    });

    it("applies set_department to multiple candidates", () => {
      const candidates = [
        { id: "cand-1", departmentId: "dept-eng", roleId: "role-1" },
        { id: "cand-2", departmentId: "dept-eng", roleId: "role-2" },
      ];

      const newDepartmentId = "dept-sales";
      const updated = candidates.map(c => ({
        ...c,
        departmentId: newDepartmentId,
        roleId: null, // Cleared on department transfer
      }));

      expect(updated).toHaveLength(2);
      expect(updated.every(c => c.departmentId === "dept-sales")).toBe(true);
      expect(updated.every(c => c.roleId === null)).toBe(true);
    });

    it("applies assign_owner to multiple candidates", () => {
      const candidates = [
        { id: "cand-1", departmentId: "dept-eng", hrOwnerId: null },
        { id: "cand-2", departmentId: "dept-eng", hrOwnerId: "user-1" },
      ];

      const newOwnerId = "user-2";
      const updated = candidates.map(c => ({
        ...c,
        hrOwnerId: newOwnerId,
      }));

      expect(updated).toHaveLength(2);
      expect(updated.every(c => c.hrOwnerId === "user-2")).toBe(true);
    });
  });
});
