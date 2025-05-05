import "./PrivacyPage.css";

function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-page__container">
        <h1 className="privacy-page__title">Personvernerklæring</h1>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            1. Innledning og formål
          </h2>
          <p className="privacy-page__text">
            Knipetak er opptatt av å beskytte dine personopplysninger. Denne
            personvernerklæringen beskriver hvordan vi samler inn, bruker og
            beskytter personopplysningene dine når du bruker våre tjenester. Vi
            behandler dine personopplysninger i samsvar med den norske
            personopplysningsloven og EUs personvernforordning (GDPR).
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            2. Behandlingsansvarlig
          </h2>
          <p className="privacy-page__text">
            Knipetak er ansvarlig for behandlingen av personopplysninger som
            samles inn gjennom vår nettside og booking-system. Du kan kontakte
            oss på:
          </p>
          <p className="privacy-page__text">
            E-post: post@knipetak.no
            <br />
            Telefon: +47 474 74 747
            <br />
            Adresse: Muskelveien 12, 0000 Oslo
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            3. Hvilke personopplysninger vi behandler
          </h2>
          <p className="privacy-page__text">
            Vi samler inn og behandler følgende typer personopplysninger:
          </p>
          <ul className="privacy-page__list">
            <li>Kontaktinformasjon (navn, e-postadresse, telefonnummer)</li>
            <li>Fødselsdato</li>
            <li>Helseinformasjon relatert til muskelskader og behandling</li>
            <li>Informasjon om tidligere behandlinger</li>
            <li>IP-adresse og informasjon om din bruk av nettsiden</li>
          </ul>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            4. Formål med behandlingen
          </h2>
          <p className="privacy-page__text">
            Vi behandler dine personopplysninger for følgende formål:
          </p>
          <ul className="privacy-page__list">
            <li>
              For å administrere dine bookinger og gi deg best mulig behandling
            </li>
            <li>For å kommunisere med deg om dine timer og behandlinger</li>
            <li>For å sende deg relevant informasjon om våre tjenester</li>
            <li>For å forbedre våre tjenester og nettside</li>
            <li>
              For å overholde lovpålagte forpliktelser innen helsesektoren
            </li>
          </ul>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            5. Rettslig grunnlag for behandling
          </h2>
          <p className="privacy-page__text">
            Vi behandler dine personopplysninger basert på følgende rettslige
            grunnlag:
          </p>
          <ul className="privacy-page__list">
            <li>Ditt samtykke</li>
            <li>Oppfyllelse av avtale (behandlingskontrakt)</li>
            <li>Rettslige forpliktelser som gjelder for helsetjenester</li>
            <li>
              Vår berettigede interesse i å drive og forbedre våre tjenester
            </li>
          </ul>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            6. Lagring og sikkerhet
          </h2>
          <p className="privacy-page__text">
            Vi oppbevarer dine personopplysninger så lenge det er nødvendig for
            å oppfylle formålene beskrevet ovenfor, eller så lenge det er
            påkrevd av loven. For helseopplysninger følger vi
            helsepersonellovens krav om oppbevaring av pasientjournaler.
          </p>
          <p className="privacy-page__text">
            Vi har implementert tekniske og organisatoriske sikkerhetstiltak for
            å beskytte dine personopplysninger mot uautorisert tilgang, tap
            eller endring. Kun autorisert personell har tilgang til dine
            helseopplysninger.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            7. Deling av personopplysninger
          </h2>
          <p className="privacy-page__text">
            Vi deler kun dine personopplysninger med:
          </p>
          <ul className="privacy-page__list">
            <li>
              Behandlere som er ansatt hos oss og som trenger informasjonen for
              å kunne gi deg best mulig behandling
            </li>
            <li>
              Leverandører av IT-tjenester som hjelper oss med å drifte våre
              systemer (under strenge databehandleravtaler)
            </li>
            <li>Offentlige myndigheter når det er påkrevet ved lov</li>
          </ul>
          <p className="privacy-page__text">
            Vi selger aldri dine personopplysninger til tredjeparter og deler
            dem ikke for markedsføringsformål uten ditt uttrykkelige samtykke.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">8. Dine rettigheter</h2>
          <p className="privacy-page__text">
            Som bruker av våre tjenester har du følgende rettigheter:
          </p>
          <ul className="privacy-page__list">
            <li>Rett til innsyn i dine personopplysninger</li>
            <li>Rett til å korrigere uriktige opplysninger</li>
            <li>
              Rett til å få opplysninger slettet (med unntak av lovpålagte
              journalopplysninger)
            </li>
            <li>Rett til å begrense behandlingen</li>
            <li>Rett til dataportabilitet</li>
            <li>Rett til å trekke tilbake samtykke</li>
            <li>Rett til å klage til Datatilsynet</li>
          </ul>
          <p className="privacy-page__text">
            For å utøve dine rettigheter, vennligst kontakt oss på
            post@knipetak.no.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            9. Cookies og sporingsteknologi
          </h2>
          <p className="privacy-page__text">
            Vår nettside bruker cookies for å forbedre brukeropplevelsen.
            Cookies er små tekstfiler som lagres på din enhet når du besøker
            nettsiden. Vi bruker cookies for å huske dine preferanser, analysere
            hvordan du bruker nettsiden, og for å tilpasse innhold.
          </p>
          <p className="privacy-page__text">
            Du kan når som helst endre dine cookie-innstillinger i nettleseren
            din. Vær oppmerksom på at blokkering av cookies kan påvirke
            funksjonaliteten til nettsiden.
          </p>
        </section>

        <section className="privacy-page__section">
          <h2 className="privacy-page__section-title">
            10. Endringer i personvernerklæringen
          </h2>
          <p className="privacy-page__text">
            Vi forbeholder oss retten til å oppdatere denne
            personvernerklæringen ved behov. Ved vesentlige endringer vil vi
            informere deg via e-post eller ved varsel på vår nettside. Vi
            oppfordrer deg til å regelmessig sjekke denne siden for
            oppdateringer.
          </p>
        </section>

        <p className="privacy-page__last-updated">
          Sist oppdatert: {new Date().toLocaleDateString("nb-NO")}
        </p>
      </div>
    </div>
  );
}

export default PrivacyPage;
