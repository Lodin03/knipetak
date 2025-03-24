import NavigationBar from "../../components/NavigationBar/NavigationBar";
import Footer from "../../components/Footer/Footer";
import "../TreatmentPage/TreatmentPage.css"
import { useState } from "react";

const TreatmentPage = () => {
const [open, SetOpen] = useState(false)
const [health, setHealth] = useState (false)
const [prevention, setPrevention] = useState(false)
return(
    <div className="Container">
   
    <>
    <NavigationBar />


    

    <div className="mainContentTreatment">
        <h1 className="title">Knipetak - En muskelterapaut på hjul!</h1>
        <br></br>
<div className="containerTreatement">

<h1 className="TextTreatment"> MuskelTerapi  </h1>
<img className="image" src="/src/assets/images/MassasjeBåt.jpg"/>
</div>
< br></br>
<h2 className="InfoTitle"> Massasje kan benyttes ved følgene tilstander: </h2>
<br></br>

<div className="button-Container">
<button className="button-toggle" onClick={() => SetOpen(!open)}>
        {open ? "▼ Smerter " : "▶ Smerter"}
        </button>
        

        
<button className="button-toggle" onClick={() => setHealth(!health)}>
        {health ? "▼ Helse " : "▶ Helse"}
        </button>

        <button className="button-toggle" onClick={() => setPrevention(!prevention)}>
        {prevention ? "▼ Forebygging " : "▶ Forebygging"}
        </button>
        </div>
        <br></br>
{open && (
<div className="boxes">
<div className="boxTreatment">
<h3 className="Textbox">  Smerter 
    <br></br>
    <br></br>
Massasje lindrer og forebygger smerter og andre plager som stammer fra anspent / forkortet muskulatur, herunder myoser og triggerpunkter. 
Muskelrelaterte smerter kan kureres med massasje. Andre smertetilstander kan lindres eller forebygges med massasje </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Smerter i skuldre, nakke og rygg
    <br></br>
    <br></br>
    Smerter i skuldre, nakke og rygg kan reduseres eller forsvinne helt dersom smertene er forårsaket av anspent muskulatur eller irriterte nerver grunnet slike spenninger. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Sårhet i muskulaturen grunnet overanstrengelse
    <br></br>
    <br></br>
    Sårhet i musklaturen grunnet overanstrengelse kan reduseres og forebygges. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Hodepine og slitne øyne
    <br></br>
    <br></br>
    Hodepine og slitne øyne for eksempel grunnet mye arbeid ved datamaskin kan reduseres. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Etter skade eller inngrep
    <br></br>
    <br></br>
    Massasje kan fremskynde helingsprosessen. Men massasje gis aldri direkte på området før etter at sår har grodd. Visse massasjeteknikker kan redusere dannelsen av arrvev. </h3>
</div>
</div>
)}

{health && (
    <div className="boxes">
    <div className="boxTreatment">
    <h3 className="Textbox">  Mildt og moderat forhøyet blodtrykk
    <br></br>
    <br></br>
    Mildt og moderat forhøyet blodtrykk kan senkes midlertidig etter massasje </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox"> Behov for restitusjon
    <br></br>
    <br></br>
    Massasje virker forebyggende på muskelplager, og øker restitusjonen i muskulatur etter trening raskere enn ved hvile. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Man kan oppleve fornyet trivsel, selvtillit og kontroll i eget liv
    <br></br>
    <br></br>
    På grunn av den positive effekten på nervesystemet, nevrotransmittere og fysiske og psykiske spenninger kan man ved regelmessig massasje oppleve fornyet trivsel, sevtillit og kontroll i eget liv. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Søvnproblemer
    <br></br>
    <br></br>
    Det generelle nivået av avspenning økes ofte i stor grad etter massasje. Hvis årsaken til søvnproblemene er fysiske eller psykiske spenninger, vil man ofte oppleve forbedret søvnkvalitet ved regelmessig massasje. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Nedsatt sirkulasjon
    <br></br>
    <br></br>
    Kroppens væskesirkulasjon forbedres etter massasje. Dette gir økt tilgang på næringsstoffer og oksygen, og økt utskillelse av avfallsstoffer fra kroppens celler og vev. </h3>
</div>
</div>
)}
{prevention && (
<div className="boxes">
    <div className="boxTreatment">
    <h3 className="Textbox">  Redusere fine linjer mindre rynker i ansiktet
    <br></br>
    <br></br>
    Ansiktsmassasje kan redusere fine linjer/mindre rynker og forbedre hudens utseende. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox"> Stress
    <br></br>
    <br></br>
    Når spenninger i kroppen slipper taket vil man ofte lettere kunne håndtere hverdagens plikter og oppgaver. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox"> Mental og fysisk utmattelse
    <br></br>
    <br></br>
    Man kan oppleve økt energi og motivasjon etter massasje. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox"> Muskelspasmer og kramper
    <br></br>
    <br></br>
    Muskelspasmer og kramper kan dempes eller forsvinne. </h3>
</div>
<div className="boxTreatment">
<h3 className="Textbox">  Treg fordøyelse
    <br></br>
    <br></br>
    Massasje kan øke næringsopptak og utskillelse som en konsekvens av økt generell væskesirkulasjon og avspenning. </h3>
</div>
</div>
)}

</div>







  
    <Footer />
    </>
    </div>
    
)
}

export default TreatmentPage;