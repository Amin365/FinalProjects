import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import ScrollFAQAccordion from "../components/Homepage/Faq";

// framer-motion uses GSAP / IntersectionObserver which aren't available in jsdom.
// Provide a lightweight mock so the component renders without errors.
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: (_, tag) =>
          // eslint-disable-next-line react/display-name
          React.forwardRef(({ children, ...rest }, ref) =>
            React.createElement(tag, { ref, ...rest }, children)
          ),
      }
    ),
    AnimatePresence: ({ children }) => children,
    useInView: () => true,
    useAnimation: () => ({ start: () => {} }),
  };
});

const FAQ_DATA = [
  { id: 1, question: "How do I join?", answer: "Apply online." },
  { id: 2, question: "Is it free?", answer: "Yes, completely free." },
];

describe("ScrollFAQAccordion", () => {
  it("renders the section title", () => {
    renderWithProviders(<ScrollFAQAccordion data={FAQ_DATA} title="FAQ Section" />);
    expect(screen.getByText("FAQ Section")).toBeInTheDocument();
  });

  it("renders all FAQ questions", () => {
    renderWithProviders(<ScrollFAQAccordion data={FAQ_DATA} />);
    FAQ_DATA.forEach(({ question }) => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
  });

  it("renders with default FAQ data when no data prop is provided", () => {
    renderWithProviders(<ScrollFAQAccordion />);
    // Default data has at least one question
    expect(screen.getByText(/how do i join/i)).toBeInTheDocument();
  });

  it("expands an FAQ item to reveal the answer on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScrollFAQAccordion data={FAQ_DATA} />);

    // Answers are inside accordion items; clicking the trigger should show the answer
    await user.click(screen.getByText("How do I join?"));
    expect(await screen.findByText("Apply online.")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    renderWithProviders(
      <ScrollFAQAccordion data={FAQ_DATA} description="Got questions?" />
    );
    expect(screen.getByText("Got questions?")).toBeInTheDocument();
  });
});
