import { describe, expect, it, vi, beforeEach } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/lib/employees/queries", () => ({
  listEmployeeWorkspacePage: vi.fn(),
  createEmployee: vi.fn(),
  getEmployeeDetail: vi.fn(),
  updateEmployee: vi.fn(),
  terminateEmployee: vi.fn()
}));

vi.mock("@/lib/goals/queries", () => ({
  listEmployeeGoals: vi.fn(),
  createGoal: vi.fn(),
  getGoalDetail: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  createCheckIn: vi.fn()
}));

vi.mock("@/lib/reviews/queries", () => ({
  listEmployeeReviews: vi.fn(),
  createReview: vi.fn(),
  getReviewDetail: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn()
}));

import { GET as listEmployees, POST as createEmployeeRoute } from "./route";
import { GET as getEmployee, PATCH as updateEmployeeRoute } from "./[id]/route";
import { GET as listGoals, POST as createGoalRoute } from "./[id]/goals/route";
import {
  DELETE as deleteGoalRoute,
  GET as getGoalRoute,
  PATCH as updateGoalRoute
} from "./[id]/goals/[goalId]/route";
import { POST as createGoalCheckInRoute } from "./[id]/goals/[goalId]/checkins/route";
import { GET as listReviews, POST as createReviewRoute } from "./[id]/reviews/route";
import {
  DELETE as deleteReviewRoute,
  GET as getReviewRoute,
  PATCH as updateReviewRoute
} from "./[id]/reviews/[reviewId]/route";
import { POST as terminateEmployeeRoute } from "./[id]/terminate/route";
import {
  createEmployee,
  getEmployeeDetail,
  listEmployeeWorkspacePage,
  terminateEmployee,
  updateEmployee
} from "@/lib/employees/queries";
import {
  createCheckIn,
  createGoal,
  deleteGoal,
  getGoalDetail,
  listEmployeeGoals,
  updateGoal
} from "@/lib/goals/queries";
import {
  createReview,
  deleteReview,
  getReviewDetail,
  listEmployeeReviews,
  updateReview
} from "@/lib/reviews/queries";

const disabledBody = {
  ok: false,
  message: "Employee management is outside the v1 hiring workflow."
};

async function expectDisabled(response: Response) {
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual(disabledBody);
}

function collectRouteFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return collectRouteFiles(fullPath);
    }
    return entry === "route.ts" ? [fullPath] : [];
  });
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

  it("disables employee goal items without querying or mutating goals", async () => {
    await expectDisabled(await getGoalRoute());
    await expectDisabled(await updateGoalRoute());
    await expectDisabled(await deleteGoalRoute());

    expect(vi.mocked(getGoalDetail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateGoal)).not.toHaveBeenCalled();
    expect(vi.mocked(deleteGoal)).not.toHaveBeenCalled();
  });

  it("disables employee goal check-ins without creating check-ins or updating goals", async () => {
    await expectDisabled(await createGoalCheckInRoute());

    expect(vi.mocked(createCheckIn)).not.toHaveBeenCalled();
    expect(vi.mocked(updateGoal)).not.toHaveBeenCalled();
  });

  it("disables employee reviews without querying reviews", async () => {
    await expectDisabled(await listReviews());
    await expectDisabled(await createReviewRoute());

    expect(vi.mocked(listEmployeeReviews)).not.toHaveBeenCalled();
    expect(vi.mocked(createReview)).not.toHaveBeenCalled();
  });

  it("disables employee review items without querying or mutating reviews", async () => {
    await expectDisabled(await getReviewRoute());
    await expectDisabled(await updateReviewRoute());
    await expectDisabled(await deleteReviewRoute());

    expect(vi.mocked(getReviewDetail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateReview)).not.toHaveBeenCalled();
    expect(vi.mocked(deleteReview)).not.toHaveBeenCalled();
  });

  it("disables employee termination without mutating employees", async () => {
    await expectDisabled(await terminateEmployeeRoute());

    expect(vi.mocked(terminateEmployee)).not.toHaveBeenCalled();
  });

  it("keeps every employee API route as a disabled non-data-exposing handler", () => {
    const routeFiles = collectRouteFiles(__dirname);
    expect(routeFiles.length).toBeGreaterThan(0);

    for (const routeFile of routeFiles) {
      const source = readFileSync(routeFile, "utf8");
      expect(source).toContain(disabledBody.message);
      expect(source).not.toMatch(/requireApiSession|listEmployee|getEmployee|createEmployee|updateEmployee|terminateEmployee|listEmployeeGoals|createGoal|updateGoal|deleteGoal|createCheckIn|listEmployeeReviews|createReview|updateReview|deleteReview/);
    }
  });
});
