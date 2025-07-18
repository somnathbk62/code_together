import { gsap } from "gsap";

// Animation for elements entering the screen
export const fadeIn = (element, delay = 0, duration = 0.5) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: "power3.out",
    }
  );
};

// Animation for elements exiting the screen
export const fadeOut = (element, delay = 0, duration = 0.3) => {
  return gsap.to(element, {
    opacity: 0,
    y: -20,
    duration,
    delay,
    ease: "power2.in",
  });
};

// Staggered animation for lists of elements
export const staggerFadeIn = (
  elements,
  stagger = 0.1,
  delay = 0,
  duration = 0.5
) => {
  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: "power3.out",
    }
  );
};

// Pulse animation for buttons
export const pulseAnimation = (element) => {
  gsap.to(element, {
    scale: 1.05,
    duration: 0.3,
    repeat: 1,
    yoyo: true,
    ease: "power2.inOut",
  });
};

// Highlight animation for success feedback
export const successHighlight = (element) => {
  const tl = gsap.timeline();

  tl.to(element, {
    backgroundColor: "rgba(74, 255, 212, 0.3)",
    duration: 0.3,
    ease: "power2.inOut",
  }).to(element, {
    backgroundColor: "transparent",
    duration: 0.5,
    ease: "power2.inOut",
  });

  return tl;
};

// Shake animation for error feedback
export const shakeAnimation = (element) => {
  gsap.to(element, {
    x: [-5, 5, -5, 5, 0],
    duration: 0.5,
    ease: "power2.inOut",
  });
};

// Typing cursor animation
export const typingCursorAnimation = (element) => {
  gsap.to(element, {
    opacity: 0,
    repeat: -1,
    yoyo: true,
    duration: 0.8,
  });
};

// Loading animation
export const loadingAnimation = (element) => {
  gsap.to(element, {
    rotation: 360,
    repeat: -1,
    duration: 1.5,
    ease: "none",
  });
};

// Button hover animation
export const buttonHoverAnimation = {
  enter: (element) => {
    gsap.to(element, {
      scale: 1.05,
      boxShadow: "0 6px 15px rgba(74, 255, 212, 0.3)",
      duration: 0.3,
      ease: "power2.out",
    });
  },
  leave: (element) => {
    gsap.to(element, {
      scale: 1,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      duration: 0.3,
      ease: "power2.out",
    });
  },
};

// Code editor animation
export const codeEditorAnimation = (element) => {
  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.95,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "elastic.out(1, 0.7)",
    }
  );
};

// Terminal output animation
export const terminalAnimation = {
  show: (element) => {
    gsap.fromTo(
      element,
      {
        height: 0,
        opacity: 0,
      },
      {
        height: "auto",
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      }
    );
  },
  update: (element) => {
    gsap.fromTo(
      element,
      {
        backgroundColor: "rgba(74, 255, 212, 0.1)",
      },
      {
        backgroundColor: "transparent",
        duration: 0.8,
        ease: "power2.out",
      }
    );
  },
  resize: (element, height) => {
    gsap.to(element, {
      height,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        // Ensure scrolling to bottom after resize
        element.scrollTop = element.scrollHeight;
      },
    });
  },
};

// Chat toggle animation
export const chatToggleAnimation = (element, isOpen) => {
  if (isOpen) {
    return gsap.fromTo(
      element,
      {
        width: 0,
        opacity: 0,
      },
      {
        width: "auto",
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      }
    );
  } else {
    return gsap.to(element, {
      width: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power3.in",
    });
  }
};
