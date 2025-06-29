import { useCallback } from "react";
import Particles from "react-tsparticles";
import type { Container, Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log(container);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: false,
            },
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"],
          },
          links: {
            enable: true,
            color: "#22c55e",
            distance: 150,
            opacity: 0.3,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: { min: 0.8, max: 2.5 },
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 60,
          },
          opacity: {
            value: { min: 0.2, max: 0.6 },
            animation: {
              enable: true,
              speed: 1.5,
              minimumValue: 0.1,
            },
          },
          shape: {
            type: ["circle", "triangle", "star"],
          },
          size: {
            value: { min: 1, max: 4 },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0.1,
            },
          },
          twinkle: {
            enable: true,
            color: "#4ade80",
            frequency: 0.08,
            opacity: 1,
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground; 