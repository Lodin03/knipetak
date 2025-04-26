import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { TreatmentType } from '../../interfaces/treatment.interface';
import { treatmentData } from '../../data/treatmentData';
import './TreatmentsPage.css';
import { AnimatePresence } from "framer-motion";


function TreatmentsPage() {
  const [activeSection, setActiveSection] = useState<TreatmentType | null>(null);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: TreatmentType) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const isActive = activeSection !== null;
  const currentContent = activeSection ? treatmentData[activeSection] : null;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [currentContent]);

  return (
    <>
    <div className="treatments-page">
      <NavigationBar />
      <main className="treatments">
        <div className="treatments__hero">
          <h1 className="treatments__title">Behandlinger</h1>
          <h2 className="treatments__subtitle">Knipetak - En muskelterapaut på hjul!</h2>
        </div>
  
        <section className="treatments__overview">
          <div className="treatments__ticker-wrapper">
            <motion.div
              className="treatments__ticker"
              animate={{
                x: ["100%", "-100%"],
              }}
              transition={{
                duration: 30,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              <img
                className="treatments__ticker-image"
                src="/src/assets/images/MassasjeBåt.jpg"
                alt="Massasje behandling"
              />
              <img
                className="treatments__ticker-image"
                src="/src/assets/images/Massasje2.jpg"
                alt="Massasje behandling"
              />
              <img
                className="treatments__ticker-image"
                src="/src/assets/images/KnipetakMassasje.jpg"
                alt="Massasje behandling"
              />
            </motion.div>
          </div>
  
          <h3 className="treatments__section-title">
            Massasje kan benyttes ved følgende tilstander:
          </h3>
  
          <div className="treatments__buttons">
            {Object.entries(treatmentData).map(([key, section]) => (
              <motion.button
                key={key}
                className={`treatments__toggle-button ${
                  activeSection === key ? "treatments__toggle-button--active" : ""
                }`}
                onClick={() => toggleSection(key as TreatmentType)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  backgroundColor: activeSection === key ? "#5da1ac" : "#6fb5c0",
                }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === key ? `▼ ${section.title}` : `▶ ${section.title}`}
              </motion.button>
            ))}
          </div>
  
          <motion.div
            className="treatments__grid-container"
            animate={{
              height: isActive ? height : 0,
              opacity: isActive ? 1 : 0,
            }}
            initial={false}
            transition={{
              height: { duration: 0.5, ease: "easeInOut" },
              opacity: { duration: 0.4, ease: "easeInOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            <div ref={contentRef}>
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.div
                    className="treatments__grid"
                    key={activeSection}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    {currentContent?.content.map((item, index) => (
                      <motion.article
                        key={item.heading}
                        className="treatments__card"
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <h3 className="treatments__card-title">{item.heading}</h3>
                        <p className="treatments__card-text">{item.description}</p>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
    </>
  );
}  

export default TreatmentsPage;

