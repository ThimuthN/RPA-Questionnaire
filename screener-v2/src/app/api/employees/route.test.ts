import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/employees/queries", () => ({
  listEmployeeWorkspacePage: vi.fn(),
  createEmployee: vi.fn(),
  getEmployeeDetail: vi.fn(),
  updateEmployee: vi.fn(),
  terminateEmployee: vi.fn()
}));

vi.mock("@/lib/goals/queries", () => ({
  listEmployeeGoals: vi.fn(),
  createGoal: vi.fn()
}));

vi.mock("@/lib/reviews/queries", () => ({
  listEmployeeReviews: vi.fn(),
  createReview: vi.fn()
}));

import { GET as listEmployees, POST as createEmployeeRoute } from "./route";
import { GET as getEmployee, PATCH as updateEmployeeRoute } from "./[id]/route";
import { GET as listGoals, POST as createGoalRoute } from "./[id]/goals/route";
import { GET as listReviews, POST as createReviewRoute } from "./[id]/reviews/route";
import { POST as terminateEmployeeRoute } from "./[id]/terminate/route";
import {
  createEmployee,
  getEmployeeDetail,
  listEmployeeWorkspacePage,
  terminateEmployee,
  updateEmployee
} from "@/lib/employees/queries";
import { createGoal, listEmployeeGoals } from "@/lib/goals/queries";
import { createReview, listEmployeeReviews } from "@/lib/reviews/queries";

const disabledBody = {
  ok: false,
  message: "Employee management is outside the v1 hiring workflow."
};

async function expectDisabled(response: Response) {
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual(disabledBody);
}

describe("employee API v1 disabled routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables employee list and create without querying employees", async () => {
    await expectDisabled(await listEmployees());
    await expectDisabled(await createEmployeeRoute());

    expect(vi.mocked(listEmployeeWorkspacePage)).not.toHaveBeenCalled();
    expect(vi.mocked(createEmployee)).not.toHaveBeenCalled();
  });

  it("disables employee detail and update without querying employees", async () => {
    await expectDisabled(await getEmployee());
    await expectDisabled(await updateEmployeeRoute());

    expect(vi.mocked(getEmployeeDetail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateEmployee)).not.toHaveBeenCalled();
  });

  it("disables employee goals without querying goals", async () => {
    await expectDisabled(await listGoals());
    await expectDisabled(await createGoalRoute());

    expect(vi.mocked(listEmployeeGoals)).not.toHaveBeenCalled();
    expect(vi.mocked(createGoal)).not.toHaveBeenCalled();
  });

  it("disables employee reviews without querying reviews", async () => {
    await expectDisabled(await listReviews());
    await expectDisabled(await createReviewRoute());

    expect(vi.mocked(listEmployeeReviews)).not.toHaveBeenCalled();
    expect(vi.mocked(createReview)).not.toHaveBeenCalled();
  });

  it("disables employee termination without mutating employees", async () => {
    await expectDisabled(await terminateEmployeeRoute());

    expect(vi.mocked(terminateEmployee)).not.toHaveBeenCalled();
  });
});
