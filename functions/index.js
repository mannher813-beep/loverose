const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Cloud function mockup of Money Fusion webhook
exports.moneyFusionWebhook = onRequest((request, response) => {
  logger.info("Money Fusion Webhook Triggered via Firebase Functions!", { structuredData: true });
  const { transaction_id, reference, status, amount } = request.body || {};
  
  response.json({
    success: true,
    message: "Cloud function webhook processed",
    data: { transaction_id, reference, status, amount }
  });
});
