import { Router } from "express";
import { createPreprocessorMiddleware } from "./middleware/request";
import { ipLimiter } from "./rate-limit";
import { createQueuedProxyMiddleware } from "./middleware/request/proxy-middleware-factory";
import { addKey, finalizeBody } from "./middleware/request";
import { ProxyResHandlerWithBody } from "./middleware/response";

const grokResponseHandler: ProxyResHandlerWithBody = async (
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

const grokProxy = createQueuedProxyMiddleware({
  mutations: [addKey, finalizeBody],
  target: "https://api.x.ai/",
  blockingResponseHandler: grokResponseHandler,
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
  grokProxy
);

export const grok = grokRouter;
