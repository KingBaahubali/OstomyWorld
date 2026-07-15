"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    q: "How do I choose the right OstoBelt size?",
    a: "Measure the waist at the level of the stoma — not the natural waistline. Use this measurement to select the size. If between sizes, sizing up is recommended for comfort. For help, reach out to the support team.",
  },
  {
    q: "Is the OstoBelt compatible with all ostomy bags?",
    a: "Yes. The OstoBelt is designed to work with the vast majority of standard one-piece and two-piece ostomy pouching systems. The flange hole is pre-cut to a universal size.",
  },
  {
    q: "Can I wear the OstoBelt while exercising or swimming?",
    a: "Absolutely. The OstoBelt is made from a premium anti-microbial stretch fabric that is breathable and resilient during physical activity. The Velcro closure ensures zero slippage, even during intense movement.",
  },
  {
    q: "How long does delivery take?",
    a: "We ship pan-India via Shiprocket. Standard delivery takes 3–7 business days. You will receive a tracking link by SMS and email as soon as your order is dispatched.",
  },
  {
    q: "What is your return policy?",
    a: "Returns are accepted on unused, unopened items within 7 days of delivery. As this is a medical product, used items cannot be returned for hygiene reasons. Please contact the support team and it will be resolved.",
  },
];

export default function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background pt-12 pb-24 px-md">
      <div className="max-w-6xl mx-auto w-full mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-outfit font-bold rounded-full mb-6 border border-primary/20">
            Customer Support
          </div>
          <h1 className="font-outfit text-5xl md:text-6xl font-bold text-text-main mb-6">
            Contact Us
          </h1>
          <p className="font-public text-xl text-text-muted max-w-2xl mx-auto">
            We are here to support your journey. Reach out with any questions regarding sizing, clinical use, or distribution.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2 bg-surface-card rounded-3xl p-8 md:p-12 border border-text-muted/10 shadow-lg"
          >
            <h2 className="font-outfit text-3xl font-bold text-text-main mb-8">Send a Message</h2>
            <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block font-outfit font-bold text-text-main mb-2">Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name"
                  className="w-full bg-background border border-text-muted/20 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block font-outfit font-bold text-text-main mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-background border border-text-muted/20 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block font-outfit font-bold text-text-main mb-2">Message</label>
                <textarea 
                  rows={4}
                  placeholder="How can the team help today?"
                  className="w-full bg-background border border-text-muted/20 rounded-lg px-4 py-3 font-public focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-background font-outfit font-bold text-lg py-4 rounded-xl hover:opacity-95 transition-all hover:shadow-lg active:scale-[0.98] mt-2"
              >
                Submit Inquiry
              </button>
            </form>
          </motion.div>

          {/* Support Info & FAQ */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full lg:w-1/2 flex flex-col justify-center"
          >
            <div className="mb-12">
              <h2 className="font-outfit text-3xl font-bold text-text-main mb-6">Direct Channels</h2>
              <div className="space-y-6 font-public text-lg text-text-muted">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">@</div>
                   <a href="mailto:support@ostomyworld.in" className="hover:text-primary transition-colors">support@ostomyworld.in</a>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">#</div>
                    <span>+91 [Your Phone Number]</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">L</div>
                    <span>Hyderabad, Telangana, India</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-outfit text-3xl font-bold text-text-main mb-6">Frequently Asked</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-text-muted/10 rounded-xl overflow-hidden bg-surface-card">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full text-left px-6 py-4 font-outfit font-bold text-text-main flex justify-between items-center hover:bg-background/50 transition-colors"
                    >
                      {faq.q}
                      <span className="text-secondary text-xl">{openFaq === idx ? '−' : '+'}</span>
                    </button>
                    {openFaq === idx && (
                      <div className="px-6 pb-4 font-public text-text-muted">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
