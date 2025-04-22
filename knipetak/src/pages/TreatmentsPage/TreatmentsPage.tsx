import { useState } from "react";
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import { TreatmentType } from '../../interfaces/treatment.interface';
import { treatmentSections } from '../../data/treatmentData';
import './TreatmentsPage.css';

function TreatmentsPage() {
  const [activeSection, setActiveSection] = useState<TreatmentType | null>(null);

  const toggleSection = (section: TreatmentType) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <>
      <NavigationBar />
      <main className="treatments">
        <div className="treatments__hero">
          <h1 className="treatments__title">Behandlinger</h1>
          <h2 className="treatments__subtitle">Knipetak - En muskelterapaut på hjul!</h2>
        </div>

        <section className="treatments__overview">
          
          <div className="treatments__header">
          <img 
              className="treatments__image" 
              src="/src/assets/images/MassasjeBåt.jpg" 
              alt="Massasje behandling"
            />
          <div className="ContainerTreatmentPage">
        <div className="TextContainerTreatment">
        <h3 className="text"> Massasje kan ha ein rekke positive virkninger på fysisk og mental helse. Gjennom gjennomførte bevegelser som er målrettet mot slitne, skadet eller stresset led og muskulatur kan føre til redusering av smerte, samt bidra mentalt med å lindre angst og kanskje til og med depresjon.
              </h3>
          </div>
          <div className="TextContainerTreatment">
        <h3 className="text"> Massasje gjøres ofte med eit skikkelig "knipetak" for å gi best mulig behandling. Her vil massasjen påføres med stramme, men også trygge grep, og massasjen vil være tilpasset toleransenivå, slik at hver person får en god og behagelig opplevelse over utført massasje.
              </h3>
          </div>
        </div>
          
          </div>
      


          <h3 className="treatments__section-title">
            Massasje kan benyttes ved følgene tilstander:
          </h3>

          <div className="treatments__buttons">
            {Object.entries(treatmentSections).map(([key, section]) => (
              <button
                key={key}
                className="treatments__toggle-button"
                onClick={() => toggleSection(key as TreatmentType)}
              >
                {activeSection === key ? `▼ ${section.title}` : `▶ ${section.title}`}
              </button>
            ))}
          </div>

          {activeSection && (
            <div className="treatments__grid">
              {treatmentSections[activeSection].content.map((item, index) => (
                <article key={index} className="treatments__card">
                  <h3 className="treatments__card-title">{item.heading}</h3>
                  <p className="treatments__card-text">{item.description}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default TreatmentsPage;