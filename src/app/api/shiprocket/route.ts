import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    
    // 1. Authenticate with Shiprocket
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    if (!authRes.ok) {
      const errorText = await authRes.text();
      console.error("Shiprocket Auth Failed:", errorText);
      return NextResponse.json({ error: "Shiprocket Authentication Failed" }, { status: 401 });
    }

    const authData = await authRes.json();
    const token = authData.token;

    // 2. Format items for Shiprocket
    const shiprocketItems = orderData.items.map((item: any) => ({
      name: item.name,
      sku: item.id, // Using product ID as SKU
      units: item.quantity,
      selling_price: item.price.toString(),
      discount: "0",
      tax: "0",
      hsn: "0",
    }));

    // Split name into first and last
    const nameParts = orderData.shippingAddress.fullName.split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Name";

    // 3. Create the Shiprocket Order Payload
    const shiprocketOrderPayload = {
      order_id: orderData.orderId,
      order_date: new Date().toISOString(),
      pickup_location: "Primary", // Adjust if user has a different location name
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: orderData.shippingAddress.address,
      billing_city: orderData.shippingAddress.city,
      billing_pincode: orderData.shippingAddress.pincode,
      billing_state: orderData.shippingAddress.state,
      billing_country: "India",
      billing_email: orderData.userEmail || "customer@example.com",
      billing_phone: orderData.shippingAddress.phone,
      shipping_is_billing: true,
      order_items: shiprocketItems,
      payment_method: orderData.paymentMethod.toUpperCase() === "COD" ? "COD" : "Prepaid",
      sub_total: orderData.totalAmount,
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5 // Default weight, adjust dynamically if products vary
    };

    // 4. Send Order to Shiprocket
    const orderRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adHoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(shiprocketOrderPayload),
    });

    if (!orderRes.ok) {
      const orderErrorText = await orderRes.text();
      console.error("Shiprocket Order Creation Failed:", orderErrorText);
      return NextResponse.json({ error: "Shiprocket Order Creation Failed", details: orderErrorText }, { status: 400 });
    }

    const finalOrderData = await orderRes.json();
    
    return NextResponse.json({ success: true, shiprocketData: finalOrderData });
    
  } catch (error) {
    console.error("Internal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
