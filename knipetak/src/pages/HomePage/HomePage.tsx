import React from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import "../HomePage/HomePage.css"
import { useEffect, useState } from 'react';

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = ["/src/assets/images/BildeMassasje.jpg",
"/src/assets/images/Massasje2.jpg"]
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 2)},3000) 
    return () => clearInterval(slideInterval);
  }, [])

  return (
    <>
    <NavigationBar />

    <>
    
      

     
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
            <img className="Image" src='/src/assets/images/KnipetakBil.jpg' alt="massasjebilde" height="175px" width= "230px" ></img>
            <img className="Image" src="/src/assets/images/KnipetakMassasje.jpg" alt="massasjebilde" height="155px" width="230px"></img>
            </div>
            <div className="ImageRow">
            <img className="Image" src="/src/assets/images/KnipetakBilde.jpg" alt="massasjebilde" height="350px" width="240px"></img>
            </div>
          


        </div>


          
          
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
            <img className="Image2" src="/src/assets/images/BildeMassasje.jpg" alt="massasjebilde" height="350px" width="240px"></img>
            <img className="Image2" src="/src/assets/images/Massasje2.jpg" alt="massasjebilde" height="350px" width="240px"></img>
          </div>
          
          </div> 
            </div>
            <div className='SlideShowImage'>
{slides.map((src, index) => (
<img
key = {index}
className = {`slide ${currentSlide === index ? "active" : ""}`}
src = {src}
alt="massasjebilde"
height="600px"
width = "350px"
/>

))}
</div>
        </div>
        
        <div className='imageSlideshow'>
        <img className="slide" src="/src/assets/images/BildeMassasje.jpg" alt="massasjebilde" height="500px" width="300px"></img>
        <img className="slide" src="/src/assets/images/Massasje2.jpg" alt="massasjebilde" height="500px" width="300px"></img>


        </div>
        
        <script src='SlideShow.js'></script>
    


    
        
      

      
    </>
  
    <Footer />
    </>
  );
};

export default HomePage;