import { Router } from "express";
import { createPreprocessorMiddleware } from "./middleware/request";
import { ipLimiter } from "./rate-limit";
import { createQueuedProxyMiddleware } from "./middleware/request/proxy-middleware-factory";
import { addKey, finalizeBody } from "./middleware/request";
import { ProxyResHandlerWithBody } from "./middleware/response";

const deepseekResponseHandler: ProxyResHandlerWithBody = async (
  _proxyRes,
  req,
  res,
  body
) => {
  if (typeof body !== "object") {
    throw new Error("Expected body to be an object");
  }

  let newBody = body;

  res.status(200).json({ ...newBody, proxy: body.proxy });
};

const deepseekProxy = createQueuedProxyMiddleware({
  mutations: [addKey, finalizeBody],
  target: "https://api.x.ai/",
  blockingResponseHandler: deepseekResponseHandler,
});

const grokRouter = Router();

grokRouter.post(
  "/v1/chat/completions",
  ipLimiter,
  createPreprocessorMiddleware({ 
    inApi: "openai",
    outApi: "openai",
    service: "grok"
  }),
  deepseekProxy
);

export const deepseek = grokRouter;
