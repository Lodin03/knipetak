import React from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import "../HomePage/HomePage.css"
import { useEffect, useState } from 'react';

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [progress, setProgress] = useState(0)
  const slides = ["/src/assets/images/BildeMassasje.jpg",
"/src/assets/images/Massasje2.jpg", 
"/src/assets/images/KnipetakBilde.jpg"]



  useEffect(() => {
    const slideInterval = setInterval(() => {
      setProgress(prev =>  {
      if (prev >=  100) {
      setCurrentSlide((prevSlides) => (prevSlides + 1) % slides.length)
      return 0;
      }
  return prev + 1;
})
}, 30)
    return () => clearInterval(slideInterval);
  }, [slides.length])

  const nextSlides = () => {
    if (currentSlide < slides.length - 1) {
    setCurrentSlide((prev => (prev + 1 ) % slides.length))
    setProgress(0)
    }
  }

  const prevSlides = () => {
    if (currentSlide > 0) {
    setCurrentSlide((prev) => (prev - 1 + slides.length ) % slides.length)
    setProgress(0)
  }
}

  return (
    <>
    <NavigationBar />
      <div className="mainContentHomepage">
        <h1 className="title">Knipetak - En muskelterapaut på hjul!</h1>
        <br></br>

      
        <div className="ContainerHomePage">
        <div className="TextContainer">
        <h3 className="text">Mitt navn er Helene og er muskelterapeut. Jeg er tilgjengelig til å komme der hvor du er. Det vil derfor si at jeg kan komme til deres bedrift eller deres hjem. 
              Jeg har både benk og stol med meg.
              <br></br>
              <br></br>
              Muskelterapi hjemme er perfekt for de som blant annet har utfordringer med å komme seg ut, og som sliter med diverse muskelproblemer. 
              <br></br>
              <br></br>
              I tillegg møter jeg opp på ulike eventer. Massasje kan være et annerledes og unikt innslag på et event. Jeg kan derfor bookes inn til utdrikningslag og bursdager.</h3>
          </div>
          <div className="ImageContainer">
            <img className="Image" src='/src/assets/images/KnipetakBil.jpg' alt="massasjebilde" ></img>
            <img className="Image1" src="/src/assets/images/KnipetakMassasje.jpg" alt="massasjebilde"></img>
            </div>
            <div className="ImageRow">
            <img className="Image2" src="/src/assets/images/KnipetakBilde.jpg" alt="massasjebilde" height="350px" width="240px"></img>
            </div>
        </div>
<br></br>
<br></br>
<p className='tickerText'><strong> Kommende eventer  </strong> </p>
<div className='ticker-wrapper'>
         <div className='ticker'>
          <div className='tickerInfo'>
           
          <p> Myrkdalen Hotel: 9-13 Mars. Bestill nå </p>
          <img className='imageTicker' src='/src/assets/images/Myrkdalen.jpg'></img>
          </div>
          <div className='tickerInfo'>
          <p> Thon Hotels: 17-20 Mars. Bestill nå </p>
          <img className='imageTicker' src='/src/assets/images/finsehytta.jpg'></img>
          </div>
          <div className='tickerInfo'>
          <p> Elverum Hundeløp: 9-15 April. Bestill nå </p>
          <img className='imageTicker' src='/src/assets/images/KnipetakHelene.jpg'></img>
          </div>
          <div className='tickerInfo'>
          <p> Thon Hotels: 17-20 Mars. Bestill nå </p>
          <img className='imageTicker' src='/src/assets/images/finsehytta.jpg'></img>
          </div>
          <div className='tickerInfo'>
           
           <p> Myrkdalen Hotel: 9-13 Mars. Bestill nå </p>
           <img className='imageTicker' src='/src/assets/images/Myrkdalen.jpg'></img>
           </div>
           <div className='tickerInfo'>
           <p> Thon Hotels: 17-20 Mars. Bestill nå </p>
           <img className='imageTicker' src='/src/assets/images/finsehytta.jpg'></img>
           </div>
           <div className='tickerInfo'>
           <p> Elverum Hundeløp: 9-15 April. Bestill nå </p>
           <img className='imageTicker' src='/src/assets/images/KnipetakHelene.jpg'></img>
           </div>
           <div className='tickerInfo'>
           <p> Thon Hotels: 17-20 Mars. Bestill nå </p>
           <img className='imageTicker' src='/src/assets/images/finsehytta.jpg'></img>
           </div>
           
         
         </div>
        </div>

        
        <br></br>
        <br></br>

        <div className="ContainerHomePage2">
          <div className="TextContainer2">
            <h3 className="text2">Noen massasjebehandlinger krever en liggende massasje, mens andre massasjebehandlinger krever at du sitter på en stol. Jeg har både stol og benk i bilen. Gi gjerne beskjed hvilken type behandling du ønsker deg. 
<br></br>
<br></br>
Massasje på stol – utføres med klær, uten olje på en ergonomisk tilpasset stol. Enkelt, behagelig og tidseffektivt.
<br></br>
<br></br>
Massasje på benk – utføres med olje /flytende voks (bievoks) direkte på huden. Foregår liggende på behandlerbenk.</h3>
          </div>
          <div className="ImageWrap">
          <div className="ImageContainer2">
            <img className="Image3" src="/src/assets/images/BildeMassasje.jpg" alt="massasjebilde" height="350px" width="240px"></img>
            <img className="Image3" src="/src/assets/images/Massasje2.jpg" alt="massasjebilde" height="350px" width="240px"></img>
          </div>
          
          </div> 
            </div>
            <div className='SlideShowImage'>
             
              <div className='SlideShowButtons'>
            <button onClick={prevSlides}> {"<"} </button>
            </div>
            <div className='SequenceContainer'>
            
{slides.map((src, index) => (
  

<img

key = {index}
className = {`slide ${currentSlide === index ? "active" : "hidden"}`}
src = {src}
alt="massasjebilde"
height="550px"
width = "350px"
/>


))}
<div className='ProgressBarContainer'>
              <div className='ProgressBar' style={{width: `${progress}%` }}/>
              </div>
</div>
<div className='SlideShowButtons'>
  <button onClick={nextSlides}> {">"} </button>
  </div>


</div>
<div className='Reviews'>
          <div className='Review'>
          <p className='author'> Mette</p>
          <div className='Stars'>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        </div>
        <p className='ReviewText'></p>
        <p className='ReviewText'><strong> Skikkelig fornøyd </strong></p>
        <br></br>
        <p className='Feedback'> Helene i Knipetak gir utrolig bra opplevelse både med sin gode massasje og sitt fine vesen. Hun lytter og tilpasser behandling etter dine behov, enten det er plager/smerter eller behandling ifbm å vedlikeholde et aktivt treningsliv.
Du føler deg sett, trygg og oppnår avslapning og hvile i hennes hender!
Jeg er skikkelig fornøyd!</p>
<br></br>
</div>
<div className='Review'>
<p className='author'> Consumer</p>
<div className='Stars'>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        </div>
        <p className='ReviewText'></p>
        <p className='ReviewText'> <strong> Må oppleves </strong></p>
        <br></br>
        <p className='Feedback'> Helene hos Knipetak er utrolig flink og profesjonell. Hun lytter til kunden sine og viser er genuint interessert for å finne årsaken til plagene. Hun har hjulpet meg. Kan virkelig anbefale Helene og knipetak</p>
        <br></br>
</div>
<div className='Review'>
  <p className='author'> Rune Johansen</p>
  <div className='Stars'>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        <span className='star'>&#9733;</span>
        </div>
        <p className='ReviewText'> <strong> Kjempe god behandling.</strong></p>
        <br></br>
        <p className='Feedback'> 
          Kjempe god behandling. Lever opp til navnet Knipetak da det ikke var pusebehandling
Flink dyktig massør som kom til avtalt tid.</p>
        <br></br>
</div>
        </div>
        <br></br>
        </div>
        
        <div className='imageSlideshow'>
        <img className="slide" src="/src/assets/images/BildeMassasje.jpg" alt="massasjebilde"></img>
        <img className="slide" src="/src/assets/images/Massasje2.jpg" alt="massasjebilde" ></img>
        <img className="slide" src="/src/assets/images/KnipetakBilde.jpg" alt="massasjebilde" ></img>

        </div>
        
        <script src='SlideShow.js'></script>

        
      
    <Footer />
    </>
  );
};

export default HomePage;