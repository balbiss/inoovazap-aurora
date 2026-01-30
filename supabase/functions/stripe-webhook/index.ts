import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import Stripe from "https://esm.sh/stripe@14.12.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    const signature = req.headers.get("stripe-signature");

    if (!signature || !stripeSecretKey || !webhookSecret) {
        console.error("Missing Stripe configuration");
        return new Response("Configuration error", { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
    });

    try {
        const body = await req.text();
        const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log(`🔔 Webhook received: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                const customerId = session.customer as string;
                const instanceId = session.metadata?.instance_id || session.subscription_data?.metadata?.instance_id;

                console.log(`✅ Checkout completed for instance: ${instanceId}`);

                if (instanceId) {
                    const { error } = await supabase
                        .from("instances")
                        .update({
                            stripe_customer_id: customerId,
                            subscription_status: subscription.status,
                            subscription_plan: 'pro',
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        })
                        .eq("id", instanceId);

                    if (error) console.error("Database update error:", error);
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                    console.log(`💰 Payment succeeded for customer: ${invoice.customer}`);

                    await supabase
                        .from("instances")
                        .update({
                            subscription_status: subscription.status,
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        })
                        .eq("stripe_customer_id", invoice.customer as string);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                console.log(`❌ Subscription deleted for customer: ${subscription.customer}`);

                await supabase
                    .from("instances")
                    .update({
                        subscription_status: "canceled",
                        subscription_plan: "free",
                    })
                    .eq("stripe_customer_id", subscription.customer as string);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object;
                console.log(`🔄 Subscription updated for customer: ${subscription.customer}`);

                await supabase
                    .from("instances")
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq("stripe_customer_id", subscription.customer as string);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        console.error(`⚠️ Webhook error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
