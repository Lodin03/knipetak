import React from "react";
import "./InfoComponent.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faAward,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import CTABook from "./CTA-Book/Cta-Book";

const InfoComponent: React.FC = () => {
  return (
    <div className="info-page">
      <div className="content-wrapper">
        {/* Introduction Section */}
        <div className="intro-section">
          <div className="intro-content">
            <div className="intro-text">
              <h2 className="greeting">Hei!</h2>
              <p className="name-intro">
                Mitt navn er Helene og er muskelterapeut.
              </p>
              <p className="additional-intro">
                Jeg er tilgjengelig til å komme der hvor du er. Det vil derfor
                si at jeg kan komme til deres bedrift eller deres hjem. Jeg har
                både benk og stol med meg.
              </p>
            </div>
            <div className="intro-image">
              <img
                src="/src/assets/images/Massasje2.jpg"
                alt="Helene muskelterapeut"
              />
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="benefits-container">
          <div className="benefit-box">
            <div className="benefit-icon">
              <FontAwesomeIcon icon={faLocationDot} />
            </div>
            <h3>Fleksibel Behandling</h3>
            <p>
              Kommer til deg - enten på jobb eller hjemme. Tilpasser
              behandlingen etter dine behov.
            </p>
          </div>
          <div className="benefit-box">
            <div className="benefit-icon">
              <FontAwesomeIcon icon={faAward} />
            </div>
            <h3>Profesjonell Erfaring</h3>
            <p>
              Lang erfaring med ulike behandlingsformer og teknikker for best
              mulig resultat.
            </p>
          </div>
          <div className="benefit-box">
            <div className="benefit-icon">
              <FontAwesomeIcon icon={faUserGear} />
            </div>
            <h3>Personlig Tilpasning</h3>
            <p>
              Hver behandling er skreddersydd til dine spesifikke behov og
              ønsker.
            </p>
          </div>
        </div>
      </div>

      {/* Full width additional info section */}
      <div className="full-width-section">
        <div className="content-wrapper">
          <div className="additional-info">
            <p>
              Noen massasjebehandlinger krever en liggende massasje, mens andre
              massasjebehandlinger krever at du sitter på en stol. Jeg har både
              stol og benk i bilen. Gi gjerne beskjed hvilken type behandling du
              ønsker ved bestilling.
            </p>

            <div className="treatment-types">
              <div className="treatment-type">
                <h4>Massasje på stol</h4>
                <p>
                  Utføres med klær, uten olje på en ergonomisk tilpasset stol.
                  Enkelt, behagelig og tidseffektivt.
                </p>
              </div>
              <div className="treatment-type">
                <h4>Massasje på benk</h4>
                <p>
                  Utføres med olje /flytende voks (bievoks) direkte på huden.
                  Foregår liggende på behandlerbenk.
                </p>
              </div>
            </div>

            <CTABook />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoComponent;
