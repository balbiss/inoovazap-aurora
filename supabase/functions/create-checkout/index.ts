import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import Stripe from "https://esm.sh/stripe@14.12.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        // 2. Auth Header Check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 3. Initialize Supabase with Service Role ONLY for internal operations
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        // 4. Verify User Token
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 5. Parse Body
        const body = await req.json();
        const { price_id, instance_id, action } = body;

        if (!instance_id) {
            throw new Error("instance_id is required");
        }

        // 6. Verify Ownership
        const { data: instance, error: instError } = await supabaseClient
            .from("instances")
            .select("*")
            .eq("id", instance_id)
            .eq("user_id", user.id)
            .single();

        if (instError || !instance) {
            return new Response(JSON.stringify({ error: "Instance not found or unauthorized" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const origin = req.headers.get("origin") || "http://localhost:5173";

        // 7. Handle Actions
        if (action === "create_portal_session") {
            if (!instance.stripe_customer_id) {
                throw new Error("No Stripe Customer ID found for this instance.");
            }

            const portalSession = await stripe.billingPortal.sessions.create({
                customer: instance.stripe_customer_id,
                return_url: `${origin}/settings?tab=subscription`,
            });

            return new Response(JSON.stringify({ url: portalSession.url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Create Checkout Session
        if (!price_id) {
            throw new Error("price_id is required for checkout");
        }

        let customerId = instance.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: instance.company_name || user.id,
                metadata: {
                    instance_id: instance_id,
                    user_id: user.id,
                },
            });
            customerId = customer.id;

            await supabaseClient
                .from("instances")
                .update({ stripe_customer_id: customerId })
                .eq("id", instance_id);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [{ price: price_id, quantity: 1 }],
            mode: "subscription",
            allow_promotion_codes: true,
            success_url: `${origin}/settings?tab=subscription&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/settings?tab=subscription`,
            subscription_data: { metadata: { instance_id: instance_id } },
            metadata: { instance_id: instance_id },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Stripe Function Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
