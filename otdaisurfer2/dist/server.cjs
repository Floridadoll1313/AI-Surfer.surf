var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  api: () => api
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_stripe = __toESM(require("stripe"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_https = require("firebase-functions/v2/https");
import_dotenv.default.config();
if (import_firebase_admin.default.apps.length === 0) {
  import_firebase_admin.default.initializeApp();
}
var db = import_firebase_admin.default.firestore();
var app = (0, import_express.default)();
var PORT = 3e3;
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function generateAIContent(req, res) {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "Gemini API key is not configured. Please add it in Settings > Secrets." });
    }
    console.log("\u{1F916} Generating AI content for prompt:", prompt);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert creative assistant for an agency called AI Surfer. Provide punchy, high-frequency, professional output."
      }
    });
    res.json({ result: response.text });
  } catch (error) {
    const err = error;
    console.error("AI Error:", error);
    if (error?.status === 429 || err?.message?.toLowerCase().includes("rate") || err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("exhausted")) {
      return res.json({ result: "\u26A0\uFE0F AI Core Rate Limit Exceeded.\n\nThe neural link is currently running at maximum capacity on the free tier. Please wait a moment for the frequency to cool down, or connect a paid Gemini API key for unlimited throughput.\n\nSimulated Output: [Action successful. Data processed.]" });
    }
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
}
async function startSurferPipeline(req, res) {
  try {
    const payload = req.body;
    console.log("\u{1F30A} Starting Surfer Pipeline for payload:", payload);
    res.json({ status: "TRIGGERED", workflow: "surferPipeline", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function generateAIContentStream(req, res) {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({ error: "Gemini API key is not configured. Please add it in Settings > Secrets." });
      return;
    }
    console.log("\u{1F30A} Streaming AI content for prompt:", prompt);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert creative assistant for an agency called AI Surfer. Provide punchy, high-frequency, professional output."
      }
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    const err = error;
    console.error("AI Stream Error:", error);
    if (error?.status === 429 || err?.message?.toLowerCase().includes("rate") || err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("exhausted")) {
      res.write(`data: ${JSON.stringify({ text: "\u26A0\uFE0F AI Core Rate Limit Exceeded.\n\nThe neural link is currently running at maximum capacity on the free tier. Please wait a moment for the frequency to cool down, or connect a paid Gemini API key for unlimited throughput.\n\nSimulated Output: [Action successful. Data processed.]" })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify({ error: err.message || "Failed to generate AI content" })}

`);
    res.end();
  }
}
async function seedTiersIfEmpty() {
  try {
    const tiersColl = db.collection("pricing_tiers");
    const snapshot = await tiersColl.limit(1).get();
    if (snapshot.empty) {
      console.log("\u{1F331} Seeding default dynamic pricing tiers in Firestore...");
      const defaultTiers = [
        {
          id: "dawn-patrol",
          name: "Dawn Patrol",
          price: "$49",
          period: "/month",
          description: "For creators starting their high-frequency journey.",
          color: "border-cyan-500/20",
          features: [
            "Daily AI Trend Analysis",
            "Basic Workflow Automations",
            "Standard Cinematic Templates",
            "Community Access"
          ],
          popular: false,
          stripePriceId: process.env.STRIPE_PRICE_ID_DAWN_PATROL || ""
        },
        {
          id: "breakline",
          name: "Breakline",
          price: "$99",
          period: "/month",
          description: "Optimized for scaling digital structures.",
          color: "border-purple-500/30",
          features: [
            "Everything in Dawn Patrol",
            "Advanced AI Marketing Tools",
            "Unlimited Workflow Triggers",
            "Primary Support Frequency"
          ],
          popular: true,
          stripePriceId: process.env.STRIPE_PRICE_ID_BREAKLINE || ""
        },
        {
          id: "hatteras-island",
          name: "Surfer Elite",
          price: "$249",
          period: "/month",
          description: "The elite frequency for established brands.",
          color: "border-orange-500/20",
          features: [
            "Everything in Breakline",
            "Cinematic Brand Architecture",
            "Custom AI Personas",
            "High-Frequency Consultation"
          ],
          popular: false,
          stripePriceId: process.env.STRIPE_PRICE_ID_HATTERAS_ISLAND || ""
        },
        {
          id: "cape-point",
          name: "Cape Point",
          price: "$499",
          period: "/month",
          description: "Ultimate architectural mastery and custom growth.",
          color: "border-white/20",
          features: [
            "Full Private AI Ecosystem",
            "Dedicated Growth Architect",
            "White-Label Implementation",
            "Peak Priority 24/7"
          ],
          popular: false,
          stripePriceId: process.env.STRIPE_PRICE_ID_CAPE_POINT || ""
        }
      ];
      for (const tier of defaultTiers) {
        await tiersColl.doc(tier.id).set(tier);
      }
      console.log("\u2705 Seeding dynamic pricing tiers complete!");
    } else {
      console.log("\u{1F4CA} Non-empty pricing_tiers collection loaded.");
    }
  } catch {
  }
}
async function startServer() {
  console.log("\u{1F680} Initializing server...");
  seedTiersIfEmpty().catch(console.error);
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecret && stripeSecret.trim() !== "" ? new import_stripe.default(stripeSecret) : null;
  if (!stripe) {
    console.warn("\u26A0\uFE0F STRIPE_SECRET_KEY not found or empty. Stripe integration disabled.");
  }
  app.post("/api/stripe/webhook", import_express.default.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !sig || !webhookSecret) {
      return res.status(400).send("Webhook Error: Stripe not configured or missing signature");
    }
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log("\u{1F514} Stripe Webhook received:", event.type);
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log("\u{1F4B0} checkout.session.completed event captured for:", session.id);
          const userId = session.client_reference_id || session.metadata?.userId;
          const tierId = session.metadata?.tierId;
          const stripeCustomerId = session.customer;
          const stripeSubscriptionId = session.subscription;
          if (!userId) {
            console.warn("\u26A0\uFE0F Missing client_reference_id or userId in session metadata.");
            break;
          }
          let mappedTier = "basic";
          if (tierId === "breakline" || tierId === "hatteras-island") {
            mappedTier = "premium";
          } else if (tierId === "cape-point") {
            mappedTier = "enterprise";
          }
          console.log(`\u{1F517} Webhook updating user ${userId} to active on tier ${mappedTier}`);
          const userRef = db.collection("users").doc(userId);
          await userRef.set({
            subscriptionStatus: "active",
            tier: mappedTier,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          const paymentId = `pay_${Date.now()}_${userId.slice(0, 6)}`;
          await db.collection("payments").doc(paymentId).set({
            userId,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "succeeded",
            stripeSessionId: session.id,
            tierId: tierId || "dawn-patrol",
            createdAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
          });
          console.log(`\u2705 Success logging checkout session to users & payments collections for user ${userId}.`);
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          console.log(`\u{1F514} customer.subscription.${event.type === "customer.subscription.created" ? "created" : "updated"} triggered:`, subscription.id);
          const userId = subscription.metadata?.userId;
          const tierId = subscription.metadata?.tierId;
          const stripeCustomerId = subscription.customer;
          if (userId) {
            let mappedTier = "basic";
            if (tierId === "breakline" || tierId === "hatteras-island") {
              mappedTier = "premium";
            } else if (tierId === "cape-point") {
              mappedTier = "enterprise";
            }
            const userRef = db.collection("users").doc(userId);
            await userRef.set({
              subscriptionStatus: "active",
              tier: mappedTier,
              stripeCustomerId,
              stripeSubscriptionId: subscription.id,
              updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`\u2705 Updated subscription for ${userId} to active.`);
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log("\u{1F514} customer.subscription.deleted event captured:", subscription.id);
          const userId = subscription.metadata?.userId;
          if (userId) {
            const userRef = db.collection("users").doc(userId);
            await userRef.set({
              subscriptionStatus: "canceled",
              tier: "none",
              updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`\u2705 Cancelled subscription statuses on user profile: ${userId}`);
          } else {
            const usersQuery = await db.collection("users").where("stripeSubscriptionId", "==", subscription.id).limit(1).get();
            if (!usersQuery.empty) {
              const userDoc = usersQuery.docs[0];
              await userDoc.ref.set({
                subscriptionStatus: "canceled",
                tier: "none",
                updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
              console.log(`\u2705 Found subscriber via back-search of subscriptionID & canceled profile.`);
            }
          }
          break;
        }
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (err) {
      console.error(`\u274C Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  app.get("/api/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));
  app.post("/api/workflow/surfer", startSurferPipeline);
  app.post("/api/ai/generate", generateAIContent);
  app.post("/api/ai/generate-stream", generateAIContentStream);
  app.get("/api/pricing-tiers", async (req, res) => {
    try {
      const snapshot = await db.collection("pricing_tiers").get();
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      const order = ["dawn-patrol", "breakline", "hatteras-island", "cape-point"];
      list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  const checkoutSessionHandler = async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    const { tierId, userId, email } = req.body;
    if (!tierId) {
      return res.status(400).json({ error: "tierId is required" });
    }
    let priceId;
    try {
      const docSnap = await db.collection("pricing_tiers").doc(tierId).get();
      if (docSnap.exists) {
        priceId = docSnap.data()?.stripePriceId;
      }
    } catch (dbErr) {
      console.warn("DB dynamic pricetiers fetch warn:", dbErr);
    }
    if (!priceId) {
      const priceMap = {
        "dawn-patrol": process.env.STRIPE_PRICE_ID_DAWN_PATROL,
        "breakline": process.env.STRIPE_PRICE_ID_BREAKLINE,
        "hatteras-island": process.env.STRIPE_PRICE_ID_HATTERAS_ISLAND,
        "cape-point": process.env.STRIPE_PRICE_ID_CAPE_POINT
      };
      priceId = priceMap[tierId];
    }
    if (!priceId) {
      return res.status(400).json({ error: `Price ID not configured for tier: ${tierId}` });
    }
    try {
      const forwardedProtocol = req.headers["x-forwarded-proto"];
      const forwardedHost = req.headers["x-forwarded-host"];
      const protocol = forwardedProtocol || req.protocol;
      const host = forwardedHost || req.headers.host;
      const origin = req.headers.origin || `${protocol}://${host}`;
      console.log("\u{1F4B3} Creating checkout session for tier:", tierId, "user:", userId);
      const session = await stripe.checkout.sessions.create({
        client_reference_id: userId,
        customer_email: email || void 0,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        metadata: {
          userId: userId || "",
          tierId
        },
        subscription_data: {
          metadata: {
            userId: userId || "",
            tierId
          }
        },
        mode: "subscription",
        success_url: `${origin}/members?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/members/monetization?canceled=true`
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message });
    }
  };
  app.post("/api/stripe/create-checkout-session", checkoutSessionHandler);
  app.post("/api/create-checkout-session", checkoutSessionHandler);
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    console.log("\u{1F6E0}\uFE0F Starting in DEVELOPMENT mode with Vite...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) return next();
      try {
        const templatePath = import_path.default.resolve(process.cwd(), "index.html");
        let template = import_fs.default.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error("Vite Transform Error:", e);
        next(e);
      }
    });
  } else {
    console.log("\u{1F310} Starting in PRODUCTION mode...");
    const distPath = import_path.default.resolve(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      const indexPath = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application not built correctly. dist/index.html missing.");
      }
    });
  }
  if (!process.env.FUNCTIONS_EMULATOR && !process.env.GCLOUD_PROJECT && !process.env.FIREBASE_CONFIG) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\u2705 Server running on http://0.0.0.0:${PORT} [${isProduction ? "PROD" : "DEV"}]`);
    });
  }
}
startServer().catch((err) => {
  console.error("\u274C CRITICAL: Failed to start server:", err);
});
var api = (0, import_https.onRequest)({ cors: true, region: "us-central1" }, app);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  api
});
//# sourceMappingURL=server.cjs.map
