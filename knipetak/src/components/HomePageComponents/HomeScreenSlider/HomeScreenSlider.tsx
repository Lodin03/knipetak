import React, { useEffect, useState, useCallback } from "react";
import "./HomeScreenSlider.css";

interface Slide {
  src: string;
  alt: string;
}

const HomeScreenSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Define slides with proper typing
  const slides: Slide[] = [
    {
      src: "/src/assets/images/BildeMassasje.jpg",
      alt: "Professional massage therapy session",
    },
    {
      src: "/src/assets/images/Massasje2.jpg",
      alt: "Relaxing massage treatment",
    },
    {
      src: "/src/assets/images/KnipetakBilde.jpg",
      alt: "Knipetak massage facility",
    },
  ];

  // Handle automatic slide progression with progress bar
  useEffect(() => {
    if (isPaused) return;

    const slideInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
          return 0;
        }
        return prev + 1;
      });
    }, 30); // Updates progress ~33 times per second

    return () => clearInterval(slideInterval);
  }, [isPaused, slides.length]);

  // Memoized navigation handlers
  const handleNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevSlide();
      if (e.key === "ArrowRight") handleNextSlide();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNextSlide, handlePrevSlide]);

  return (
    <div
      className="SlideShowImage"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Image slideshow"
    >
      <div className="SlideShowButtons">
        <button
          onClick={handlePrevSlide}
          aria-label="Previous slide"
          className="nav-button"
        >
          {"<"}
        </button>
      </div>
      <div className="SequenceContainer">
        {slides.map((slide, index) => (
          <img
            key={index}
            className={`slide ${currentSlide === index ? "active" : "hidden"}`}
            src={slide.src}
            alt={slide.alt}
            height={400}
            width={300}
            loading="lazy"
          />
        ))}
        <div
          className="ProgressBarContainer"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="ProgressBar" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="SlideShowButtons">
        <button
          onClick={handleNextSlide}
          aria-label="Next slide"
          className="nav-button"
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default HomeScreenSlider;
