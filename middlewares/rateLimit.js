import rateLimit from "express-rate-limit";

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Too many uploads. Try again in an hour." }
});

export const likePlayLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { message: "Too many requests. Slow down." }
});
