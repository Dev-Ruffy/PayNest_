import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { schoolService } from "./school.service";

export const schoolController = {
  listActive: asyncHandler(async (_req, res) => {
    const schools = await schoolService.listActiveSchools();
    sendSuccess(res, schools);
  }),

  status: asyncHandler(async (req, res) => {
    const status = await schoolService.getStatus(req.params.id);
    sendSuccess(res, status);
  }),
};
