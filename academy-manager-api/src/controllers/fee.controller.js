import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import feeService from "../services/fee.service.js";

export const getFeeInvoices = asyncHandler(async (req, res) => {
  const { page, limit, offset, formatMeta } = getPagination(req, 10);
  const { search, classId, status, month } = req.query;

  const { invoices, total } = await feeService.getFeeInvoices(req.user.academyId, {
    search,
    classId: classId ? parseInt(classId, 10) : undefined,
    status,
    month,
    limit,
    offset,
  });

  return sendSuccess(res, invoices, formatMeta(total));
});

export const collectFee = asyncHandler(async (req, res) => {
  const result = await feeService.collectFee(req.user.academyId, req.body);
  return sendSuccess(res, result, null, 201);
});

export const getReceipt = asyncHandler(async (req, res) => {
  const receipt = await feeService.getReceipt(req.user.academyId, req.params.id);
  return sendSuccess(res, receipt);
});

export default {
  getFeeInvoices,
  collectFee,
  getReceipt,
};
