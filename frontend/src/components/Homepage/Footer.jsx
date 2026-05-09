import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Frame,
  Circle
} from "lucide-react";
import { Link } from "react-router";

// Plain JS data (no TypeScript)
const footerLinks = [
  {
    label: "Club",
  links: [
  { title: "How It Works", href: "/#how-it-works" },
  { title: "Features", href: "/#features" },
  { title: "Testimonials", href: "/#testimonials" },
  { title: "FAQs", href: "/#faqs" },
]

  },
  // {
  //   label: "Company",
  //   links: [
  //     { title: "About Us", href: "/#about" },
  //     { title: "FAQs", href: "/#faqs" },
   
  //   ],
  // },
  {
    label: "Resources",
    links: [
      { title: "Blog", href: "/programmecards" }
      // { title: "Help Center", href: "/help" },
      // { title: "Changelog", href: "/changelog" },
      // { title: "Brand", href: "/brand" },
    ],
  },
  {
    label: "Social",
    links: [
      { title: "Facebook", href: "#", icon: Facebook },
      { title: "Instagram", href: "#", icon: Instagram },
      { title: "YouTube", href: "#", icon: Youtube },
      { title: "LinkedIn", href: "#", icon: Linkedin },
    ],
  },
];

export default function Footer({clubLogoSrc}) {
  return (
    <footer className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center rounded-t-3xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16 mt-12">
      <div className="bg-foreground/20 absolute top-0 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <div className="flex items-center gap-4 col-span-2">
           
                {clubLogoSrc ? (
                  <img
                    src={clubLogoSrc}
                    alt="Club logo"
                    className="w-10 h-10 object-contain rounded-lg"
                  />
                ) : (
                  <Icons.clubLogo className="w-10 h-10 rounded-lg " />
                )}
             
            <span className="text-base font-semibold">
            
            DPL</span>
          </div>

          <p className="text-muted-foreground mt-2 text-sm">
            A community for readers to borrow books, join discussions, and grow together.
          </p>

          <p className="text-muted-foreground mt-6 text-sm">
            © {new Date().getFullYear()} DPL . All rights reserved.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-semibold tracking-wide uppercase">
                  {section.label}
                </h3>

                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.title}>
                        <Link
                          to={link.href}
                          className="hover:text-foreground inline-flex items-center transition-all duration-300"
                        >
                          {Icon ? <Icon className="me-2 size-4" /> : null}
                          {link.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

function AnimatedContainer({ className, delay = 0.1, children }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", y: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}