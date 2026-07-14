import Image from "next/image";

const steps = [
  {
    num: 1,
    img: "/assets/new_step1.png",
    desc: "Rotate your ostomy bag to a horizontal Position (Hold in a horizontal position if using 1-piece system)",
  },
  {
    num: 2,
    img: "/assets/new_step2.png",
    desc: "Insert the bag through the flange hole in the OstoBelt and secure around the waist",
  },
  {
    num: 3,
    img: "/assets/new_step3.png",
    desc: "Attach the velcro at the ends of the belt for a comfortable and secure fit",
  },
  {
    num: 4,
    img: "/assets/new_step4.png",
    desc: "Close the zipper at the bottom of the OstoBelt, enclosing the bag in the pouch of the belt",
  },
  {
    num: 5,
    img: "/assets/new_step5.png",
    desc: "Cover the belt discreetly with your clothing and enjoy during any activity.",
  },
];

export default function HomeStepper() {
  return (
    <section
      style={{ background: "linear-gradient(135deg, #3a9c3a 0%, #2e8b2e 100%)" }}
      className="py-16 px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h2
            className="font-outfit font-bold text-white mb-2"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.1 }}
          >
            OstoBelt
          </h2>
          <div className="w-48 h-0.5 bg-white mb-4"></div>
          <p className="font-outfit font-bold text-white text-2xl md:text-3xl tracking-wide uppercase">
            How To Wear:
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center">
              {/* Image with black border */}
              <div
                className="w-full aspect-square relative mb-4 bg-white"
                style={{ border: "4px solid #111", boxShadow: "3px 3px 0px #000" }}
              >
                <Image
                  src={step.img}
                  alt={`Step ${step.num}`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  className="object-cover"
                />
              </div>

              {/* Green circle number */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-outfit font-bold text-white text-lg mb-3 flex-shrink-0"
                style={{ background: "#2e7d2e", border: "2px solid #fff" }}
              >
                {step.num}
              </div>

              {/* Description */}
              <p className="text-white font-public text-sm text-center leading-snug">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
