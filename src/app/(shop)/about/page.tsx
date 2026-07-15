"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const values = [
  {
    num: "01",
    title: "Uncompromising Activity",
    desc: "Living with a stoma should never mean giving up the life you love. Every product is engineered to let you move, work, exercise, and exist — completely on your own terms.",
  },
  {
    num: "02",
    title: "Clinically Informed Design",
    desc: "We work at the intersection of medical need and active lifestyle. Every stitch, material, and closure in the OstoBelt is designed to meet the real-world demands of ostomates — not just clinical guidelines.",
  },
  {
    num: "03",
    title: "A Community, Not Just Customers",
    desc: "Ostomy World is built for every person navigating life after stoma surgery. We are committed to education, awareness, and destigmatising ostomy care across India and beyond.",
  },
];

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-background pt-12 pb-24 px-md">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto w-full text-center mt-12 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary font-outfit font-bold rounded-full mb-6 border border-secondary/20">
            Our Story
          </div>
          <h1 className="font-outfit text-5xl md:text-6xl font-bold text-text-main mb-8 leading-tight">
            Founded by an Ostomate.<br />Built for the Community.
          </h1>
          <p className="font-public text-xl text-text-muted leading-relaxed max-w-3xl mx-auto">
            Ostomy World is a community-first brand dedicated to awareness, education, and the destigmatisation of life with a stoma — starting with the product every ostomate deserves.
          </p>
        </motion.div>
      </section>

      {/* Founder Story Split Pane */}
      <section className="max-w-7xl mx-auto w-full mb-24">
        <div className="bg-surface-card rounded-3xl p-8 md:p-16 border border-text-muted/10 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none rounded-r-3xl"></div>

          <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-1/2 flex flex-col gap-6"
            >
              <h2 className="font-outfit text-4xl md:text-5xl font-bold text-text-main mb-2">
                Our Story
              </h2>
              <div className="w-16 h-1 bg-primary rounded-full mb-4"></div>

              <div className="font-public text-lg text-text-muted leading-relaxed space-y-6">
                <p>
                  Our founder underwent ostomy surgery at the age of 19. What followed was not just a medical recovery, but a years-long search for products and community support designed for someone young, active, and determined to live without limitations.
                </p>
                <p>
                  The OstoBelt was the answer to that search — designed from lived experience, refined over time, and built to meet the real demands of an active lifestyle. It is India&apos;s first premium active-support belt for ostomates, engineered to secure the pouch completely and discreetly under any clothing.
                </p>
                <p>
                  Ostomy World is more than a product company. It is the beginning of a movement — to bring ostomy care into the open, eliminate the stigma surrounding it, and build a community where every ostomate across India can find the support, information, and confidence they deserve.
                </p>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <span className="font-outfit font-bold text-primary text-xl">Ostomy World</span>
                <span className="text-text-muted font-public text-sm border-l border-text-muted/30 pl-4">— Founder & CEO</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full lg:w-1/2"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-text-muted/10 group">
                <Image
                  src="/assets/Thank you card.jpg"
                  alt="Founder, Ostomy World"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values — unchanged */}
      <section className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="font-outfit text-4xl md:text-5xl font-bold text-text-main mb-4">
            Our Principles
          </h2>
          <p className="font-public text-xl text-text-muted max-w-2xl mx-auto">
            Three commitments that guide every decision at Ostomy World.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val, idx) => (
            <motion.div
              key={val.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-background rounded-2xl p-10 border border-text-muted/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-outfit text-xl font-bold text-primary mb-6">
                {val.num}
              </div>
              <h3 className="font-outfit text-2xl font-bold text-text-main mb-4">
                {val.title}
              </h3>
              <p className="font-public text-text-muted leading-relaxed">
                {val.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
