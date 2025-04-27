import React from "react";
import "./RatingsComponent.css";

const RatingsComponent: React.FC = () => {
  const reviews = [
    {
      author: "Mette",
      reviewText: "Skikkelig fornøyd",
      feedback:
        "Helene i Knipetak gir utrolig bra opplevelse både med sin gode massasje og sitt fine vesen. Hun lytter og tilpasser behandling etter dine behov, enten det er plager/smerter eller behandling ifbm å vedlikeholde et aktivt treningsliv. Du føler deg sett, trygg og oppnår avslapning og hvile i hennes hender! Jeg er skikkelig fornøyd!",
    },
    {
      author: "Consumer",
      reviewText: "Må oppleves",
      feedback:
        "Helene hos Knipetak er utrolig flink og profesjonell. Hun lytter til kunden sine og viser er genuint interessert for å finne årsaken til plagene. Hun har hjulpet meg. Kan virkelig anbefale Helene og knipetak",
    },
    {
      author: "Rune Johansen",
      reviewText: "Kjempe god behandling.",
      feedback:
        "Kjempe god behandling. Lever opp til navnet Knipetak da det ikke var pusebehandling. Flink dyktig massør som kom til avtalt tid.",
    },
  ];

  return (
    <div className="Reviews">
      {reviews.map((review, index) => (
        <div className="Review" key={index}>
          <p className="author">{review.author}</p>
          <div className="Stars">
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
          </div>
          <p className="ReviewText">
            <strong>{review.reviewText}</strong>
          </p>
          <div className="Feedback">{review.feedback}</div>
        </div>
      ))}
    </div>
  );
};

export default RatingsComponent;
