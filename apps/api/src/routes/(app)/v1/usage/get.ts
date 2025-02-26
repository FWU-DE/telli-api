import { validateApiKey } from "@/routes/utils";
import { getCurrentUsageInCentByApiKeyIdWithResult } from "@dgpt/db";
import { getEndOfCurrentMonth, getStartOfCurrentMonth } from "@dgpt/utils";
import { FastifyReply, FastifyRequest } from "fastify";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = await validateApiKey(request, reply);

  if (apiKey === undefined) return;

  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();
  const [error, result] = await getCurrentUsageInCentByApiKeyIdWithResult({
    apiKeyId: apiKey.id,
    startDate,
    endDate,
  });

  if (error !== null) {
    reply
      .send({
        error: "Something went wrong while calculating the usage",
        details: error.message,
      })
      .status(500);
    return;
  }

  const _remainingLimitInCent = apiKey.limitInCent - result.actualPrice;
  const remainingLimitInCent =
    _remainingLimitInCent > 0 ? _remainingLimitInCent : 0;

  reply
    .send({ remainingLimitInCent, limitInCent: apiKey.limitInCent })
    .status(200);
  return;
}
