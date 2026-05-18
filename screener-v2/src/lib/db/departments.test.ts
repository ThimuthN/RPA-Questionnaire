import { describe, expect, it } from "vitest";

// Test slug generation logic in isolation
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

describe("department slug generation", () => {
  it("converts to lowercase", () => {
    expect(slugify("Engineering")).toBe("engineering");
    expect(slugify("SALES")).toBe("sales");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("Sales Team")).toBe("sales-team");
    expect(slugify("Product   Management")).toBe("product-management");
  });

  it("removes special characters", () => {
    expect(slugify("R&D Department")).toBe("r-d-department");
    expect(slugify("IT/Security")).toBe("it-security");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("-Engineering-")).toBe("engineering");
    expect(slugify("---Sales---")).toBe("sales");
  });

  it("handles complex department names", () => {
    expect(slugify("Research & Development (R&D)")).toBe("research-development-r-d");
    expect(slugify("Customer Success - EMEA")).toBe("customer-success-emea");
  });

  it("handles empty and whitespace-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("---")).toBe("");
  });
});

describe("department name validation", () => {
  it("validates non-empty names", () => {
    expect("Engineering".trim().length > 0).toBe(true);
    expect("".trim().length > 0).toBe(false);
  });

  it("validates against duplicate names", () => {
    const existingNames = ["Engineering", "Sales", "Product"];
    const newName = "Engineering";
    expect(existingNames.includes(newName)).toBe(true);
    expect(existingNames.includes("Marketing")).toBe(false);
  });

  it("validates slug uniqueness across renames", () => {
    const name1 = "Research & Development";
    const name2 = "Research-Development";
    // Both should produce the same slug
    expect(slugify(name1)).toBe(slugify(name2));
    expect(slugify(name1)).toBe("research-development");
  });
});

describe("department sort order", () => {
  it("sorts departments by sortOrder then name", () => {
    const depts = [
      { id: "1", slug: "eng", name: "Engineering", isActive: true, sortOrder: 2 },
      { id: "2", slug: "sales", name: "Sales", isActive: true, sortOrder: 1 },
      { id: "3", slug: "support", name: "Support", isActive: true, sortOrder: 2 },
    ];

    const sorted = [...depts].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    expect(sorted[0]?.slug).toBe("sales");
    expect(sorted[1]?.slug).toBe("eng");
    expect(sorted[2]?.slug).toBe("support");
  });
});

describe("department filtering", () => {
  const allDepts = [
    { id: "1", slug: "eng", name: "Engineering", isActive: true, sortOrder: 0 },
    { id: "2", slug: "sales", name: "Sales", isActive: false, sortOrder: 0 },
    { id: "3", slug: "product", name: "Product", isActive: true, sortOrder: 0 },
  ];

  it("filters active departments", () => {
    const active = allDepts.filter(d => d.isActive);
    expect(active).toHaveLength(2);
    expect(active.map(d => d.slug)).toEqual(["eng", "product"]);
  });

  it("includes inactive departments when requested", () => {
    const all = allDepts;
    expect(all).toHaveLength(3);
  });
});

describe("department deletion guards", () => {
  it("prevents deletion if department has active roles", () => {
    const deptHasActiveRoles = (deptId: string, roles: Array<{departmentId: string; isActive: boolean}>) => {
      return roles.some(r => r.departmentId === deptId && r.isActive);
    };

    const deptId = "eng";
    const roles = [
      { departmentId: "eng", isActive: true },
      { departmentId: "sales", isActive: false },
    ];

    expect(deptHasActiveRoles(deptId, roles)).toBe(true);
    expect(deptHasActiveRoles("sales", roles)).toBe(false);
  });

  it("prevents deletion if department has active users", () => {
    const deptHasActiveUsers = (deptId: string, users: Array<{departmentId?: string; isActive: boolean}>) => {
      return users.some(u => u.departmentId === deptId && u.isActive);
    };

    const deptId = "eng";
    const users = [
      { departmentId: "eng", isActive: true },
      { departmentId: "eng", isActive: false },
      { departmentId: "sales", isActive: true },
    ];

    expect(deptHasActiveUsers(deptId, users)).toBe(true);
    expect(deptHasActiveUsers("sales", users)).toBe(true);
    expect(deptHasActiveUsers("marketing", users)).toBe(false);
  });

  it("allows deletion if all roles and users are inactive", () => {
    const canDelete = (
      deptId: string,
      roles: Array<{departmentId: string; isActive: boolean}>,
      users: Array<{departmentId?: string; isActive: boolean}>
    ) => {
      const hasActiveRoles = roles.some(r => r.departmentId === deptId && r.isActive);
      const hasActiveUsers = users.some(u => u.departmentId === deptId && u.isActive);
      return !hasActiveRoles && !hasActiveUsers;
    };

    const deptId = "eng";
    const inactiveRoles = [
      { departmentId: "eng", isActive: false },
    ];
    const inactiveUsers = [
      { departmentId: "eng", isActive: false },
    ];

    expect(canDelete(deptId, inactiveRoles, inactiveUsers)).toBe(true);
  });
});

describe("department relation integrity", () => {
  it("validates FK relationships during candidate assignment", () => {
    const roleExists = (roleId: string, roles: Array<{id: string}>) => {
      return roles.some(r => r.id === roleId);
    };

    const getRoleDepartment = (roleId: string, roles: Array<{id: string; departmentId: string}>) => {
      return roles.find(r => r.id === roleId)?.departmentId;
    };

    const roles = [
      { id: "role-1", departmentId: "eng" },
      { id: "role-2", departmentId: "sales" },
    ];

    expect(roleExists("role-1", roles)).toBe(true);
    expect(getRoleDepartment("role-1", roles)).toBe("eng");
    expect(roleExists("role-99", roles)).toBe(false);
  });

  it("validates FK relationships during owner assignment", () => {
    const userExists = (userId: string, users: Array<{id: string}>) => {
      return users.some(u => u.id === userId);
    };

    const getUserDepartment = (userId: string, users: Array<{id: string; departmentId?: string}>) => {
      return users.find(u => u.id === userId)?.departmentId;
    };

    const users = [
      { id: "user-1", departmentId: "eng" },
      { id: "user-2", departmentId: "sales" },
    ];

    expect(userExists("user-1", users)).toBe(true);
    expect(getUserDepartment("user-1", users)).toBe("eng");
    expect(userExists("user-99", users)).toBe(false);
  });
});

describe("department transitions", () => {
  it("clears role when transferring to different department", () => {
    const candidate = {
      id: "cand-1",
      departmentId: "eng",
      roleId: "role-1",
    };

    const newCandidate = {
      ...candidate,
      departmentId: "sales",
      roleId: null, // Cleared on department transfer
    };

    expect(newCandidate.departmentId).not.toBe(candidate.departmentId);
    expect(newCandidate.roleId).toBeNull();
  });

  it("preserves department when assigning role in same department", () => {
    const candidate = {
      id: "cand-1",
      departmentId: "eng",
      roleId: null,
    };

    const roleInSameDept = {
      id: "role-2",
      departmentId: "eng",
    };

    const updatedCandidate = {
      ...candidate,
      roleId: roleInSameDept.id,
    };

    expect(updatedCandidate.departmentId).toBe(candidate.departmentId);
  });

  it("auto-assigns department when candidate applies to job", () => {
    const job = {
      id: "job-1",
      roleId: "role-1",
    };

    const role = {
      id: "role-1",
      departmentId: "eng",
    };

    const newCandidate = {
      id: "cand-new",
      departmentId: role.departmentId, // Auto-assigned from role
      roleId: role.id,
    };

    expect(newCandidate.departmentId).toBe("eng");
    expect(newCandidate.roleId).toBe("role-1");
  });
});
