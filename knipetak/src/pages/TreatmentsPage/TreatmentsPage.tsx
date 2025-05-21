import { useState, useRef, useEffect } from "react";
import { TreatmentType } from "../../interfaces/treatment.interface";
import { treatmentData } from "../../data/treatmentData";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-solid-svg-icons";
import "./TreatmentsPage.css";
import massasje_stol from "../../assets/images/massasje_stol.jpg";
import massasje_bat from "../../assets/images/MassasjeBat.png";
import knipetap_behandling from "../../assets/images/knipetak_behandling.jpg";

function TreatmentsPage() {
  const [activeSection, setActiveSection] = useState<TreatmentType | null>(
    null,
  );
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleSection = (section: TreatmentType) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleBookClick = () => {
    navigate("/book");
  };

  const isActive = activeSection !== null;
  const currentContent = activeSection ? treatmentData[activeSection] : null;

  useEffect(() => {
    if (isActive && contentRef.current) {
      // Add a small delay to ensure the content is rendered before scrolling
      setTimeout(() => {
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [activeSection, isActive]);

  return (
    <div className="treatments-page">
      <div className="treatments__hero">
        <div className="treatments__hero-content">
          <h1 className="treatments__title">Behandlinger</h1>
          <h2 className="treatments__subtitle">
            Knipetak - En muskelterapaut på hjul!
          </h2>
          <div className="treatments__hero-description">
            <p>
              Opplev profesjonell massasje og behandling i komforten av ditt
              eget hjem.
            </p>
            <p>
              Vi tilbyr skreddersydde behandlinger for dine spesifikke behov.
            </p>
          </div>
        </div>
        <div className="treatments__hero-image">
          <img
            src={massasje_stol}
            alt="Massasje behandling"
            draggable="false"
          />
        </div>
      </div>

      <section className="treatments__overview">
        <div className="treatments__content">
          <h3 className="treatments__section-title">
            Massasje kan benyttes ved følgende tilstander:
          </h3>

          <div className="treatments__categories">
            {Object.entries(treatmentData).map(([key, section]) => (
              <div
                key={key}
                className={`treatments__category ${
                  activeSection === key ? "treatments__category--active" : ""
                }`}
                onMouseEnter={() => setIsHovered(key)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <button
                  className={`treatments__toggle-button ${
                    activeSection === key
                      ? "treatments__toggle-button--active"
                      : ""
                  }`}
                  onClick={() => toggleSection(key as TreatmentType)}
                  aria-expanded={activeSection === key}
                >
                  <span className="treatments__button-icon">
                    {activeSection === key ? "▼" : "▶"}
                  </span>
                  <span className="treatments__button-text">
                    {section.title}
                  </span>
                </button>
                {isHovered === key && !isActive && (
                  <div className="treatments__category-preview">
                    <p>{section.content[0].description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="treatments__grid-container"
            style={{
              height: isActive ? "auto" : "0",
              opacity: isActive ? 1 : 0,
            }}
          >
            <div ref={contentRef}>
              {currentContent && (
                <div className="treatments__grid">
                  {currentContent.content.map((item, index) => (
                    <article key={index} className="treatments__card">
                      <div className="treatments__card-content">
                        <h3 className="treatments__card-title">
                          {item.heading}
                        </h3>
                        <p className="treatments__card-text">
                          {item.description}
                        </p>
                      </div>
                      <div className="treatments__card-decoration"></div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="treatments__gallery">
          <div className="treatments__gallery-item">
            <img
              src={massasje_bat}
              alt="Massasje behandling"
            />
            <div className="treatments__gallery-overlay">
              <h3>Profesjonell Massasje</h3>
              <p>Skreddersydd for dine behov</p>
            </div>
          </div>
          <div className="treatments__gallery-item">
            <img
              src={knipetap_behandling}
              alt="Massasje behandling"
            />
            <div className="treatments__gallery-overlay">
              <h3>Muskelterapi</h3>
              <p>Lindring og gjenoppbygging</p>
            </div>
          </div>
        </div>
      </section>

      <section className="treatments__cta">
        <div className="treatments__cta-content">
          <h2>Klar for en avslappende behandling?</h2>
          <p>Book en time i dag og opplev forskjellen</p>
          <button
            className="treatments__cta-button"
            onClick={handleBookClick}
            aria-label="Book Time"
          >
            <FontAwesomeIcon icon={faCalendarCheck} className="cta-icon" />
            <span>Book Time</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default TreatmentsPage;
