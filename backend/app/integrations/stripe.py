import stripe
from app.config import get_settings


def get_stripe():
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key
    return stripe


def create_customer(email: str, org_name: str) -> str:
    s = get_stripe()
    customer = s.Customer.create(email=email, name=org_name)
    return customer.id


def create_checkout_session(
    customer_id: str,
    stripe_price_id: str,
    metadata: dict,
    success_url: str,
    cancel_url: str,
) -> str:
    s = get_stripe()
    session = s.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    return session.url


def create_billing_portal(customer_id: str, return_url: str) -> str:
    s = get_stripe()
    session = s.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


def cancel_subscription(subscription_id: str):
    s = get_stripe()
    s.Subscription.cancel(subscription_id)


def construct_webhook_event(payload: bytes, sig_header: str, secret: str):
    s = get_stripe()
    return s.Webhook.construct_event(payload, sig_header, secret)
